import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequestCliente } from '../middleware/authCliente';

/**
 * Obter perfil do cliente logado
 */
export async function obterPerfil(req: AuthRequestCliente, res: Response) {
  try {
    const clienteId = req.userId;

    if (!clienteId) {
      return res.status(401).json({ error: 'Cliente não autenticado' });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        foto: true,
        dataNascimento: true,
        createdAt: true,
        ativo: true,
      },
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json(cliente);
  } catch (error) {
    console.error('Erro ao obter perfil do cliente:', error);
    res.status(500).json({ error: 'Erro ao obter perfil' });
  }
}

/**
 * Atualizar perfil do cliente
 */
export async function atualizarPerfil(req: AuthRequestCliente, res: Response) {
  try {
    const clienteId = req.userId;
    const { nome, telefone, dataNascimento, foto } = req.body;

    if (!clienteId) {
      return res.status(401).json({ error: 'Cliente não autenticado' });
    }

    const cliente = await prisma.cliente.update({
      where: { id: clienteId },
      data: {
        ...(nome && { nome }),
        ...(telefone !== undefined && { telefone: telefone || null }),
        ...(dataNascimento && { dataNascimento: new Date(dataNascimento) }),
        ...(foto !== undefined && { foto: foto || null }),
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        foto: true,
        dataNascimento: true,
        createdAt: true,
      },
    });

    res.json(cliente);
  } catch (error) {
    console.error('Erro ao atualizar perfil do cliente:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
}

/**
 * Listar agendamentos do cliente logado
 */
export async function listarMeusAgendamentos(req: AuthRequestCliente, res: Response) {
  try {
    const clienteId = req.userId;
    const { status } = req.query;

    if (!clienteId) {
      return res.status(401).json({ error: 'Cliente não autenticado' });
    }

    const where: any = {
      clienteId,
    };

    if (status && typeof status === 'string') {
      where.status = status;
    }

    const agendamentos = await prisma.agendamento.findMany({
      where,
      include: {
        servico: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            duracao: true,
            preco: true,
          },
        },
        pagamento: {
          select: {
            id: true,
            valor: true,
            metodo: true,
            status: true,
            dataPagamento: true,
          },
        },
        profissionais: {
          include: {
            profissional: {
              select: {
                id: true,
                nome: true,
                foto: true,
              },
            },
          },
        },
      },
      orderBy: { data: 'desc' },
    });

    res.json(agendamentos);
  } catch (error) {
    console.error('Erro ao listar agendamentos do cliente:', error);
    res.status(500).json({ error: 'Erro ao listar agendamentos' });
  }
}

/**
 * Buscar agendamento específico do cliente
 */
export async function buscarMeuAgendamento(req: AuthRequestCliente, res: Response) {
  try {
    const clienteId = req.userId;
    const { id } = req.params;

    if (!clienteId) {
      return res.status(401).json({ error: 'Cliente não autenticado' });
    }

    const agendamento = await prisma.agendamento.findFirst({
      where: {
        id,
        clienteId, // Garantir que o agendamento pertence ao cliente
      },
      include: {
        servico: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            duracao: true,
            preco: true,
          },
        },
        pagamento: {
          select: {
            id: true,
            valor: true,
            metodo: true,
            status: true,
            dataPagamento: true,
          },
        },
        profissionais: {
          include: {
            profissional: {
              select: {
                id: true,
                nome: true,
                foto: true,
              },
            },
          },
        },
        barbearia: {
          select: {
            id: true,
            nome: true,
            telefone: true,
            endereco: true,
          },
        },
      },
    });

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    res.json(agendamento);
  } catch (error) {
    console.error('Erro ao buscar agendamento do cliente:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamento' });
  }
}

/**
 * Criar novo agendamento (cliente)
 */
