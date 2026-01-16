import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Calcular comissões de um profissional para um mês específico
 */
export async function calcularComissoesProfissional(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { profissionalId, mes, ano } = req.query;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    if (!profissionalId || !mes || !ano) {
      return res.status(400).json({ error: 'profissionalId, mes e ano são obrigatórios' });
    }

    const mesReferencia = `${ano}-${String(mes).padStart(2, '0')}`;
    const dataInicio = new Date(Number(ano), Number(mes) - 1, 1);
    const dataFim = new Date(Number(ano), Number(mes), 0, 23, 59, 59);

    // Buscar agendamentos do profissional no mês
    const agendamentosRaw = await prisma.agendamento.findMany({
      where: {
        barbeariaId,
        profissionais: {
          some: {
            profissionalId: String(profissionalId),
          },
        },
        data: {
          gte: dataInicio,
          lte: dataFim,
        },
        status: {
          in: ['confirmado', 'concluido'],
        },
        pagamento: {
          isNot: null,
        },
      },
      include: {
        servico: true,
        pagamento: true,
        profissionais: {
          where: {
            profissionalId: String(profissionalId),
          },
          include: {
            profissional: true,
          },
        },
      },
    });

    // Filtrar apenas agendamentos com pagamento pago
    const agendamentos = agendamentosRaw.filter(
      (a) => a.pagamento && a.pagamento.status === 'pago'
    );

    // Buscar profissional para obter configuração de comissão
    const profissional = await prisma.profissional.findUnique({
      where: { id: String(profissionalId) },
    });

    if (!profissional) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    // Calcular comissões
    const comissoes = agendamentos
      .filter((a) => a.servico !== null)
      .map((agendamento) => {
        const valorTotal = agendamento.servico!.preco;
      let valorComissao = 0;
      let porcentagem = 0;

      if (profissional.comissaoTipo === 'percentual') {
        porcentagem = profissional.comissaoValor;
        valorComissao = (valorTotal * porcentagem) / 100;
      } else {
        // Comissão fixa
        valorComissao = profissional.comissaoValor;
        porcentagem = 0;
      }

      return {
        agendamentoId: agendamento.id,
        data: agendamento.data,
        horario: agendamento.horario,
        cliente: agendamento.cliente,
        servico: agendamento.servico!.nome,
        valorTotal,
        valorComissao,
        porcentagem,
        pago: false, // Será verificado depois
      };
    });

    // Verificar quais já foram pagos
    const comissoesPagas = await prisma.comissaoPaga.findMany({
      where: {
        profissionalId: String(profissionalId),
        mesReferencia,
        pago: true,
      },
      select: {
        agendamentoId: true,
      },
    });

    const idsPagos = new Set(comissoesPagas.map((c) => c.agendamentoId));

    const comissoesComStatus = comissoes.map((comissao) => ({
      ...comissao,
      pago: idsPagos.has(comissao.agendamentoId),
    }));

    const totalComissao = comissoesComStatus.reduce((sum, c) => sum + c.valorComissao, 0);
    const totalPago = comissoesComStatus
      .filter((c) => c.pago)
      .reduce((sum, c) => sum + c.valorComissao, 0);
    const totalPendente = totalComissao - totalPago;

    res.json({
      profissional: {
        id: profissional.id,
        nome: profissional.nome,
        comissaoTipo: profissional.comissaoTipo,
        comissaoValor: profissional.comissaoValor,
      },
      mesReferencia,
      periodo: {
        inicio: dataInicio.toISOString(),
        fim: dataFim.toISOString(),
      },
      resumo: {
        totalAgendamentos: comissoesComStatus.length,
        totalComissao,
        totalPago,
        totalPendente,
      },
      comissoes: comissoesComStatus,
    });
  } catch (error) {
    console.error('Erro ao calcular comissões:', error);
    res.status(500).json({ error: 'Erro ao calcular comissões' });
  }
}

/**
 * Listar resumo de comissões de todos os profissionais no mês
 */
