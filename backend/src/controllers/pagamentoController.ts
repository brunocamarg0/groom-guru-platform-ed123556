import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

// Configurar cliente do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: {
    timeout: 5000,
    idempotencyKey: 'abc',
  },
});

const preference = new Preference(client);
const payment = new Payment(client);

interface AuthRequest extends Request {
  userId?: string;
  userType?: string;
  clienteId?: string;
}

/**
 * Criar preferência de pagamento no Mercado Pago
 */
export async function criarPreferenciaPagamento(req: AuthRequest, res: Response) {
  try {
    const { agendamentoId } = req.body;

    if (!agendamentoId) {
      return res.status(400).json({ error: 'agendamentoId é obrigatório' });
    }

    // Buscar agendamento com serviço e barbearia
    const agendamento = await prisma.agendamento.findUnique({
      where: { id: agendamentoId },
      include: {
        servico: true,
        barbearia: {
          select: {
            id: true,
            nome: true,
          },
        },
        clienteRel: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    // Verificar se já existe pagamento
    const pagamentoExistente = await prisma.pagamento.findUnique({
      where: { agendamentoId },
    });

    if (pagamentoExistente && pagamentoExistente.status === 'pago') {
      return res.status(400).json({ error: 'Este agendamento já foi pago' });
    }

    const valor = agendamento.servico.preco;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Criar ou atualizar pagamento no banco
    const pagamento = await prisma.pagamento.upsert({
      where: { agendamentoId },
      create: {
        agendamentoId,
        valor,
        metodo: 'mercado_pago',
        status: 'pendente',
      },
      update: {
        valor,
        metodo: 'mercado_pago',
        status: 'pendente',
      },
    });

    // Criar preferência no Mercado Pago
    const preferenceData = {
      items: [
        {
          id: agendamento.id,
          title: `${agendamento.servico.nome} - ${agendamento.barbearia.nome}`,
          description: `Agendamento para ${new Date(agendamento.data).toLocaleDateString('pt-BR')} às ${agendamento.horario}`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: valor,
        },
      ],
      payer: {
        name: agendamento.clienteRel?.nome || agendamento.cliente,
        email: agendamento.clienteRel?.email || 'cliente@exemplo.com',
      },
      back_urls: {
        success: `${frontendUrl}/cliente/pagamento/sucesso?agendamento=${agendamentoId}`,
        failure: `${frontendUrl}/cliente/pagamento/falha?agendamento=${agendamentoId}`,
        pending: `${frontendUrl}/cliente/pagamento/pendente?agendamento=${agendamentoId}`,
      },
      auto_return: 'approved',
      external_reference: agendamentoId,
      notification_url: `${process.env.API_URL || 'http://localhost:3001'}/api/pagamentos/webhook`,
    };

    const response = await preference.create({ body: preferenceData });

    // Atualizar pagamento com preference_id
    await prisma.pagamento.update({
      where: { id: pagamento.id },
      data: {
        mercadoPagoPreferenceId: response.id,
      },
    });

    console.log('✅ [MERCADO PAGO] Preferência criada:', response.id);
    console.log('   Agendamento:', agendamentoId);
    console.log('   Valor:', valor);
    console.log('   URL de pagamento:', response.init_point);

    res.json({
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point,
      agendamentoId,
    });
  } catch (error: any) {
    console.error('❌ [MERCADO PAGO] Erro ao criar preferência:', error);
    console.error('   Mensagem:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({
      error: 'Erro ao criar preferência de pagamento',
      message: error.message,
    });
  }
}

/**
 * Webhook do Mercado Pago para atualizar status do pagamento
 */
export async function webhookPagamento(req: Request, res: Response) {
  try {
    const { type, data } = req.body;

    console.log('🔔 [MERCADO PAGO] Webhook recebido:', type);
    console.log('   Data:', JSON.stringify(data, null, 2));

    if (type === 'payment') {
      const paymentId = data.id;
      
      console.log('💳 [MERCADO PAGO] Payment ID:', paymentId);

      // Buscar informações do pagamento no Mercado Pago
      try {
        const paymentData = await payment.get({ id: paymentId });
        
        console.log('💳 [MERCADO PAGO] Payment data:', {
          id: paymentData.id,
          status: paymentData.status,
          status_detail: paymentData.status_detail,
          payment_type_id: paymentData.payment_type_id,
          external_reference: paymentData.external_reference,
        });

        const externalReference = paymentData.external_reference;
        
        if (!externalReference) {
          console.error('❌ [MERCADO PAGO] external_reference não encontrado no pagamento');
          return res.status(400).json({ error: 'external_reference não encontrado' });
        }

        // Buscar pagamento no banco pelo agendamentoId
        const pagamento = await prisma.pagamento.findFirst({
          where: {
            agendamentoId: externalReference,
          },
        });

        if (!pagamento) {
          console.error('❌ [MERCADO PAGO] Pagamento não encontrado no banco para agendamento:', externalReference);
          return res.status(404).json({ error: 'Pagamento não encontrado' });
        }

        // Mapear status do Mercado Pago para status do sistema
        let statusSistema = 'pendente';
        if (paymentData.status === 'approved') {
          statusSistema = 'pago';
        } else if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
          statusSistema = 'cancelado';
        } else if (paymentData.status === 'pending' || paymentData.status === 'in_process') {
          statusSistema = 'em_processamento';
        }

        // Atualizar status do pagamento
        await prisma.pagamento.update({
          where: { id: pagamento.id },
          data: {
            mercadoPagoPaymentId: paymentId.toString(),
            mercadoPagoStatus: paymentData.status,
            mercadoPagoPaymentType: paymentData.payment_type_id,
            status: statusSistema,
            dataPagamento: paymentData.status === 'approved' ? new Date() : null,
          },
        });

        // Se pagamento aprovado, atualizar status do agendamento
        if (paymentData.status === 'approved') {
          await prisma.agendamento.update({
            where: { id: externalReference },
            data: {
              status: 'confirmado',
              formaPagamento: 'online',
            },
          });

          console.log('✅ [MERCADO PAGO] Pagamento aprovado e agendamento confirmado:', externalReference);
        }

        console.log('✅ [MERCADO PAGO] Pagamento atualizado:', externalReference);
      } catch (paymentError: any) {
        console.error('❌ [MERCADO PAGO] Erro ao buscar pagamento:', paymentError);
        // Continuar mesmo se não conseguir buscar o pagamento
      }
    }

    res.status(200).send('OK');
  } catch (error: any) {
    console.error('❌ [MERCADO PAGO] Erro no webhook:', error);
    console.error('   Stack:', error.stack);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
}

/**
 * Verificar status do pagamento
 */
export async function verificarStatusPagamento(req: AuthRequest, res: Response) {
  try {
    const { agendamentoId } = req.params;

    const pagamento = await prisma.pagamento.findUnique({
      where: { agendamentoId },
      include: {
        agendamento: {
          include: {
            servico: true,
          },
        },
      },
    });

    if (!pagamento) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    res.json({
      status: pagamento.status,
      mercadoPagoStatus: pagamento.mercadoPagoStatus,
      valor: pagamento.valor,
      metodo: pagamento.metodo,
      dataPagamento: pagamento.dataPagamento,
    });
  } catch (error: any) {
    console.error('❌ [MERCADO PAGO] Erro ao verificar status:', error);
    res.status(500).json({ error: 'Erro ao verificar status do pagamento' });
  }
}

/**
 * Criar pagamento presencial (na barbearia)
 */
export async function criarPagamentoPresencial(req: AuthRequest, res: Response) {
  try {
    const { agendamentoId } = req.body;

    if (!agendamentoId) {
      return res.status(400).json({ error: 'agendamentoId é obrigatório' });
    }

    // Buscar agendamento
    const agendamento = await prisma.agendamento.findUnique({
      where: { id: agendamentoId },
      include: {
        servico: true,
      },
    });

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    // Verificar se já existe pagamento
    const pagamentoExistente = await prisma.pagamento.findUnique({
      where: { agendamentoId },
    });

    if (pagamentoExistente && pagamentoExistente.status === 'pago') {
      return res.status(400).json({ error: 'Este agendamento já foi pago' });
    }

    const valor = agendamento.servico.preco;

    // Criar pagamento presencial (status pendente - será pago na barbearia)
    const pagamento = await prisma.pagamento.upsert({
      where: { agendamentoId },
      create: {
        agendamentoId,
        valor,
        metodo: 'presencial',
        status: 'pendente',
      },
      update: {
        valor,
        metodo: 'presencial',
        status: 'pendente',
      },
    });

    // Atualizar agendamento com forma de pagamento
    await prisma.agendamento.update({
      where: { id: agendamentoId },
      data: {
        formaPagamento: 'presencial',
      },
    });

    console.log('✅ [PAGAMENTO] Pagamento presencial criado:', agendamentoId);

    res.json({
      sucesso: true,
      mensagem: 'Agendamento confirmado. Pagamento será realizado na barbearia.',
      pagamento,
    });
  } catch (error: any) {
    console.error('❌ [PAGAMENTO] Erro ao criar pagamento presencial:', error);
    res.status(500).json({ error: 'Erro ao criar pagamento presencial' });
  }
}

