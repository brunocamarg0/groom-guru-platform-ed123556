import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * GET /api/dono/comissoes-assinatura/:profissionalId
 * Calcular comissões de assinatura de um profissional para um mês específico
 */
export async function calcularComissoesAssinatura(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { profissionalId } = req.params;
    const { mes, ano } = req.query;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    if (!profissionalId || !mes || !ano) {
      return res.status(400).json({ error: 'profissionalId, mes e ano são obrigatórios' });
    }

    const mesReferencia = `${ano}-${String(mes).padStart(2, '0')}`;
    const dataInicio = new Date(`${ano}-${String(mes).padStart(2, '0')}-01T00:00:00.000Z`);
    const dataFim = new Date(Number(ano), Number(mes), 0, 23, 59, 59, 999);

    // Buscar comissões do profissional no mês
    const comissoes = await prisma.comissaoAssinatura.findMany({
      where: {
        profissionalId: String(profissionalId),
        barbeariaId,
        mesReferencia,
      },
      include: {
        pagamento: {
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
                plano: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalComissao = comissoes.reduce((sum, c) => sum + c.valorComissao, 0);
    const totalPago = comissoes
      .filter((c) => c.pago)
      .reduce((sum, c) => sum + c.valorComissao, 0);
    const totalPendente = totalComissao - totalPago;

    res.json({
      profissionalId,
      mesReferencia,
      comissoes: comissoes.map((c) => ({
        id: c.id,
        cliente: c.pagamento.assinatura.cliente,
        plano: c.pagamento.assinatura.plano,
        valorComissao: c.valorComissao,
        valorTotal: c.valorTotal,
        pago: c.pago,
        dataPagamento: c.dataPagamento,
        mesReferencia: c.mesReferencia,
        observacao: c.observacao,
      })),
      resumo: {
        totalComissao,
        totalPago,
        totalPendente,
        quantidade: comissoes.length,
        quantidadePaga: comissoes.filter((c) => c.pago).length,
      },
    });
  } catch (error: any) {
    console.error('Erro ao calcular comissões de assinatura:', error);
    res.status(500).json({ error: 'Erro ao calcular comissões de assinatura' });
  }
}

/**
 * GET /api/dono/comissoes-assinatura/resumo
 * Resumo de comissões de assinatura de todos os profissionais
 */
export async function listarResumoComissoesAssinatura(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { mes, ano } = req.query;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    if (!mes || !ano) {
      return res.status(400).json({ error: 'mes e ano são obrigatórios' });
    }

    const mesReferencia = `${ano}-${String(mes).padStart(2, '0')}`;

    // Buscar todos os profissionais da barbearia
    const profissionais = await prisma.profissional.findMany({
      where: {
        barbeariaId,
        ativo: true,
      },
      include: {
        comissoesAssinatura: {
          where: {
            mesReferencia,
            barbeariaId,
          },
        },
      },
    });

    const resumo = profissionais.map((prof) => {
      const totalComissao = prof.comissoesAssinatura.reduce(
        (sum, c) => sum + c.valorComissao,
        0
      );
      const totalPago = prof.comissoesAssinatura
        .filter((c) => c.pago)
        .reduce((sum, c) => sum + c.valorComissao, 0);
      const totalPendente = totalComissao - totalPago;

      return {
        profissionalId: prof.id,
        profissionalNome: prof.nome,
        comissaoAssinatura: prof.comissaoAssinatura,
        totalComissao,
        totalPago,
        totalPendente,
        quantidade: prof.comissoesAssinatura.length,
        quantidadePaga: prof.comissoesAssinatura.filter((c) => c.pago).length,
      };
    });

    const totalGeral = resumo.reduce(
      (acc, r) => ({
        totalComissao: acc.totalComissao + r.totalComissao,
        totalPago: acc.totalPago + r.totalPago,
        totalPendente: acc.totalPendente + r.totalPendente,
      }),
      { totalComissao: 0, totalPago: 0, totalPendente: 0 }
    );

    res.json({
      mesReferencia,
      profissionais: resumo,
      totalGeral,
    });
  } catch (error: any) {
    console.error('Erro ao listar resumo de comissões de assinatura:', error);
    res.status(500).json({ error: 'Erro ao listar resumo de comissões de assinatura' });
  }
}

/**
 * POST /api/dono/comissoes-assinatura/:id/marcar-pago
 * Marcar comissão de assinatura como paga
 */
export async function marcarComissaoAssinaturaComoPaga(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { id } = req.params;
    const { observacao } = req.body;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const comissao = await prisma.comissaoAssinatura.findFirst({
      where: {
        id,
        barbeariaId,
      },
    });

    if (!comissao) {
      return res.status(404).json({ error: 'Comissão não encontrada' });
    }

    const comissaoAtualizada = await prisma.comissaoAssinatura.update({
      where: { id },
      data: {
        pago: true,
        dataPagamento: new Date(),
        observacao: observacao || null,
      },
    });

    res.json(comissaoAtualizada);
  } catch (error: any) {
    console.error('Erro ao marcar comissão de assinatura como paga:', error);
    res.status(500).json({ error: 'Erro ao marcar comissão de assinatura como paga' });
  }
}

/**
 * POST /api/dono/comissoes-assinatura/profissional/:profissionalId/marcar-todas-pagas
 * Marcar todas as comissões de assinatura de um profissional no mês como pagas
 */
export async function marcarTodasComissoesAssinaturaComoPagas(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { profissionalId } = req.params;
    const { mes, ano } = req.body;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    if (!mes || !ano) {
      return res.status(400).json({ error: 'mes e ano são obrigatórios' });
    }

    const mesReferencia = `${ano}-${String(mes).padStart(2, '0')}`;

    // Verificar se profissional existe e pertence à barbearia
    const profissional = await prisma.profissional.findFirst({
      where: {
        id: profissionalId,
        barbeariaId,
      },
    });

    if (!profissional) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    // Atualizar todas as comissões do mês
    const resultado = await prisma.comissaoAssinatura.updateMany({
      where: {
        profissionalId: String(profissionalId),
        barbeariaId,
        mesReferencia,
        pago: false,
      },
      data: {
        pago: true,
        dataPagamento: new Date(),
      },
    });

    res.json({
      sucesso: true,
      mensagem: `${resultado.count} comissões marcadas como pagas`,
      total: resultado.count,
    });
  } catch (error: any) {
    console.error('Erro ao marcar todas as comissões de assinatura como pagas:', error);
    res.status(500).json({ error: 'Erro ao marcar todas as comissões de assinatura como pagas' });
  }
}