export async function listarResumoComissoes(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { mes, ano } = req.query;

    console.log('📊 [COMISSÕES] listarResumoComissoes chamado');
    console.log('   barbeariaId:', barbeariaId);
    console.log('   mes:', mes);
    console.log('   ano:', ano);

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const mesAtual = mes ? Number(mes) : new Date().getMonth() + 1;
    const anoAtual = ano ? Number(ano) : new Date().getFullYear();
    const mesReferencia = `${anoAtual}-${String(mesAtual).padStart(2, '0')}`;

    console.log('   mesAtual:', mesAtual);
    console.log('   anoAtual:', anoAtual);
    console.log('   mesReferencia:', mesReferencia);

    const dataInicio = new Date(anoAtual, mesAtual - 1, 1);
    const dataFim = new Date(anoAtual, mesAtual, 0, 23, 59, 59);

    console.log('   dataInicio:', dataInicio);
    console.log('   dataFim:', dataFim);

    // Buscar todos os profissionais da barbearia
    const profissionais = await prisma.profissional.findMany({
      where: {
        barbeariaId,
        ativo: true,
      },
    });

    console.log('   profissionais encontrados:', profissionais.length);

    // Calcular comissões para cada profissional
    const resumos = await Promise.all(
      profissionais.map(async (profissional) => {
        try {
          // Buscar agendamentos do profissional no mês
          const agendamentosRaw = await prisma.agendamento.findMany({
            where: {
              barbeariaId,
              profissionais: {
                some: {
                  profissionalId: profissional.id,
                },
              },
              data: {
                gte: dataInicio,
                lte: dataFim,
              },
              status: {
                in: ['confirmado', 'concluido'],
              },
              pagamento: {
                isNot: null,
              },
            },
            include: {
              servico: true,
              pagamento: true,
            },
          });

          // Filtrar apenas agendamentos com pagamento pago
          const agendamentos = agendamentosRaw.filter(
            (a) => a.pagamento && a.pagamento.status === 'pago'
          );

          // Calcular comissões
          let totalComissao = 0;
          let totalValor = 0;

          agendamentos
            .filter((a) => a.servico !== null)
            .forEach((agendamento) => {
              const valorTotal = agendamento.servico!.preco;
              totalValor += valorTotal;

              if (profissional.comissaoTipo === 'percentual') {
                totalComissao += (valorTotal * profissional.comissaoValor) / 100;
              } else {
                totalComissao += profissional.comissaoValor;
              }
            });

          // Verificar quanto já foi pago
          const comissoesPagas = await prisma.comissaoPaga.findMany({
            where: {
              profissionalId: profissional.id,
              mesReferencia,
              pago: true,
            },
          });

          const totalPago = comissoesPagas.reduce((sum, c) => sum + c.valorComissao, 0);
          const totalPendente = totalComissao - totalPago;

          return {
            profissional: {
              id: profissional.id,
              nome: profissional.nome,
              comissaoTipo: profissional.comissaoTipo,
              comissaoValor: profissional.comissaoValor,
            },
            resumo: {
              totalAgendamentos: agendamentos.length,
              totalValor,
              totalComissao,
              totalPago,
              totalPendente,
            },
          };
        } catch (error) {
          console.error(`Erro ao calcular comissões para profissional ${profissional.id}:`, error);
          // Retornar resumo vazio em caso de erro
          return {
            profissional: {
              id: profissional.id,
              nome: profissional.nome,
              comissaoTipo: profissional.comissaoTipo,
              comissaoValor: profissional.comissaoValor,
            },
            resumo: {
              totalAgendamentos: 0,
              totalValor: 0,
              totalComissao: 0,
              totalPago: 0,
              totalPendente: 0,
            },
          };
        }
      })
    );

    // Calcular totais gerais
    const totalGeral = resumos.reduce((sum, r) => sum + r.resumo.totalComissao, 0);
    const totalPagoGeral = resumos.reduce((sum, r) => sum + r.resumo.totalPago, 0);
    const totalPendenteGeral = resumos.reduce((sum, r) => sum + r.resumo.totalPendente, 0);

    res.json({
      mesReferencia,
      periodo: {
        inicio: dataInicio.toISOString(),
        fim: dataFim.toISOString(),
      },
      resumoGeral: {
        totalComissao: totalGeral,
        totalPago: totalPagoGeral,
        totalPendente: totalPendenteGeral,
      },
      profissionais: resumos,
    });
  } catch (error: any) {
    console.error('❌ [COMISSÕES] Erro ao listar resumo de comissões:', error);
    console.error('   Stack:', error?.stack);
    res.status(500).json({ 
      error: 'Erro ao listar resumo de comissões',
      message: error?.message || 'Erro desconhecido'
    });
  }
}

/**
 * Marcar comissão como paga
 */
