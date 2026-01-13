import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Listar notificações da barbearia do dono
 */
export async function listarNotificacoes(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { lida, tipo } = req.query;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const where: any = {
      barbeariaId,
    };

    if (lida !== undefined) {
      where.lida = lida === 'true';
    }

    if (tipo && typeof tipo === 'string') {
      where.tipo = tipo;
    }

    const notificacoes = await prisma.notificacao.findMany({
      where,
      orderBy: { data: 'desc' },
      take: 100, // Limitar a 100 notificações mais recentes
    });

    res.json(notificacoes);
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    res.status(500).json({ error: 'Erro ao listar notificações' });
  }
}

/**
 * Marcar notificação como lida
 */
export async function marcarNotificacaoLida(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { barbeariaId } = req;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    // Verificar se a notificação pertence à barbearia
    const notificacao = await prisma.notificacao.findFirst({
      where: { id, barbeariaId },
    });

    if (!notificacao) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    const notificacaoAtualizada = await prisma.notificacao.update({
      where: { id },
      data: { lida: true },
    });

    res.json(notificacaoAtualizada);
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
  }
}

/**
 * Marcar todas as notificações como lidas
 */
export async function marcarTodasComoLidas(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    await prisma.notificacao.updateMany({
      where: {
        barbeariaId,
        lida: false,
      },
      data: { lida: true },
    });

    res.json({ sucesso: true, mensagem: 'Todas as notificações foram marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    res.status(500).json({ error: 'Erro ao marcar todas as notificações como lidas' });
  }
}

