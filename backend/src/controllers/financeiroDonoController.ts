import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Listar pagamentos da barbearia do dono
 */
export async function listarPagamentos(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { dataInicio, dataFim, metodo, status } = req.query;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const where: any = {
      agendamento: {
        barbeariaId,
      },
    };

    if (metodo && typeof metodo === 'string') {
      where.metodo = metodo;
    }

    if (status && typeof status === 'string') {
      where.status = status;
    }

    if (dataInicio || dataFim) {
      where.createdAt = {};
      if (dataInicio && typeof dataInicio === 'string') {
        where.createdAt.gte = new Date(dataInicio);
      }
      if (dataFim && typeof dataFim === 'string') {
        where.createdAt.lte = new Date(dataFim);
      }
    }

    const pagamentos = await prisma.pagamento.findMany({
      where,
      include: {
        agendamento: {
          include: {
            clienteRel: {
              select: {
                id: true,
                nome: true,
                telefone: true,
              },
            },
            servico: {
              select: {
                id: true,
                nome: true,
                preco: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(pagamentos);
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error);
    res.status(500).json({ error: 'Erro ao listar pagamentos' });
  }
}

/**
 * Obter estatísticas financeiras
 */
export async function obterEstatisticasFinanceiras(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { dataInicio, dataFim } = req.query;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const where: any = {
      agendamento: {
        barbeariaId,
      },
      status: 'pago',
    };

    if (dataInicio || dataFim) {
      where.dataPagamento = {};
      if (dataInicio && typeof dataInicio === 'string') {
        where.dataPagamento.gte = new Date(dataInicio);
      }
      if (dataFim && typeof dataFim === 'string') {
        where.dataPagamento.lte = new Date(dataFim);
      }
    }

    const pagamentos = await prisma.pagamento.findMany({
      where,
      select: {
        valor: true,
        metodo: true,
        taxaGateway: true,
      },
    });

    const totalGeral = pagamentos.reduce((sum, p) => sum + p.valor, 0);
    const totalTaxas = pagamentos.reduce((sum, p) => sum + (p.taxaGateway || 0), 0);
    const totalLiquido = totalGeral - totalTaxas;

    const porMetodo = pagamentos.reduce((acc: any, p) => {
      if (!acc[p.metodo]) {
        acc[p.metodo] = { total: 0, quantidade: 0 };
      }
      acc[p.metodo].total += p.valor;
      acc[p.metodo].quantidade += 1;
      return acc;
    }, {});

    res.json({
      totalGeral,
      totalTaxas,
      totalLiquido,
      quantidade: pagamentos.length,
      porMetodo,
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas financeiras:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas financeiras' });
  }
}