export async function criarMeuAgendamento(req: AuthRequestCliente, res: Response) {
  try {
    const clienteId = req.userId;
    const { barbeariaId, servicoId, data, horario, observacoes, profissionalId } = req.body;

    if (!clienteId) {
      return res.status(401).json({ error: 'Cliente não autenticado' });
    }

    if (!barbeariaId || !servicoId || !data || !horario) {
      return res.status(400).json({ error: 'Campos obrigatórios: barbeariaId, servicoId, data, horario' });
    }

    // Buscar dados do cliente
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Usar meio-dia UTC para evitar problemas de timezone
    // O horário real é armazenado no campo 'horario' separadamente
    const dataHora = new Date(`${data}T12:00:00.000Z`);

    // Criar agendamento
    const agendamento = await prisma.agendamento.create({
      data: {
        clienteId,
        cliente: cliente.nome,
        telefone: cliente.telefone || '',
        barbeariaId,
        servicoId,
        data: dataHora,
        horario,
        observacao: observacoes || null,
        status: 'pendente',
      },
    });

    // Se houver profissional, associar
    if (profissionalId) {
      await prisma.agendamentoProfissional.create({
        data: {
          agendamentoId: agendamento.id,
          profissionalId,
        },
      });
    }

    // Buscar agendamento completo
    const agendamentoCompleto = await prisma.agendamento.findUnique({
      where: { id: agendamento.id },
      include: {
        servico: true,
        profissionais: {
          include: {
            profissional: true,
          },
        },
      },
    });

    res.status(201).json(agendamentoCompleto);
  } catch (error) {
    console.error('Erro ao criar agendamento do cliente:', error);
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
}

/**
 * Criar pagamento para um agendamento
 */
export async function criarPagamento(req: AuthRequestCliente, res: Response) {
  try {
    const clienteId = req.userId;
    const { agendamentoId, valor, metodo, status, cupomDesconto, cashbackGerado } = req.body;

    if (!clienteId) {
      return res.status(401).json({ error: 'Cliente não autenticado' });
    }

    if (!agendamentoId || !valor || !metodo) {
      return res.status(400).json({ error: 'Dados incompletos para criar pagamento' });
    }

    // Verificar se o agendamento pertence ao cliente
    const agendamento = await prisma.agendamento.findFirst({
      where: {
        id: agendamentoId,
        clienteId,
      },
      include: {
        servico: true,
        pagamento: true,
      },
    });

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado ou não pertence a você' });
    }

    // Verificar se já existe pagamento
    if (agendamento.pagamento) {
      return res.status(400).json({ error: 'Este agendamento já possui um pagamento' });
    }

    // Criar pagamento
    const pagamento = await prisma.pagamento.create({
      data: {
        agendamentoId,
        valor: parseFloat(valor),
        metodo,
        status: status || 'pago',
        dataPagamento: status === 'pago' ? new Date() : null,
        taxaGateway: metodo === 'pix' ? 0 : valor * 0.039, // 3.9% para cartão
      },
      include: {
        agendamento: {
          include: {
            servico: true,
          },
        },
      },
    });

    // Atualizar status do agendamento se pagamento foi aprovado
    if (status === 'pago') {
      await prisma.agendamento.update({
        where: { id: agendamentoId },
        data: { status: 'confirmado' },
      });
    }

    res.status(201).json(pagamento);
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    res.status(500).json({ error: 'Erro ao criar pagamento' });
  }
}

/**
 * Cancelar agendamento do cliente
 */
export async function cancelarMeuAgendamento(req: AuthRequestCliente, res: Response) {
  try {
    const clienteId = req.userId;
    const { id } = req.params;

    if (!clienteId) {
      return res.status(401).json({ error: 'Cliente não autenticado' });
    }

    // Verificar se o agendamento pertence ao cliente
    const agendamento = await prisma.agendamento.findFirst({
      where: {
        id,
        clienteId,
        status: { in: ['pendente', 'confirmado'] }, // Só pode cancelar pendentes ou confirmados
      },
    });

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado ou não pode ser cancelado' });
    }

    // Atualizar status
    const agendamentoCancelado = await prisma.agendamento.update({
      where: { id },
      data: { status: 'cancelado' },
      include: {
        servico: true,
      },
    });

    res.json(agendamentoCancelado);
  } catch (error) {
    console.error('Erro ao cancelar agendamento do cliente:', error);
    res.status(500).json({ error: 'Erro ao cancelar agendamento' });
  }
}