export async function marcarComissaoComoPaga(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { agendamentoId, profissionalId } = req.body;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    if (!agendamentoId || !profissionalId) {
      return res.status(400).json({ error: 'agendamentoId e profissionalId são obrigatórios' });
    }

    // Buscar agendamento
    const agendamento = await prisma.agendamento.findUnique({
      where: { id: agendamentoId },
      include: {
        servico: true,
        profissionais: {
          where: {
            profissionalId,
          },
          include: {
            profissional: true,
          },
        },
      },
    });

    if (!agendamento || agendamento.barbeariaId !== barbeariaId) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    if (agendamento.profissionais.length === 0) {
      return res.status(400).json({ error: 'Profissional não está associado a este agendamento' });
    }

    const profissional = agendamento.profissionais[0].profissional;
    if (!agendamento.servico) {
      return res.status(400).json({ error: 'Agendamento não tem serviço associado' });
    }
    const valorTotal = agendamento.servico.preco;
    let valorComissao = 0;
    let porcentagem = 0;

    if (profissional.comissaoTipo === 'percentual') {
      porcentagem = profissional.comissaoValor;
      valorComissao = (valorTotal * porcentagem) / 100;
    } else {
      valorComissao = profissional.comissaoValor;
      porcentagem = 0;
    }

    // Criar ou atualizar comissão
    const dataAgendamento = new Date(agendamento.data);
    const mesReferencia = `${dataAgendamento.getFullYear()}-${String(dataAgendamento.getMonth() + 1).padStart(2, '0')}`;

    const comissao = await prisma.comissaoPaga.upsert({
      where: {
        agendamentoId_profissionalId: {
          agendamentoId,
          profissionalId,
        },
      },
      update: {
        pago: true,
        dataPagamento: new Date(),
      },
      create: {
        profissionalId,
        agendamentoId,
        barbeariaId,
        valorComissao,
        valorTotal,
        porcentagem,
        mesReferencia,
        pago: true,
        dataPagamento: new Date(),
      },
    });

    res.json({
      sucesso: true,
      mensagem: 'Comissão marcada como paga',
      comissao,
    });
  } catch (error) {
    console.error('Erro ao marcar comissão como paga:', error);
    res.status(500).json({ error: 'Erro ao marcar comissão como paga' });
  }
}

/**
 * Marcar todas as comissões de um profissional no mês como pagas
 */
export async function marcarTodasComissoesComoPagas(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { profissionalId, mes, ano } = req.body;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    if (!profissionalId || !mes || !ano) {
      return res.status(400).json({ error: 'profissionalId, mes e ano são obrigatórios' });
    }

    const mesReferencia = `${ano}-${String(mes).padStart(2, '0')}`;
    const dataInicio = new Date(Number(ano), Number(mes) - 1, 1);
    const dataFim = new Date(Number(ano), Number(mes), 0, 23, 59, 59);

    // Buscar agendamentos do profissional no mês que ainda não têm comissão paga
    const agendamentosRaw = await prisma.agendamento.findMany({
      where: {
        barbeariaId,
        profissionais: {
          some: {
            profissionalId: String(profissionalId),
          },
        },
        data: {
          gte: dataInicio,
          lte: dataFim,
        },
        status: {
          in: ['confirmado', 'concluido'],
        },
        pagamento: {
          isNot: null,
        },
        comissoes: {
          none: {
            profissionalId: String(profissionalId),
            pago: true,
          },
        },
      },
      include: {
        servico: true,
        pagamento: true,
        profissionais: {
          where: {
            profissionalId: String(profissionalId),
          },
          include: {
            profissional: true,
          },
        },
      },
    });

    // Filtrar apenas agendamentos com pagamento pago
    const agendamentos = agendamentosRaw.filter(
      (a) => a.pagamento && a.pagamento.status === 'pago'
    );

    // Buscar profissional
    const profissional = await prisma.profissional.findUnique({
      where: { id: String(profissionalId) },
    });

    if (!profissional) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    // Criar registros de comissão para cada agendamento
    const comissoes = await Promise.all(
      agendamentos
        .filter((a) => a.servico !== null)
        .map(async (agendamento) => {
          const valorTotal = agendamento.servico!.preco;
        let valorComissao = 0;
        let porcentagem = 0;

        if (profissional.comissaoTipo === 'percentual') {
          porcentagem = profissional.comissaoValor;
          valorComissao = (valorTotal * porcentagem) / 100;
        } else {
          valorComissao = profissional.comissaoValor;
          porcentagem = 0;
        }

        return prisma.comissaoPaga.upsert({
          where: {
            agendamentoId_profissionalId: {
              agendamentoId: agendamento.id,
              profissionalId: String(profissionalId),
            },
          },
          update: {
            pago: true,
            dataPagamento: new Date(),
          },
          create: {
            profissionalId: String(profissionalId),
            agendamentoId: agendamento.id,
            barbeariaId,
            valorComissao,
            valorTotal,
            porcentagem,
            mesReferencia,
            pago: true,
            dataPagamento: new Date(),
          },
        });
      })
    );

    res.json({
      sucesso: true,
      mensagem: `${comissoes.length} comissões marcadas como pagas`,
      total: comissoes.length,
      valorTotal: comissoes.reduce((sum, c) => sum + c.valorComissao, 0),
    });
  } catch (error) {
    console.error('Erro ao marcar todas as comissões como pagas:', error);
    res.status(500).json({ error: 'Erro ao marcar todas as comissões como pagas' });
  }
}
