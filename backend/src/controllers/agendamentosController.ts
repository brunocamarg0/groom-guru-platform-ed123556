import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import {
  notificarConfirmacaoAgendamento,
  notificarRecusaAgendamento,
} from '../services/whatsappService';

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
