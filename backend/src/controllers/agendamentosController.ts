import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import {
  notificarConfirmacaoAgendamento,
  notificarRecusaAgendamento,
} from '../services/whatsappService';

/**
 * Tipos de modo de confirmação
 */
type ModoConfirmacao = 'automatico' | 'manual' | 'hibrido';

/**
 * Verificar disponibilidade de um profissional em um horário específico
 */
async function verificarDisponibilidadeProfissional(
  profissionalId: string,
  data: string | Date,
  horario: string,
  duracaoServico: number,
  barbeariaId: string
): Promise<boolean> {
  try {
    const dataAgendamento = new Date(data);
    const [hora, minuto] = horario.split(':').map(Number);
    dataAgendamento.setHours(hora, minuto, 0, 0);

    const inicioAgendamento = dataAgendamento.getTime();
    const fimAgendamento = inicioAgendamento + duracaoServico * 60 * 1000;

    // Buscar agendamentos do profissional na mesma data
    const inicioDia = new Date(dataAgendamento);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(dataAgendamento);
    fimDia.setHours(23, 59, 59, 999);

    const agendamentos = await prisma.agendamento.findMany({
      where: {
        barbeariaId,
        data: {
          gte: inicioDia,
          lte: fimDia,
        },
        status: {
          in: ['pendente', 'confirmado'],
        },
        profissionais: {
          some: {
            profissionalId,
          },
        },
      },
      include: {
        servico: true,
      },
    });

    // Verificar conflitos
    for (const agendamento of agendamentos) {
      const dataAgend = new Date(agendamento.data);
      const [horaAgend, minutoAgend] = agendamento.horario.split(':').map(Number);
      dataAgend.setHours(horaAgend, minutoAgend, 0, 0);

      const inicioExistente = dataAgend.getTime();
      const fimExistente = inicioExistente + agendamento.servico.duracao * 60 * 1000;

      // Verificar sobreposição
      if (
        (inicioAgendamento >= inicioExistente && inicioAgendamento < fimExistente) ||
        (fimAgendamento > inicioExistente && fimAgendamento <= fimExistente) ||
        (inicioAgendamento <= inicioExistente && fimAgendamento >= fimExistente)
      ) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    return false;
  }
}

/**
 * Verificar horários disponíveis para um profissional em uma data
 */
export async function verificarDisponibilidade(req: Request, res: Response) {
  try {
    const { profissionalId, data, servicoId, barbeariaId } = req.query;

    if (!profissionalId || !data || !servicoId || !barbeariaId) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: profissionalId, data, servicoId, barbeariaId',
      });
    }

    // Buscar serviço para obter duração
    const servico = await prisma.servico.findUnique({
      where: { id: servicoId as string },
      select: { duracao: true },
    });

    if (!servico) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    // Gerar horários disponíveis (08:00 às 19:00, intervalos de 40 minutos)
    const horariosDisponiveis: string[] = [];
    const inicio = 8 * 60; // 08:00 em minutos
    const fim = 19 * 60; // 19:00 em minutos
    const intervalo = 40; // minutos

    for (let i = inicio; i <= fim; i += intervalo) {
      const hora = Math.floor(i / 60);
      const minuto = i % 60;
      const horario = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;

      // Verificar se está disponível
      const disponivel = await verificarDisponibilidadeProfissional(
        profissionalId as string,
        data as string,
        horario,
        servico.duracao,
        barbeariaId as string
      );

      if (disponivel) {
        horariosDisponiveis.push(horario);
      }
    }

    res.json({ horariosDisponiveis });
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    res.status(500).json({ error: 'Erro ao verificar disponibilidade' });
  }
}

/**
 * Listar agendamentos de uma barbearia
 */
