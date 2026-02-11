import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * GET /api/dono/comissoes-completo/:profissionalId
 * Relatório completo de comissões de um profissional (serviços + assinaturas)
 */
export async function relatorioComissoesCompleto(req: AuthRequest, res: Response) {
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

    // Buscar profissional
    const profissional = await prisma.profissional.findFirst({
      where: {
        id: profissionalId,
        barbeariaId,
      },
    });

    if (!profissional) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    // Buscar clientes atribuídos ao profissional
    const clientesAtribuidos = await prisma.clienteProfissional.findMany({
      where: {
        profissionalId,
        ativo: true,
        cliente: {
          agendamentos: {
            some: {
              barbeariaId,
            },
          },
        },
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
      },
    });

    // Buscar comissões por serviços (agendamentos)
    const comissoesServicos = await prisma.comissaoPaga.findMany({
      where: {
        profissionalId,
        barbeariaId,
        createdAt: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      include: {
        agendamento: {
          include: {
            clienteRel: {
              select: {
                id: true,
                nome: true,
              },
            },
            servico: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Buscar comissões por assinatura
    const comissoesAssinatura = await prisma.comissaoAssinatura.findMany({
      where: {
        profissionalId,
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

    // Calcular totais
    const totalComissaoServicos = comissoesServicos.reduce((sum, c) => sum + c.valorComissao, 0);
    const totalPagoServicos = comissoesServicos
      .filter((c) => c.pago)
      .reduce((sum, c) => sum + c.valorComissao, 0);
    const totalPendenteServicos = totalComissaoServicos - totalPagoServicos;

    const totalComissaoAssinatura = comissoesAssinatura.reduce((sum, c) => sum + c.valorComissao, 0);
    const totalPagoAssinatura = comissoesAssinatura
      .filter((c) => c.pago)
      .reduce((sum, c) => sum + c.valorComissao, 0);
    const totalPendenteAssinatura = totalComissaoAssinatura - totalPagoAssinatura;

    const totalGeral = totalComissaoServicos + totalComissaoAssinatura;
    const totalPagoGeral = totalPagoServicos + totalPagoAssinatura;
    const totalPendenteGeral = totalPendenteServicos + totalPendenteAssinatura;

    res.json({
      profissional: {
        id: profissional.id,
        nome: profissional.nome,
        comissaoTipo: profissional.comissaoTipo,
        comissaoValor: profissional.comissaoValor,
        comissaoAssinatura: profissional.comissaoAssinatura,
      },
      mesReferencia,
      clientesAtribuidos: clientesAtribuidos.map(cp => ({
        id: cp.cliente.id,
        nome: cp.cliente.nome,
        email: cp.cliente.email,
        telefone: cp.cliente.telefone,
        dataInicio: cp.dataInicio,
      })),
      comissoesServicos: comissoesServicos.map(c => ({
        id: c.id,
        cliente: c.agendamento.clienteRel ? {
          id: c.agendamento.clienteRel.id,
          nome: c.agendamento.clienteRel.nome,
        } : {
          id: '',
          nome: c.agendamento.cliente, // Nome do cliente como string
        },
        servico: c.agendamento.servico,
        valorTotal: c.valorTotal,
        valorComissao: c.valorComissao,
        pago: c.pago,
        dataPagamento: c.dataPagamento,
        dataServico: c.agendamento.data,
      })),
      comissoesAssinatura: comissoesAssinatura.map(c => ({
        id: c.id,
        cliente: c.pagamento.assinatura.cliente,
        plano: c.pagamento.assinatura.plano,
        valorTotal: c.valorTotal,
        valorComissao: c.valorComissao,
        pago: c.pago,
        dataPagamento: c.dataPagamento,
        mesReferencia: c.mesReferencia,
      })),
      resumo: {
        servicos: {
          total: totalComissaoServicos,
          pago: totalPagoServicos,
          pendente: totalPendenteServicos,
          quantidade: comissoesServicos.length,
        },
        assinaturas: {
          total: totalComissaoAssinatura,
          pago: totalPagoAssinatura,
          pendente: totalPendenteAssinatura,
          quantidade: comissoesAssinatura.length,
        },
        geral: {
          total: totalGeral,
          pago: totalPagoGeral,
          pendente: totalPendenteGeral,
        },
      },
    });
  } catch (error: any) {
    console.error('Erro ao gerar relatório completo de comissões:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
}

