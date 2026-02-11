import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Listar profissionais da barbearia do dono
 */
export async function listarProfissionais(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const profissionais = await prisma.profissional.findMany({
      where: { barbeariaId },
      orderBy: { nome: 'asc' },
    });

    res.json(profissionais);
  } catch (error) {
    console.error('Erro ao listar profissionais:', error);
    res.status(500).json({ error: 'Erro ao listar profissionais' });
  }
}

/**
 * Buscar profissional por ID
 */
export async function buscarProfissional(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { barbeariaId } = req;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const profissional = await prisma.profissional.findFirst({
      where: {
        id,
        barbeariaId,
      },
      include: {
        agendamentos: {
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

    if (!profissional) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    res.json(profissional);
  } catch (error) {
    console.error('Erro ao buscar profissional:', error);
    res.status(500).json({ error: 'Erro ao buscar profissional' });
  }
}

/**
 * Criar novo profissional
 */
export async function criarProfissional(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { nome, email, telefone, foto, especialidades, comissaoTipo, comissaoValor, comissaoAssinatura } = req.body;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    if (!nome || !telefone) {
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
    }

    const profissional = await prisma.profissional.create({
      data: {
        nome,
        email: email || null,
        telefone,
        foto: foto || null,
        especialidades: especialidades || [],
        comissaoTipo: comissaoTipo || 'percentual',
        comissaoValor: comissaoValor || 0,
        comissaoAssinatura: comissaoAssinatura ? parseFloat(comissaoAssinatura) : 0,
        barbeariaId,
      },
    });

    res.status(201).json(profissional);
  } catch (error) {
    console.error('Erro ao criar profissional:', error);
    res.status(500).json({ error: 'Erro ao criar profissional' });
  }
}

/**
 * Atualizar profissional
 */
export async function atualizarProfissional(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { barbeariaId } = req;
    const { nome, email, telefone, foto, especialidades, comissaoTipo, comissaoValor, comissaoAssinatura, ativo } = req.body;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    // Verificar se o profissional pertence à barbearia
    const profissionalExistente = await prisma.profissional.findFirst({
      where: { id, barbeariaId },
    });

    if (!profissionalExistente) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    const profissional = await prisma.profissional.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(email !== undefined && { email: email || null }),
        ...(telefone && { telefone }),
        ...(foto !== undefined && { foto: foto || null }),
        ...(especialidades && { especialidades }),
        ...(comissaoTipo && { comissaoTipo }),
        ...(comissaoValor !== undefined && { comissaoValor }),
        ...(comissaoAssinatura !== undefined && { comissaoAssinatura: parseFloat(comissaoAssinatura) || 0 }),
        ...(ativo !== undefined && { ativo }),
      },
    });

    res.json(profissional);
  } catch (error) {
    console.error('Erro ao atualizar profissional:', error);
    res.status(500).json({ error: 'Erro ao atualizar profissional' });
  }
}

/**
 * Remover profissional
 */
export async function removerProfissional(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { barbeariaId } = req;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    // Verificar se o profissional pertence à barbearia
    const profissional = await prisma.profissional.findFirst({
      where: { id, barbeariaId },
    });

    if (!profissional) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    await prisma.profissional.delete({
      where: { id },
    });

    res.json({ sucesso: true, mensagem: 'Profissional removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover profissional:', error);
    res.status(500).json({ error: 'Erro ao remover profissional' });
  }
}

/**
 * Toggle ativo/inativo do profissional
 */
export async function toggleAtivoProfissional(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { barbeariaId } = req;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const profissional = await prisma.profissional.findFirst({
      where: { id, barbeariaId },
    });

    if (!profissional) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    const profissionalAtualizado = await prisma.profissional.update({
      where: { id },
      data: { ativo: !profissional.ativo },
    });

    res.json(profissionalAtualizado);
  } catch (error) {
    console.error('Erro ao alterar status do profissional:', error);
    res.status(500).json({ error: 'Erro ao alterar status do profissional' });
  }
}
