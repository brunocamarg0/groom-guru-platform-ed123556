import { Request, Response } from 'express';
import prisma from '../lib/prisma';

/**
 * Listar barbearias públicas (ativas) para clientes
 * Retorna apenas barbearias ativas com seus serviços disponíveis
 */
export async function listarBarbeariasPublicas(req: Request, res: Response) {
  try {
    console.log('🔧 [BARBEARIAS] listarBarbeariasPublicas chamado');
    console.log('🔧 [BARBEARIAS] Query params:', req.query);
    const { busca, cidade, bairro } = req.query;

    const where: any = {
      // Não filtrar por status por enquanto - mostrar todas as barbearias
      // Se houver campo status, pode ser 'ativa', 'pendente', null, etc.
      // Vamos mostrar todas e deixar o frontend filtrar se necessário
    };

    // Busca geral (nome, cidade, bairro ou endereço)
    if (busca && typeof busca === 'string') {
      where.OR = [
        {
          nome: {
            contains: busca,
            mode: 'insensitive',
          },
        },
        {
          cidade: {
            contains: busca,
            mode: 'insensitive',
          },
        },
        {
          bairro: {
            contains: busca,
            mode: 'insensitive',
          },
        },
        {
          endereco: {
            contains: busca,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Busca específica por cidade
    if (cidade && typeof cidade === 'string') {
      where.cidade = {
        contains: cidade,
        mode: 'insensitive',
      };
    }

    // Busca específica por bairro
    if (bairro && typeof bairro === 'string') {
      where.bairro = {
        contains: bairro,
        mode: 'insensitive',
      };
    }

    console.log('🔧 [BARBEARIAS] Where clause:', JSON.stringify(where, null, 2));
    
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

    console.log('🔧 [BARBEARIAS] Total de barbearias encontradas:', barbearias.length);
    
    // Formatar resposta para o frontend
    const barbeariasFormatadas = barbearias.map((b) => ({
      id: b.id,
      nome: b.nome,
      email: b.email,
      telefone: b.telefone,
      endereco: b.endereco,
      cidade: b.cidade,
      bairro: b.bairro,
      cep: b.cep,
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
        // Não filtrar por status - mostrar qualquer barbearia pelo ID
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
      cidade: barbearia.cidade,
      bairro: barbearia.bairro,
      cep: barbearia.cep,
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

