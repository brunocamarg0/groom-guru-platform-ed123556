import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Obter KPIs do dashboard do dono
 */
export async function obterKPIs(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const fimHoje = new Date(hoje);
    fimHoje.setHours(23, 59, 59, 999);

    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999);

    // Agendamentos de hoje
    const agendamentosHoje = await prisma.agendamento.count({
      where: {
        barbeariaId,
        data: {
          gte: hoje,
          lte: fimHoje,
        },
        status: { in: ['pendente', 'confirmado'] },
      },
    });

    // Agendamentos pendentes
    const agendamentosPendentes = await prisma.agendamento.count({
      where: {
        barbeariaId,
        status: 'pendente',
      },
    });

    // Faturamento do mês
    const agendamentosMes = await prisma.agendamento.findMany({
      where: {
        barbeariaId,
        data: {
          gte: inicioMes,
          lte: fimMes,
        },
        status: { in: ['confirmado', 'concluido'] },
      },
      include: {
        servico: true,
        pagamento: true,
      },
    });

    const faturamentoMes = agendamentosMes.reduce((total, ag) => {
      if (ag.pagamento && ag.pagamento.status === 'pago') {
        return total + ag.pagamento.valor;
      }
      return total + ag.servico.preco;
    }, 0);

    // Total de clientes
    const agendamentosComClientes = await prisma.agendamento.findMany({
      where: { barbeariaId },
      select: { clienteId: true },
      distinct: ['clienteId'],
    });
    const totalClientes = agendamentosComClientes.filter((a) => a.clienteId !== null).length;

    // Total de profissionais
    const totalProfissionais = await prisma.profissional.count({
      where: {
        barbeariaId,
        ativo: true,
      },
    });

    // Agendamentos do mês
    const totalAgendamentosMes = agendamentosMes.length;

    // Taxa de confirmação (últimos 30 dias)
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    const agendamentos30Dias = await prisma.agendamento.findMany({
      where: {
        barbeariaId,
        data: {
          gte: trintaDiasAtras,
        },
      },
    });

    const confirmados = agendamentos30Dias.filter((a) => a.status === 'confirmado' || a.status === 'concluido').length;
    const taxaConfirmacao = agendamentos30Dias.length > 0 ? (confirmados / agendamentos30Dias.length) * 100 : 0;

    res.json({
      agendamentosHoje,
      agendamentosPendentes,
      faturamentoMes: parseFloat(faturamentoMes.toFixed(2)),
      totalClientes,
      totalProfissionais,
      totalAgendamentosMes,
      taxaConfirmacao: parseFloat(taxaConfirmacao.toFixed(2)),
    });
  } catch (error) {
    console.error('Erro ao obter KPIs:', error);
    res.status(500).json({ error: 'Erro ao obter KPIs' });
  }
}
