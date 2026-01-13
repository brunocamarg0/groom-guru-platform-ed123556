import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Listar avaliações da barbearia do dono
 */
export async function listarAvaliacoes(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { respondida } = req.query;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const where: any = {
      agendamento: {
        barbeariaId,
      },
    };

    if (respondida !== undefined) {
      if (respondida === 'true') {
        where.resposta = { not: null };
      } else {
        where.resposta = null;
      }
    }

    const avaliacoes = await prisma.avaliacao.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            foto: true,
          },
        },
        agendamento: {
          include: {
            servico: {
              select: {
                id: true,
                nome: true,
              },
            },
            profissionais: {
              include: {
                profissional: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(avaliacoes);
  } catch (error) {
    console.error('Erro ao listar avaliações:', error);
    res.status(500).json({ error: 'Erro ao listar avaliações' });
  }
}

/**
 * Responder avaliação
 */
export async function responderAvaliacao(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { barbeariaId } = req;
    const { resposta } = req.body;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    if (!resposta || resposta.trim() === '') {
      return res.status(400).json({ error: 'Resposta é obrigatória' });
    }

    // Verificar se a avaliação pertence a um agendamento da barbearia
    const avaliacao = await prisma.avaliacao.findFirst({
      where: {
        id,
        agendamento: {
          barbeariaId,
        },
      },
    });

    if (!avaliacao) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    const avaliacaoAtualizada = await prisma.avaliacao.update({
      where: { id },
      data: {
        resposta: resposta.trim(),
        respondidoEm: new Date(),
      },
    });

    res.json(avaliacaoAtualizada);
  } catch (error) {
    console.error('Erro ao responder avaliação:', error);
    res.status(500).json({ error: 'Erro ao responder avaliação' });
  }
}

/**
 * Obter estatísticas de avaliações
 */
export async function obterEstatisticasAvaliacoes(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const avaliacoes = await prisma.avaliacao.findMany({
      where: {
        agendamento: {
          barbeariaId,
        },
      },
      select: {
        notaProfissional: true,
        notaAtendimento: true,
        notaAmbiente: true,
      },
    });

    if (avaliacoes.length === 0) {
      return res.json({
        total: 0,
        notaMediaProfissional: 0,
        notaMediaAtendimento: 0,
        notaMediaAmbiente: 0,
        notaMediaGeral: 0,
      });
    }

    const total = avaliacoes.length;
    const notaMediaProfissional = avaliacoes.reduce((sum, a) => sum + a.notaProfissional, 0) / total;
    const notaMediaAtendimento = avaliacoes.reduce((sum, a) => sum + a.notaAtendimento, 0) / total;
    const notaMediaAmbiente = avaliacoes.reduce((sum, a) => sum + a.notaAmbiente, 0) / total;
    const notaMediaGeral = (notaMediaProfissional + notaMediaAtendimento + notaMediaAmbiente) / 3;

    res.json({
      total,
      notaMediaProfissional: Math.round(notaMediaProfissional * 10) / 10,
      notaMediaAtendimento: Math.round(notaMediaAtendimento * 10) / 10,
      notaMediaAmbiente: Math.round(notaMediaAmbiente * 10) / 10,
      notaMediaGeral: Math.round(notaMediaGeral * 10) / 10,
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas de avaliações:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas de avaliações' });
  }
}