export async function listarAgendamentos(req: Request, res: Response) {
  try {
    const { barbeariaId } = req.params;
    const { status, data } = req.query;

    const where: any = {
      barbeariaId,
    };

    if (status && typeof status === 'string') {
      where.status = status;
    }

    if (data && typeof data === 'string') {
      const dataInicio = new Date(data);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = new Date(data);
      dataFim.setHours(23, 59, 59, 999);
      
      where.data = {
        gte: dataInicio,
        lte: dataFim,
      };
    }

    const agendamentos = await prisma.agendamento.findMany({
      where,
      include: {
        clienteRel: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
        servico: {
          select: {
            id: true,
            nome: true,
            preco: true,
            duracao: true,
          },
        },
        barbearia: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: {
        data: 'asc',
      },
    });

    res.json(agendamentos);
  } catch (error) {
    console.error('Erro ao listar agendamentos:', error);
    res.status(500).json({ error: 'Erro ao listar agendamentos' });
  }
}

/**
 * Buscar agendamento por ID
 */
export async function buscarAgendamento(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const agendamento = await prisma.agendamento.findUnique({
      where: { id },
      include: {
        clienteRel: true,
        servico: true,
        barbearia: true,
      },
    });

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    res.json(agendamento);
  } catch (error) {
    console.error('Erro ao buscar agendamento:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamento' });
  }
}

/**
 * Confirmar agendamento
 */
export async function confirmarAgendamento(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const agendamento = await prisma.agendamento.findUnique({
      where: { id },
    });

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    if (agendamento.status === 'confirmado') {
      return res.status(400).json({ error: 'Agendamento já está confirmado' });
    }

    if (agendamento.status === 'concluido') {
      return res.status(400).json({ error: 'Não é possível confirmar um agendamento já concluído' });
    }

    const agendamentoAtualizado = await prisma.agendamento.findUnique({
      where: { id },
      include: {
        clienteRel: true,
        servico: true,
        barbearia: true,
      },
    });

    if (!agendamentoAtualizado) {
      return res.status(404).json({ error: 'Erro ao atualizar agendamento' });
    }

    await prisma.agendamento.update({
      where: { id },
      data: {
        status: 'confirmado',
      },
    });

    // Enviar notificação WhatsApp
    try {
      const telefone = agendamentoAtualizado.clienteRel?.telefone || agendamentoAtualizado.telefone;
      if (telefone) {
        await notificarConfirmacaoAgendamento({
          telefone,
          nomeCliente: agendamentoAtualizado.clienteRel?.nome || agendamentoAtualizado.cliente,
          nomeBarbearia: agendamentoAtualizado.barbearia.nome,
          data: agendamentoAtualizado.data,
          horario: agendamentoAtualizado.data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          servico: agendamentoAtualizado.servico.nome,
        });
      }
    } catch (notifError) {
      console.error('Erro ao enviar notificação de confirmação:', notifError);
      // Não falha a requisição se a notificação falhar
    }

    res.json({
      sucesso: true,
      mensagem: 'Agendamento confirmado com sucesso',
      agendamento: agendamentoAtualizado,
    });
  } catch (error) {
    console.error('Erro ao confirmar agendamento:', error);
    res.status(500).json({ error: 'Erro ao confirmar agendamento' });
  }
}

/**
 * Recusar agendamento
 */
export async function recusarAgendamento(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const agendamento = await prisma.agendamento.findUnique({
      where: { id },
      include: {
        barbearia: {
          select: {
            modoConfirmacao: true,
          },
        },
      },
    });

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    if (agendamento.status === 'recusado') {
      return res.status(400).json({ error: 'Agendamento já foi recusado' });
    }

    if (agendamento.status === 'concluido') {
      return res.status(400).json({ error: 'Não é possível recusar um agendamento já concluído' });
    }

    // Verificar janela de tempo para recusar (modo híbrido)
    if (
      agendamento.barbearia.modoConfirmacao === 'hibrido' &&
      agendamento.confirmadoAutomaticamente &&
      agendamento.dataConfirmacaoAutomatica
    ) {
      const agora = new Date();
      const dataConfirmacao = new Date(agendamento.dataConfirmacaoAutomatica);
      const horasDecorridas = (agora.getTime() - dataConfirmacao.getTime()) / (1000 * 60 * 60);

      if (horasDecorridas > 2) {
        return res.status(400).json({
          error: 'Não é possível recusar este agendamento. A janela de 2 horas para recusar já expirou.',
        });
      }
    }

    const agendamentoCompleto = await prisma.agendamento.findUnique({
      where: { id },
      include: {
        clienteRel: true,
        servico: true,
        barbearia: true,
      },
    });

    if (!agendamentoCompleto) {
      return res.status(404).json({ error: 'Erro ao atualizar agendamento' });
    }

    const agendamentoAtualizado = await prisma.agendamento.update({
      where: { id },
      data: {
        status: 'recusado',
        observacao: motivo 
          ? `${agendamento.observacao || ''}\n[Recusado] ${motivo}`.trim()
          : agendamento.observacao,
      },
      include: {
        clienteRel: true,
        servico: true,
        barbearia: true,
      },
    });

    // Enviar notificação WhatsApp
    try {
      const telefone = agendamentoCompleto.clienteRel?.telefone || agendamentoCompleto.telefone;
      if (telefone) {
        await notificarRecusaAgendamento({
          telefone,
          nomeCliente: agendamentoCompleto.clienteRel?.nome || agendamentoCompleto.cliente,
          nomeBarbearia: agendamentoCompleto.barbearia.nome,
          data: agendamentoCompleto.data,
          horario: agendamentoCompleto.data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          servico: agendamentoCompleto.servico.nome,
          motivo,
        });
      }
    } catch (notifError) {
      console.error('Erro ao enviar notificação de recusa:', notifError);
      // Não falha a requisição se a notificação falhar
    }

    res.json({
      sucesso: true,
      mensagem: 'Agendamento recusado',
      agendamento: agendamentoAtualizado,
    });
  } catch (error) {
    console.error('Erro ao recusar agendamento:', error);
    res.status(500).json({ error: 'Erro ao recusar agendamento' });
  }
}

