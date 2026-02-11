import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * GET /api/dono/planos-cliente
 * Listar planos de clientes da barbearia (dono)
 */
export async function listarPlanosCliente(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const planos = await prisma.planoCliente.findMany({
      where: {
        barbeariaId,
      },
      orderBy: {
        valor: 'asc',
      },
    });

    res.json(planos);
  } catch (error: any) {
    console.error('Erro ao listar planos de clientes:', error);
    res.status(500).json({ error: 'Erro ao listar planos de clientes' });
  }
}

/**
 * GET /api/dono/planos-cliente/:id
 * Buscar plano específico
 */
export async function buscarPlanoCliente(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { id } = req.params;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const plano = await prisma.planoCliente.findFirst({
      where: {
        id,
        barbeariaId,
      },
      include: {
        _count: {
          select: {
            assinaturas: true,
          },
        },
      },
    });

    if (!plano) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    res.json(plano);
  } catch (error: any) {
    console.error('Erro ao buscar plano de cliente:', error);
    res.status(500).json({ error: 'Erro ao buscar plano de cliente' });
  }
}

/**
 * POST /api/dono/planos-cliente
 * Criar novo plano de cliente
 */
export async function criarPlanoCliente(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { nome, descricao, valor, duracaoMeses, beneficios } = req.body;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    if (!nome || !valor || !duracaoMeses) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: nome, valor, duracaoMeses' 
      });
    }

    const plano = await prisma.planoCliente.create({
      data: {
        nome,
        descricao,
        valor: parseFloat(valor),
        duracaoMeses: parseInt(duracaoMeses),
        beneficios: beneficios || [],
        barbeariaId,
      },
    });

    res.status(201).json(plano);
  } catch (error: any) {
    console.error('Erro ao criar plano de cliente:', error);
    res.status(500).json({ error: 'Erro ao criar plano de cliente' });
  }
}

/**
 * PUT /api/dono/planos-cliente/:id
 * Atualizar plano de cliente
 */
export async function atualizarPlanoCliente(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { id } = req.params;
    const { nome, descricao, valor, duracaoMeses, beneficios, ativo } = req.body;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    // Verificar se o plano pertence à barbearia
    const planoExistente = await prisma.planoCliente.findFirst({
      where: {
        id,
        barbeariaId,
      },
    });

    if (!planoExistente) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    const plano = await prisma.planoCliente.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(descricao !== undefined && { descricao }),
        ...(valor !== undefined && { valor: parseFloat(valor) }),
        ...(duracaoMeses !== undefined && { duracaoMeses: parseInt(duracaoMeses) }),
        ...(beneficios !== undefined && { beneficios }),
        ...(ativo !== undefined && { ativo }),
      },
    });

    res.json(plano);
  } catch (error: any) {
    console.error('Erro ao atualizar plano de cliente:', error);
    res.status(500).json({ error: 'Erro ao atualizar plano de cliente' });
  }
}

/**
 * DELETE /api/dono/planos-cliente/:id
 * Deletar plano de cliente
 */
export async function deletarPlanoCliente(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { id } = req.params;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    // Verificar se o plano pertence à barbearia
    const plano = await prisma.planoCliente.findFirst({
      where: {
        id,
        barbeariaId,
      },
      include: {
        _count: {
          select: {
            assinaturas: true,
          },
        },
      },
    });

    if (!plano) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    // Não permitir deletar se houver assinaturas ativas
    if (plano._count.assinaturas > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar plano com assinaturas ativas' 
      });
    }

    await prisma.planoCliente.delete({
      where: { id },
    });

    res.json({ sucesso: true, mensagem: 'Plano deletado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao deletar plano de cliente:', error);
    res.status(500).json({ error: 'Erro ao deletar plano de cliente' });
  }
}

