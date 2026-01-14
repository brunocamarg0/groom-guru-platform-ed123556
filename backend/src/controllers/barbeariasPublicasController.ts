import { Request, Response } from 'express';
import prisma from '../lib/prisma';

/**
 * Listar barbearias públicas (ativas) para clientes
 * Retorna apenas barbearias ativas com seus serviços disponíveis
 */
export async function listarBarbeariasPublicas(req: Request, res: Response) {
  try {
    const { busca, cidade, bairro } = req.query;

    const where: any = {
      status: 'ativa', // Apenas barbearias ativas
    };

    // Busca por nome
    if (busca && typeof busca === 'string') {
      where.nome = {
        contains: busca,
        mode: 'insensitive',
      };
    }

    // Busca por endereço (cidade ou bairro)
    if (cidade || bairro) {
      where.OR = [];
      if (cidade) {
        where.OR.push({
          endereco: {
            contains: cidade as string,
            mode: 'insensitive',
          },
        });
      }
      if (bairro) {
        where.OR.push({
          endereco: {
            contains: bairro as string,
            mode: 'insensitive',
          },
        });
      }
    }

    const barbearias = await prisma.barbearia.findMany({
      where,
      include: {
        servicos: {
          where: {
            ativo: true, // Apenas serviços ativos
          },
          orderBy: {
            ordem: 'asc',
          },
        },
        profissionais: {
          where: {
            ativo: true, // Apenas profissionais ativos
          },
          select: {
            id: true,
            nome: true,
            foto: true,
            especialidades: true,
          },
        },
        _count: {
          select: {
            agendamentos: {
              where: {
                status: {
                  in: ['confirmado', 'concluido'],
                },
              },
            },
            servicos: {
              where: {
                ativo: true,
              },
            },
          },
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });

    // Formatar resposta para o frontend
    const barbeariasFormatadas = barbearias.map((b) => ({
      id: b.id,
      nome: b.nome,
      email: b.email,
      telefone: b.telefone,
      endereco: b.endereco,
      servicos: b.servicos.map((s) => ({
        id: s.id,
        nome: s.nome,
        descricao: s.descricao,
        duracao: s.duracao,
        preco: s.preco,
        ativo: s.ativo,
        ordem: s.ordem,
      })),
      profissionais: b.profissionais,
      totalAgendamentos: b._count.agendamentos,
      totalServicos: b._count.servicos,
    }));

    res.json(barbeariasFormatadas);
  } catch (error) {
    console.error('Erro ao listar barbearias públicas:', error);
    res.status(500).json({ error: 'Erro ao listar barbearias' });
  }
}

/**
 * Buscar barbearia pública por ID (para clientes)
 */
export async function buscarBarbeariaPublica(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const barbearia = await prisma.barbearia.findFirst({
      where: {
        id,
        status: 'ativa', // Apenas se estiver ativa
      },
      include: {
        servicos: {
          where: {
            ativo: true,
          },
          orderBy: {
            ordem: 'asc',
          },
        },
        profissionais: {
          where: {
            ativo: true,
          },
          select: {
            id: true,
            nome: true,
            foto: true,
            especialidades: true,
            telefone: true,
          },
        },
        _count: {
          select: {
            agendamentos: {
              where: {
                status: {
                  in: ['confirmado', 'concluido'],
                },
              },
            },
          },
        },
      },
    });

    if (!barbearia) {
      return res.status(404).json({ error: 'Barbearia não encontrada ou não está disponível' });
    }

    // Formatar resposta
    const barbeariaFormatada = {
      id: barbearia.id,
      nome: barbearia.nome,
      email: barbearia.email,
      telefone: barbearia.telefone,
      endereco: barbearia.endereco,
      servicos: barbearia.servicos.map((s) => ({
        id: s.id,
        nome: s.nome,
        descricao: s.descricao,
        duracao: s.duracao,
        preco: s.preco,
        ativo: s.ativo,
        ordem: s.ordem,
      })),
      profissionais: barbearia.profissionais,
      totalAgendamentos: barbearia._count.agendamentos,
    };

    res.json(barbeariaFormatada);
  } catch (error) {
    console.error('Erro ao buscar barbearia pública:', error);
    res.status(500).json({ error: 'Erro ao buscar barbearia' });
  }
}

