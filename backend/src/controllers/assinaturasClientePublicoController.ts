import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequestCliente } from '../middleware/authCliente';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Configurar cliente do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: {
    timeout: 5000,
    idempotencyKey: 'abc',
  },
});

const preference = new Preference(client);

/**
 * POST /api/cliente/assinaturas/comprar
 * Cliente compra uma assinatura (cria assinatura e gera link de pagamento)
 */
export async function comprarAssinatura(req: AuthRequestCliente, res: Response) {
  try {
    const clienteId = req.userId;
    const { planoId, barbeariaId, profissionalId } = req.body;

    if (!clienteId) {
      return res.status(401).json({ error: 'Cliente não autenticado' });
    }

    if (!planoId || !barbeariaId) {
      return res.status(400).json({ 
        error: 'planoId e barbeariaId são obrigatórios' 
      });
    }

    // Buscar cliente
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
      },
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Verificar se o plano pertence à barbearia e está ativo
    const plano = await prisma.planoCliente.findFirst({
      where: {
        id: planoId,
        barbeariaId,
        ativo: true,
      },
      include: {
        barbearia: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!plano) {
      return res.status(404).json({ error: 'Plano não encontrado ou inativo' });
    }

    // Verificar se o cliente já tem assinatura ativa
    const assinaturaExistente = await prisma.assinaturaCliente.findUnique({
      where: { clienteId },
    });

    if (assinaturaExistente && assinaturaExistente.status === 'ativa') {
      return res.status(400).json({ 
        error: 'Você já possui uma assinatura ativa. Cancele a atual antes de contratar uma nova.' 
      });
    }

    // Verificar se profissional pertence à barbearia (se fornecido)
    if (profissionalId) {
      const profissional = await prisma.profissional.findFirst({
        where: {
          id: profissionalId,
          barbeariaId,
        },
      });

      if (!profissional) {
        return res.status(404).json({ error: 'Profissional não encontrado' });
      }
    }

    // Calcular datas
    const dataInicio = new Date();
    const dataVencimento = new Date();
    dataVencimento.setMonth(dataVencimento.getMonth() + plano.duracaoMeses);
    const proximoVencimento = new Date(dataVencimento);

    // Criar assinatura (ainda não paga)
    const assinatura = await prisma.assinaturaCliente.create({
      data: {
        clienteId,
        planoId,
        profissionalId: profissionalId || null,
        dataInicio,
        dataVencimento,
        proximoVencimento,
        status: 'pendente', // Pendente até o pagamento ser confirmado
      },
      include: {
        plano: {
          include: {
            barbearia: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
    });

    // Criar primeiro pagamento pendente
    const pagamento = await prisma.pagamentoAssinatura.create({
      data: {
        assinaturaId: assinatura.id,
        valor: assinatura.plano.valor,
        dataVencimento: dataInicio,
        status: 'pendente',
      },
    });

    // Criar preferência de pagamento no Mercado Pago
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    const barbeariaNome = assinatura.plano.barbearia.nome;
    
    const preferenceData = {
      items: [
        {
          id: assinatura.id,
          title: `Assinatura ${assinatura.plano.nome} - ${assinatura.plano.barbearia.nome}`,
          description: `Plano de ${assinatura.plano.duracaoMeses} ${assinatura.plano.duracaoMeses === 1 ? 'mês' : 'meses'}`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: assinatura.plano.valor,
        },
      ],
      payer: {
        name: cliente.nome,
        email: cliente.email,
        ...(cliente.telefone && {
          phone: {
            number: cliente.telefone.replace(/\D/g, ''),
          },
        }),
      },
      back_urls: {
        success: `${frontendUrl}/cliente/assinatura/pagamento/sucesso?assinatura=${assinatura.id}`,
        failure: `${frontendUrl}/cliente/assinatura/pagamento/falha?assinatura=${assinatura.id}`,
        pending: `${frontendUrl}/cliente/assinatura/pagamento/pendente?assinatura=${assinatura.id}`,
      },
      auto_return: 'approved',
      external_reference: assinatura.id,
      notification_url: `${process.env.API_URL || 'http://localhost:3001'}/api/pagamentos-assinatura/webhook`,
      statement_descriptor: 'ASSINATURA',
      expires: true,
      expiration_date_to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
    };

    const response = await preference.create({ body: preferenceData });

    // Atualizar pagamento com preference_id
    await prisma.pagamentoAssinatura.update({
      where: { id: pagamento.id },
      data: {
        mercadoPagoPreferenceId: response.id,
        linkPagamento: response.init_point || response.sandbox_init_point,
      },
    });

    console.log('✅ [ASSINATURA CLIENTE] Preferência criada:', response.id);
    console.log('   Assinatura:', assinatura.id);
    console.log('   Valor:', plano.valor);
    console.log('   URL de pagamento:', response.init_point || response.sandbox_init_point);

    res.json({
      assinatura: {
        id: assinatura.id,
        status: assinatura.status,
        plano: assinatura.plano,
        dataInicio: assinatura.dataInicio,
        dataVencimento: assinatura.dataVencimento,
      },
      pagamento: {
        preferenceId: response.id,
        initPoint: response.init_point || response.sandbox_init_point,
        linkPagamento: response.init_point || response.sandbox_init_point,
      },
    });
  } catch (error: any) {
    console.error('Erro ao comprar assinatura:', error);
    res.status(500).json({ error: 'Erro ao processar compra da assinatura' });
  }
}