/**
 * Cancelar agendamento
 */
export async function cancelarAgendamento(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const agendamento = await prisma.agendamento.findUnique({
      where: { id },
    });

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    if (agendamento.status === 'cancelado') {
      return res.status(400).json({ error: 'Agendamento já foi cancelado' });
    }

    if (agendamento.status === 'concluido') {
      return res.status(400).json({ error: 'Não é possível cancelar um agendamento já concluído' });
    }

    const agendamentoAtualizado = await prisma.agendamento.update({
      where: { id },
      data: {
        status: 'cancelado',
        observacao: motivo 
          ? `${agendamento.observacao || ''}\n[Cancelado] ${motivo}`.trim()
          : agendamento.observacao,
      },
      include: {
        clienteRel: true,
        servico: true,
        barbearia: true,
      },
    });

    res.json({
      sucesso: true,
      mensagem: 'Agendamento cancelado',
      agendamento: agendamentoAtualizado,
    });
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    res.status(500).json({ error: 'Erro ao cancelar agendamento' });
  }
}

/**
 * Marcar agendamento como concluído
 */
export async function concluirAgendamento(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const agendamento = await prisma.agendamento.findUnique({
      where: { id },
    });

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    if (agendamento.status === 'concluido') {
      return res.status(400).json({ error: 'Agendamento já está concluído' });
    }

    const agendamentoAtualizado = await prisma.agendamento.update({
      where: { id },
      data: {
        status: 'concluido',
      },
      include: {
        clienteRel: true,
        servico: true,
        barbearia: true,
      },
    });

    res.json({
      sucesso: true,
      mensagem: 'Agendamento marcado como concluído',
      agendamento: agendamentoAtualizado,
    });
  } catch (error) {
    console.error('Erro ao concluir agendamento:', error);
    res.status(500).json({ error: 'Erro ao concluir agendamento' });
  }
}

/**
 * Criar novo agendamento com lógica híbrida
 */
