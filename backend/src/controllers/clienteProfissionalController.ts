import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * GET /api/dono/clientes-profissionais
 * Listar todas as atribuições de clientes a profissionais
 */
export async function listarClientesProfissionais(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { profissionalId, clienteId } = req.query;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const where: any = {
      cliente: {
        agendamentos: {
          some: {
            barbeariaId,
          },
        },
      },
      profissional: {
        barbeariaId,
      },
    };

    if (profissionalId && typeof profissionalId === 'string') {
      where.profissionalId = profissionalId;
    }

    if (clienteId && typeof clienteId === 'string') {
      where.clienteId = clienteId;
    }

    const atribuicoes = await prisma.clienteProfissional.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
        profissional: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: {
        dataInicio: 'desc',
      },
    });

    res.json(atribuicoes);
  } catch (error: any) {
    console.error('Erro ao listar clientes-profissionais:', error);
    res.status(500).json({ error: 'Erro ao listar atribuições' });
  }
}

/**
 * POST /api/dono/clientes-profissionais
 * Criar atribuição de cliente a profissional
 */
export async function criarClienteProfissional(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { clienteId, profissionalId } = req.body;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    if (!clienteId || !profissionalId) {
      return res.status(400).json({ 
        error: 'clienteId e profissionalId são obrigatórios' 
      });
    }

    // Verificar se cliente existe (sem exigir que tenha agendamentos)
    const cliente = await prisma.cliente.findUnique({
      where: {
        id: clienteId,
      },
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Verificar se profissional pertence à barbearia
    const profissional = await prisma.profissional.findFirst({
      where: {
        id: profissionalId,
        barbeariaId,
      },
    });

    if (!profissional) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    // Desativar atribuições anteriores do cliente
    await prisma.clienteProfissional.updateMany({
      where: {
        clienteId,
        ativo: true,
      },
      data: {
        ativo: false,
        dataFim: new Date(),
      },
    });

    // Criar nova atribuição
    const atribuicao = await prisma.clienteProfissional.create({
      data: {
        clienteId,
        profissionalId,
        ativo: true,
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
        profissional: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    res.status(201).json(atribuicao);
  } catch (error: any) {
    console.error('Erro ao criar atribuição cliente-profissional:', error);
    res.status(500).json({ error: 'Erro ao criar atribuição' });
  }
}

/**
 * DELETE /api/dono/clientes-profissionais/:id
 * Remover atribuição de cliente a profissional
 */
export async function removerClienteProfissional(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { id } = req.params;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    // Verificar se a atribuição pertence à barbearia
    const atribuicao = await prisma.clienteProfissional.findFirst({
      where: {
        id,
        cliente: {
          agendamentos: {
            some: {
              barbeariaId,
            },
          },
        },
        profissional: {
          barbeariaId,
        },
      },
    });

    if (!atribuicao) {
      return res.status(404).json({ error: 'Atribuição não encontrada' });
    }

    // Desativar ao invés de deletar
    await prisma.clienteProfissional.update({
      where: { id },
      data: {
        ativo: false,
        dataFim: new Date(),
      },
    });

    res.json({ message: 'Atribuição removida com sucesso' });
  } catch (error: any) {
    console.error('Erro ao remover atribuição cliente-profissional:', error);
    res.status(500).json({ error: 'Erro ao remover atribuição' });
  }
}

/**
 * GET /api/dono/profissionais/:id/clientes
 * Listar clientes atribuídos a um profissional
 */
export async function listarClientesDoProfissional(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { id } = req.params;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const atribuicoes = await prisma.clienteProfissional.findMany({
      where: {
        profissionalId: id,
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
      orderBy: {
        dataInicio: 'desc',
      },
    });

    res.json(atribuicoes.map(a => a.cliente));
  } catch (error: any) {
    console.error('Erro ao listar clientes do profissional:', error);
    res.status(500).json({ error: 'Erro ao listar clientes' });
  }
}

