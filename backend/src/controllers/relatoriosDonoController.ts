import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Gerar relatório financeiro
 */
export async function gerarRelatorio(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { dataInicio, dataFim } = req.query;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    if (!dataInicio || !dataFim) {
      return res.status(400).json({ error: 'dataInicio e dataFim são obrigatórios' });
    }

    const inicio = new Date(dataInicio as string);
    const fim = new Date(dataFim as string);
    fim.setHours(23, 59, 59, 999); // Fim do dia

    // Buscar agendamentos no período
    const agendamentos = await prisma.agendamento.findMany({
      where: {
        barbeariaId,
        data: {
          gte: inicio,
          lte: fim,
        },
      },
      include: {
        servico: {
          select: {
            id: true,
            nome: true,
            preco: true,
          },
        },
        pagamento: {
          select: {
            valor: true,
            metodo: true,
            status: true,
          },
        },
        profissionais: {
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
    });

    // Calcular estatísticas
    const totalAgendamentos = agendamentos.length;
    const agendamentosConfirmados = agendamentos.filter((a) => a.status === 'confirmado' || a.status === 'concluido').length;
    const agendamentosCancelados = agendamentos.filter((a) => a.status === 'cancelado' || a.status === 'recusado').length;
    const taxaCancelamento = totalAgendamentos > 0 ? (agendamentosCancelados / totalAgendamentos) * 100 : 0;

    // Faturamento
    const pagamentos = agendamentos
      .filter((a) => a.pagamento && a.pagamento.status === 'pago')
      .map((a) => a.pagamento!.valor);
    const faturamento = pagamentos.reduce((sum, v) => sum + v, 0);
    const ticketMedio = pagamentos.length > 0 ? faturamento / pagamentos.length : 0;

    // Serviços mais vendidos
    const servicosVendidos: { [key: string]: { nome: string; quantidade: number; receita: number } } = {};
    agendamentos.forEach((a) => {
      const servicoId = a.servico.id;
      if (!servicosVendidos[servicoId]) {
        servicosVendidos[servicoId] = {
          nome: a.servico.nome,
          quantidade: 0,
          receita: 0,
        };
      }
      servicosVendidos[servicoId].quantidade += 1;
      if (a.pagamento && a.pagamento.status === 'pago') {
        servicosVendidos[servicoId].receita += a.pagamento.valor;
      }
    });

    const servicosMaisVendidos = Object.values(servicosVendidos)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);

    // Profissionais mais rentáveis
    const profissionaisRentaveis: { [key: string]: { nome: string; receita: number } } = {};
    agendamentos.forEach((a) => {
      a.profissionais.forEach((ap) => {
        const profId = ap.profissional.id;
        if (!profissionaisRentaveis[profId]) {
          profissionaisRentaveis[profId] = {
            nome: ap.profissional.nome,
            receita: 0,
          };
        }
        if (a.pagamento && a.pagamento.status === 'pago') {
          profissionaisRentaveis[profId].receita += a.pagamento.valor;
        }
      });
    });

    const profissionaisMaisRentaveis = Object.values(profissionaisRentaveis)
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 10);

    // Horários de pico
    const horariosPico: { [key: string]: number } = {};
    agendamentos.forEach((a) => {
      const hora = a.horario.split(':')[0];
      horariosPico[hora] = (horariosPico[hora] || 0) + 1;
    });

    const horariosPicoArray = Object.entries(horariosPico)
      .map(([horario, quantidade]) => ({ horario, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);

    res.json({
      periodo: `${dataInicio} a ${dataFim}`,
      faturamento,
      agendamentos: totalAgendamentos,
      cancelamentos: agendamentosCancelados,
      taxaCancelamento: Math.round(taxaCancelamento * 10) / 10,
      ticketMedio: Math.round(ticketMedio * 100) / 100,
      servicosMaisVendidos,
      profissionaisMaisRentaveis,
      horariosPico: horariosPicoArray,
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
}

