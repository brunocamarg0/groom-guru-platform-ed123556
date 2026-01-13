import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Listar promoções da barbearia do dono
 */
export async function listarPromocoes(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { ativo } = req.query;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const where: any = {
      barbeariaId,
    };

    if (ativo !== undefined) {
      where.ativo = ativo === 'true';
    }

    const promocoes = await prisma.promocao.findMany({
      where,
      include: {
        servico: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(promocoes);
  } catch (error) {
    console.error('Erro ao listar promoções:', error);
    res.status(500).json({ error: 'Erro ao listar promoções' });
  }
}

/**
 * Criar nova promoção
 */
export async function criarPromocao(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { nome, tipo, valor, validoDe, validoAte, ativo, aplicavelA, servicoId, horarioInicio, horarioFim } = req.body;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    if (!nome || !tipo || !valor || !validoDe || !validoAte) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, tipo, valor, validoDe, validoAte' });
    }

    const promocao = await prisma.promocao.create({
      data: {
        nome,
        tipo,
        valor: parseFloat(valor),
        validoDe: new Date(validoDe),
        validoAte: new Date(validoAte),
        ativo: ativo !== undefined ? ativo : true,
        aplicavelA: aplicavelA || 'todos',
        servicoId: servicoId || null,
        horarioInicio: horarioInicio || null,
        horarioFim: horarioFim || null,
        barbeariaId,
      },
    });

    res.status(201).json(promocao);
  } catch (error) {
    console.error('Erro ao criar promoção:', error);
    res.status(500).json({ error: 'Erro ao criar promoção' });
  }
}

/**
 * Atualizar promoção
 */
export async function atualizarPromocao(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { barbeariaId } = req;
    const { nome, tipo, valor, validoDe, validoAte, ativo, aplicavelA, servicoId, horarioInicio, horarioFim } = req.body;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    // Verificar se a promoção pertence à barbearia
    const promocaoExistente = await prisma.promocao.findFirst({
      where: { id, barbeariaId },
    });

    if (!promocaoExistente) {
      return res.status(404).json({ error: 'Promoção não encontrada' });
    }

    const promocao = await prisma.promocao.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(tipo && { tipo }),
        ...(valor !== undefined && { valor: parseFloat(valor) }),
        ...(validoDe && { validoDe: new Date(validoDe) }),
        ...(validoAte && { validoAte: new Date(validoAte) }),
        ...(ativo !== undefined && { ativo }),
        ...(aplicavelA && { aplicavelA }),
        ...(servicoId !== undefined && { servicoId: servicoId || null }),
        ...(horarioInicio !== undefined && { horarioInicio: horarioInicio || null }),
        ...(horarioFim !== undefined && { horarioFim: horarioFim || null }),
      },
    });

    res.json(promocao);
  } catch (error) {
    console.error('Erro ao atualizar promoção:', error);
    res.status(500).json({ error: 'Erro ao atualizar promoção' });
  }
}

/**
 * Remover promoção
 */
export async function removerPromocao(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { barbeariaId } = req;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    // Verificar se a promoção pertence à barbearia
    const promocao = await prisma.promocao.findFirst({
      where: { id, barbeariaId },
    });

    if (!promocao) {
      return res.status(404).json({ error: 'Promoção não encontrada' });
    }

    await prisma.promocao.delete({
      where: { id },
    });

    res.json({ sucesso: true, mensagem: 'Promoção removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover promoção:', error);
    res.status(500).json({ error: 'Erro ao remover promoção' });
  }
}

/**
 * Toggle ativo/inativo da promoção
 */
export async function toggleAtivoPromocao(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { barbeariaId } = req;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const promocao = await prisma.promocao.findFirst({
      where: { id, barbeariaId },
    });

    if (!promocao) {
      return res.status(404).json({ error: 'Promoção não encontrada' });
    }

    const promocaoAtualizada = await prisma.promocao.update({
      where: { id },
      data: { ativo: !promocao.ativo },
    });

    res.json(promocaoAtualizada);
  } catch (error) {
    console.error('Erro ao alterar status da promoção:', error);
    res.status(500).json({ error: 'Erro ao alterar status da promoção' });
  }
}

