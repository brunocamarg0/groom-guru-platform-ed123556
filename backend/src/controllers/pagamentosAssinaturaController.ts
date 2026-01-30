import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * GET /api/dono/pagamentos-assinatura
 * Listar pagamentos de assinaturas (dono)
 */
export async function listarPagamentosAssinatura(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { status, assinaturaId } = req.query;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const where: any = {
      assinatura: {
        plano: {
          barbeariaId,
        },
      },
    };

    if (status && typeof status === 'string') {
      where.status = status;
    }

    if (assinaturaId && typeof assinaturaId === 'string') {
      where.assinaturaId = assinaturaId;
    }

    const pagamentos = await prisma.pagamentoAssinatura.findMany({
      where,
      include: {
        assinatura: {
          include: {
            cliente: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
            plano: true,
            profissional: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
        comissoes: {
          include: {
            profissional: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
      orderBy: {
        dataVencimento: 'desc',
      },
    });

    res.json(pagamentos);
  } catch (error: any) {
    console.error('Erro ao listar pagamentos de assinatura:', error);
    res.status(500).json({ error: 'Erro ao listar pagamentos de assinatura' });
  }
}

/**
 * POST /api/dono/pagamentos-assinatura/:id/marcar-pago
 * Marcar pagamento como pago e gerar comissão
 */
export async function marcarPagamentoComoPago(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { id } = req.params;
    const { metodoPagamento, observacoes } = req.body;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    // Buscar pagamento
    const pagamento = await prisma.pagamentoAssinatura.findFirst({
      where: {
        id,
        assinatura: {
          plano: {
            barbeariaId,
          },
        },
      },
      include: {
        assinatura: {
          include: {
            profissional: true,
            plano: true,
          },
        },
      },
    });

    if (!pagamento) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    if (pagamento.status === 'paga') {
      return res.status(400).json({ error: 'Pagamento já está marcado como pago' });
    }

    // Atualizar pagamento e gerar comissão em uma transação
    const resultado = await prisma.$transaction(async (tx) => {
      // Atualizar pagamento
      const pagamentoAtualizado = await tx.pagamentoAssinatura.update({
        where: { id },
        data: {
          status: 'paga',
          dataPagamento: new Date(),
          metodoPagamento: metodoPagamento || null,
          observacoes: observacoes || null,
        },
      });

      // Gerar comissão se houver profissional associado
      if (pagamento.assinatura.profissionalId && pagamento.assinatura.profissional) {
        const profissional = pagamento.assinatura.profissional;
        const valorComissao = profissional.comissaoAssinatura || 0;

        if (valorComissao > 0) {
          const dataPagamento = new Date();
          const mesReferencia = `${dataPagamento.getFullYear()}-${String(dataPagamento.getMonth() + 1).padStart(2, '0')}`;

          await tx.comissaoAssinatura.upsert({
            where: {
              pagamentoId_profissionalId: {
                pagamentoId: id,
                profissionalId: profissional.id,
              },
            },
            update: {
              pago: false, // Comissão ainda não foi paga ao profissional
              valorComissao,
              valorTotal: pagamento.valor,
            },
            create: {
              profissionalId: profissional.id,
              assinaturaId: pagamento.assinaturaId,
              pagamentoId: id,
              valorComissao,
              valorTotal: pagamento.valor,
              mesReferencia,
              barbeariaId,
            },
          });
        }
      }

      return pagamentoAtualizado;
    });

    res.json(resultado);
  } catch (error: any) {
    console.error('Erro ao marcar pagamento como pago:', error);
    res.status(500).json({ error: 'Erro ao marcar pagamento como pago' });
  }
}

