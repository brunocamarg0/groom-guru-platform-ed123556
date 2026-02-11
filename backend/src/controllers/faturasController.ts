import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { MercadoPagoConfig, Preference } from 'mercadopago';

interface AuthRequest extends Request {
  userId?: string;
  userType?: string;
  barbeariaId?: string;
}

// Configurar cliente do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: {
    timeout: 5000,
  },
});

const preference = new Preference(client);

/**
 * GET /api/dono/assinatura/faturas
 * Listar faturas do dono logado
 */
export async function listarMinhasFaturas(req: AuthRequest, res: Response) {
  try {
    if (!req.barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    // Buscar assinatura da barbearia
    const assinatura = await prisma.assinatura.findUnique({
      where: { barbeariaId: req.barbeariaId },
      include: {
        plano: true,
      },
    });

    if (!assinatura) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    // Buscar faturas
    const faturas = await prisma.fatura.findMany({
      where: { assinaturaId: assinatura.id },
      orderBy: {
        dataVencimento: 'desc',
      },
    });

    res.json({
      assinatura: {
        id: assinatura.id,
        status: assinatura.status,
        plano: assinatura.plano,
        dataVencimento: assinatura.dataVencimento,
        proximoVencimento: assinatura.proximoVencimento,
      },
      faturas,
    });
  } catch (error: any) {
    console.error('Erro ao listar faturas:', error);
    res.status(500).json({ error: 'Erro ao listar faturas' });
  }
}

/**
 * GET /api/dono/assinatura/faturas/:id
 * Buscar fatura específica
 */
export async function buscarFatura(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    if (!req.barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const fatura = await prisma.fatura.findUnique({
      where: { id },
      include: {
        assinatura: {
          include: {
            barbearia: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
            plano: true,
          },
        },
      },
    });

    if (!fatura) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }

    // Verificar se a fatura pertence à barbearia do dono
    if (fatura.assinatura.barbeariaId !== req.barbeariaId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json(fatura);
  } catch (error: any) {
    console.error('Erro ao buscar fatura:', error);
    res.status(500).json({ error: 'Erro ao buscar fatura' });
  }
}

/**
 * POST /api/dono/assinatura/faturas/:id/pagar
 * Criar link de pagamento para fatura
 */
export async function criarLinkPagamento(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { metodoPagamento } = req.body; // pix, boleto, cartao_credito

    if (!req.barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const fatura = await prisma.fatura.findUnique({
      where: { id },
      include: {
        assinatura: {
          include: {
            barbearia: {
              select: {
                id: true,
                nome: true,
                email: true,
                responsavel: true,
              },
            },
          },
        },
      },
    });

    if (!fatura) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }

    // Verificar se a fatura pertence à barbearia do dono
    if (fatura.assinatura.barbeariaId !== req.barbeariaId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    if (fatura.status === 'paga') {
      return res.status(400).json({ error: 'Fatura já foi paga' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Criar preferência de pagamento no Mercado Pago
    const preferenceData = {
      items: [
        {
          id: fatura.id,
          title: `Assinatura ${fatura.assinatura.barbearia.nome} - ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
          description: `Pagamento de assinatura mensal`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: fatura.valor,
        },
      ],
      payer: {
        name: fatura.assinatura.barbearia.responsavel,
        email: fatura.assinatura.barbearia.email || 'barbearia@exemplo.com',
      },
      back_urls: {
        success: `${frontendUrl}/dono/assinatura/pagamento/sucesso?fatura=${id}`,
        failure: `${frontendUrl}/dono/assinatura/pagamento/falha?fatura=${id}`,
        pending: `${frontendUrl}/dono/assinatura/pagamento/pendente?fatura=${id}`,
      },
      auto_return: 'approved',
      external_reference: `fatura_${id}`,
      notification_url: `${process.env.API_URL || 'http://localhost:3001'}/api/faturas/webhook`,
      payment_methods: {
        excluded_payment_types: metodoPagamento === 'pix' 
          ? [{ id: 'credit_card' }, { id: 'debit_card' }, { id: 'ticket' }]
          : metodoPagamento === 'boleto'
          ? [{ id: 'credit_card' }, { id: 'debit_card' }, { id: 'bank_transfer' }]
          : [],
      },
    };

    const response = await preference.create({ body: preferenceData });

    // Atualizar fatura com dados do pagamento
    await prisma.fatura.update({
      where: { id },
      data: {
        metodoPagamento: metodoPagamento || 'cartao_credito',
        mercadoPagoPreferenceId: response.id,
        linkPagamento: response.init_point || response.sandbox_init_point,
      },
    });

    res.json({
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point,
      linkPagamento: response.init_point || response.sandbox_init_point,
      // QR Code PIX será retornado separadamente se necessário
    });
  } catch (error: any) {
    console.error('Erro ao criar link de pagamento:', error);
    res.status(500).json({ error: 'Erro ao criar link de pagamento' });
  }
}

/**
 * GET /api/dono/assinatura/faturas/:id/status
 * Verificar status do pagamento
 */
export async function verificarStatusPagamento(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    if (!req.barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const fatura = await prisma.fatura.findUnique({
      where: { id },
      include: {
        assinatura: true,
      },
    });

    if (!fatura) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }

    // Verificar se a fatura pertence à barbearia do dono
    if (fatura.assinatura.barbeariaId !== req.barbeariaId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json({
      status: fatura.status,
      dataPagamento: fatura.dataPagamento,
      dataVencimento: fatura.dataVencimento,
      linkPagamento: fatura.linkPagamento,
    });
  } catch (error: any) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({ error: 'Erro ao verificar status' });
  }
}

/**
 * POST /api/faturas/webhook
 * Webhook do Mercado Pago para atualizar status da fatura
 */
export async function webhookPagamento(req: Request, res: Response) {
  try {
    const { type, data } = req.body;

    if (type === 'payment') {
      const paymentId = data.id;

      // Buscar fatura pelo external_reference ou payment_id
      const fatura = await prisma.fatura.findFirst({
        where: {
          OR: [
            { mercadoPagoPaymentId: paymentId },
            { mercadoPagoPreferenceId: paymentId },
          ],
        },
        include: {
          assinatura: true,
        },
      });

      if (fatura) {
        // Atualizar status da fatura baseado no status do pagamento
        const statusMap: Record<string, string> = {
          approved: 'paga',
          pending: 'pendente',
          rejected: 'cancelada',
          cancelled: 'cancelada',
        };

        const novoStatus = statusMap[data.status] || 'pendente';

        await prisma.fatura.update({
          where: { id: fatura.id },
          data: {
            status: novoStatus,
            mercadoPagoPaymentId: paymentId,
            mercadoPagoStatus: data.status,
            // payment_type_id pode ser armazenado em metodoPagamento se necessário
            ...(data.payment_type_id && {
              metodoPagamento: data.payment_type_id,
            }),
            ...(novoStatus === 'paga' && {
              dataPagamento: new Date(),
            }),
          },
        });

        // Se pagamento aprovado, renovar assinatura
        if (novoStatus === 'paga') {
          const proximoVencimento = new Date(fatura.assinatura.dataVencimento);
          proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);

          await prisma.assinatura.update({
            where: { id: fatura.assinaturaId },
            data: {
              status: 'ativa',
              dataVencimento: proximoVencimento,
              proximoVencimento: proximoVencimento,
            },
          });

          // Reativar barbearia se estava suspensa
          await prisma.barbearia.update({
            where: { id: fatura.assinatura.barbeariaId },
            data: {
              status: 'ativa',
            },
          });
        }
      }
    }

    res.status(200).send('OK');
  } catch (error: any) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
}

