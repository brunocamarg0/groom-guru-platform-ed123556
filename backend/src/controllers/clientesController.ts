import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Listar clientes (da barbearia do dono)
 */
export async function listarClientes(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { busca, vip } = req.query;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    // Buscar clientes que têm agendamentos na barbearia
    const agendamentos = await prisma.agendamento.findMany({
      where: { barbeariaId },
      select: { clienteId: true },
      distinct: ['clienteId'],
    });

    const clienteIds = agendamentos
      .map((a) => a.clienteId)
      .filter((id): id is string => id !== null);

    const where: any = {
      id: { in: clienteIds },
    };

    if (busca && typeof busca === 'string') {
      where.OR = [
        { nome: { contains: busca, mode: 'insensitive' } },
        { email: { contains: busca, mode: 'insensitive' } },
        { telefone: { contains: busca } },
      ];
    }

    const clientes = await prisma.cliente.findMany({
      where,
      include: {
        _count: {
          select: { agendamentos: true },
        },
      },
      orderBy: { nome: 'asc' },
    });

    res.json(clientes);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ error: 'Erro ao listar clientes' });
  }
}

/**
 * Buscar cliente por ID
 */
export async function buscarCliente(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { barbeariaId } = req;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    // Verificar se o cliente tem agendamentos na barbearia
    const temAgendamento = await prisma.agendamento.findFirst({
      where: {
        clienteId: id,
        barbeariaId,
      },
    });

    if (!temAgendamento) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        agendamentos: {
          where: { barbeariaId },
          include: {
            servico: true,
            pagamento: true,
          },
          orderBy: { data: 'desc' },
        },
        avaliacoes: {
          where: {
            agendamento: {
              barbeariaId,
            },
          },
          include: {
            agendamento: {
              include: {
                servico: true,
              },
            },
          },
        },
      },
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
}

/**
 * Criar novo cliente
 */
export async function criarCliente(req: AuthRequest, res: Response) {
  try {
    const { nome, email, telefone, foto, dataNascimento } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    // Verificar se já existe cliente com esse email
    const clienteExistente = await prisma.cliente.findUnique({
      where: { email },
    });

    if (clienteExistente) {
      return res.status(400).json({ error: 'Já existe um cliente com este email' });
    }

    const cliente = await prisma.cliente.create({
      data: {
        nome,
        email,
        telefone: telefone || null,
        foto: foto || null,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
      },
    });

    res.status(201).json(cliente);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
}

/**
 * Atualizar cliente
 */
export async function atualizarCliente(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { nome, email, telefone, foto, dataNascimento, ativo } = req.body;

    const cliente = await prisma.cliente.findUnique({
      where: { id },
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Se estiver mudando o email, verificar se não existe outro com o mesmo email
    if (email && email !== cliente.email) {
      const emailExistente = await prisma.cliente.findUnique({
        where: { email },
      });

      if (emailExistente) {
        return res.status(400).json({ error: 'Já existe um cliente com este email' });
      }
    }

    const clienteAtualizado = await prisma.cliente.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(email && { email }),
        ...(telefone !== undefined && { telefone: telefone || null }),
        ...(foto !== undefined && { foto: foto || null }),
        ...(dataNascimento && { dataNascimento: new Date(dataNascimento) }),
        ...(ativo !== undefined && { ativo }),
      },
    });

    res.json(clienteAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
}
