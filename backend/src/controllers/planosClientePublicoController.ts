import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequestCliente } from '../middleware/authCliente';

/**
 * GET /api/cliente/planos-disponiveis
 * Listar planos disponíveis para o cliente (da barbearia onde ele tem agendamentos)
 */
export async function listarPlanosDisponiveis(req: AuthRequestCliente, res: Response) {
  try {
    const clienteId = req.userId;

    if (!clienteId) {
      return res.status(401).json({ error: 'Cliente não autenticado' });
    }

    // Buscar barbearias onde o cliente tem agendamentos
    const agendamentos = await prisma.agendamento.findMany({
      where: {
        clienteId,
        status: {
          not: 'cancelado',
        },
      },
      select: {
        barbeariaId: true,
      },
      distinct: ['barbeariaId'],
    });

    const barbeariaIds = agendamentos.map(a => a.barbeariaId);

    if (barbeariaIds.length === 0) {
      return res.json([]);
    }

    // Buscar planos ativos dessas barbearias
    const planos = await prisma.planoCliente.findMany({
      where: {
        barbeariaId: {
          in: barbeariaIds,
        },
        ativo: true,
      },
      include: {
        barbearia: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: {
        valor: 'asc',
      },
    });

    res.json(planos);
  } catch (error: any) {
    console.error('Erro ao listar planos disponíveis:', error);
    res.status(500).json({ error: 'Erro ao listar planos disponíveis' });
  }
}

/**
 * GET /api/cliente/planos-disponiveis/:barbeariaId
 * Listar planos disponíveis de uma barbearia específica
 */
export async function listarPlanosPorBarbearia(req: AuthRequestCliente, res: Response) {
  try {
    const clienteId = req.userId;
    const { barbeariaId } = req.params;

    if (!clienteId) {
      return res.status(401).json({ error: 'Cliente não autenticado' });
    }

    // Verificar se o cliente tem agendamentos nesta barbearia
    const agendamento = await prisma.agendamento.findFirst({
      where: {
        clienteId,
        barbeariaId,
        status: {
          not: 'cancelado',
        },
      },
    });

    if (!agendamento) {
      return res.status(403).json({ error: 'Você não tem agendamentos nesta barbearia' });
    }

    // Buscar planos ativos da barbearia
    const planos = await prisma.planoCliente.findMany({
      where: {
        barbeariaId,
        ativo: true,
      },
      include: {
        barbearia: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: {
        valor: 'asc',
      },
    });

    res.json(planos);
  } catch (error: any) {
    console.error('Erro ao listar planos da barbearia:', error);
    res.status(500).json({ error: 'Erro ao listar planos' });
  }
}