export async function criarAgendamento(req: Request, res: Response) {
  try {
    const { barbeariaId, clienteId, servicoId, profissionalId, cliente, telefone, data, horario, observacao } = req.body;

    if (!barbeariaId || !servicoId || !data || !horario) {
      return res.status(400).json({ error: 'Campos obrigatórios: barbeariaId, servicoId, data, horario' });
    }

    // Buscar configuração da barbearia e serviço
    const [barbearia, servico] = await Promise.all([
      prisma.barbearia.findUnique({
        where: { id: barbeariaId },
        select: { modoConfirmacao: true },
      }),
      prisma.servico.findUnique({
        where: { id: servicoId },
        select: { duracao: true },
      }),
    ]);

    if (!barbearia) {
      return res.status(404).json({ error: 'Barbearia não encontrada' });
    }

    if (!servico) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    // Verificar disponibilidade se profissional foi informado
    if (profissionalId) {
      const disponivel = await verificarDisponibilidadeProfissional(
        profissionalId,
        data,
        horario,
        servico.duracao,
        barbeariaId
      );

      if (!disponivel) {
        return res.status(400).json({ error: 'Horário não disponível para este profissional' });
      }
    }

    const modoConfirmacao = (barbearia.modoConfirmacao || 'hibrido') as ModoConfirmacao;
    
    // Combinar data e horário
    const dataAgendamento = new Date(data);
    const [hora, minuto] = horario.split(':').map(Number);
    dataAgendamento.setHours(hora, minuto, 0, 0);

    // Determinar status inicial baseado no modo
    let statusInicial = 'pendente';
    let confirmadoAutomaticamente = false;
    let dataConfirmacaoAutomatica: Date | null = null;

    if (modoConfirmacao === 'automatico' || modoConfirmacao === 'hibrido') {
      statusInicial = 'confirmado';
      confirmadoAutomaticamente = true;
      dataConfirmacaoAutomatica = new Date();
    }

    // Criar agendamento
    const agendamento = await prisma.agendamento.create({
      data: {
        barbeariaId,
        servicoId,
        clienteId: clienteId || null,
        cliente: cliente || 'Cliente não cadastrado',
        telefone: telefone || '',
        data: dataAgendamento,
        horario,
        status: statusInicial,
        observacao: observacao || null,
        confirmadoAutomaticamente,
        dataConfirmacaoAutomatica,
      },
      include: {
        clienteRel: true,
        servico: true,
        barbearia: true,
      },
    });

    // Associar profissional se informado
    if (profissionalId) {
      await prisma.agendamentoProfissional.create({
        data: {
          agendamentoId: agendamento.id,
          profissionalId,
        },
      });
    }

    // Enviar notificação se foi confirmado automaticamente
    if (statusInicial === 'confirmado') {
      try {
        const telefoneCliente = agendamento.clienteRel?.telefone || agendamento.telefone;
        if (telefoneCliente) {
          await notificarConfirmacaoAgendamento({
            telefone: telefoneCliente,
            nomeCliente: agendamento.clienteRel?.nome || agendamento.cliente,
            nomeBarbearia: agendamento.barbearia.nome,
            data: agendamento.data,
            horario: agendamento.data.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            servico: agendamento.servico.nome,
          });
        }
      } catch (notifError) {
        console.error('Erro ao enviar notificação de confirmação automática:', notifError);
        // Não falha a criação se a notificação falhar
      }
    }

    res.status(201).json({
      sucesso: true,
      mensagem: `Agendamento criado e ${statusInicial === 'confirmado' ? 'confirmado automaticamente' : 'aguardando confirmação'}`,
      agendamento,
    });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
}

/**
 * Atualizar configuração de confirmação da barbearia
 */
export async function atualizarConfiguracaoConfirmacao(req: Request, res: Response) {
  try {
    const { barbeariaId } = req.params;
    const { modoConfirmacao } = req.body;

    if (!modoConfirmacao || !['automatico', 'manual', 'hibrido'].includes(modoConfirmacao)) {
      return res.status(400).json({
        error: 'modoConfirmacao deve ser: automatico, manual ou hibrido',
      });
    }

    const barbearia = await prisma.barbearia.update({
      where: { id: barbeariaId },
      data: {
        modoConfirmacao: modoConfirmacao as ModoConfirmacao,
      },
      select: {
        id: true,
        nome: true,
        modoConfirmacao: true,
      },
    });

    res.json({
      sucesso: true,
      mensagem: 'Configuração de confirmação atualizada',
      barbearia,
    });
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    res.status(500).json({ error: 'Erro ao atualizar configuração' });
  }
}

/**
 * Listar agendamentos pendentes de uma barbearia
 */
export async function listarAgendamentosPendentes(req: Request, res: Response) {
  try {
    const { barbeariaId } = req.params;

    const agendamentos = await prisma.agendamento.findMany({
      where: {
        barbeariaId,
        status: 'pendente',
      },
      include: {
        clienteRel: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
        servico: {
          select: {
            id: true,
            nome: true,
            preco: true,
            duracao: true,
          },
        },
      },
      orderBy: {
        data: 'asc',
      },
    });

    res.json(agendamentos);
  } catch (error) {
    console.error('Erro ao listar agendamentos pendentes:', error);
    res.status(500).json({ error: 'Erro ao listar agendamentos pendentes' });
  }
}
