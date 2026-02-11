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
      // Não filtrar por status por enquanto - mostrar todas as barbearias
      // Se houver campo status, pode ser 'ativa', 'pendente', null, etc.
      // Vamos mostrar todas e deixar o frontend filtrar se necessário
      // Filtrar apenas barbearias com nome válido
      nome: {
        not: null,
      },
    };

    // Busca geral (nome, cidade, bairro ou endereço)
    // Tentar usar mode: 'insensitive', mas se falhar, usar busca case-sensitive
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
    
    // Tentar executar a query
    let barbearias;
    try {
      barbearias = await prisma.barbearia.findMany({
        where: Object.keys(where).length > 0 ? where : {},
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          endereco: true,
          cidade: true,
          bairro: true,
          cep: true,
          foto: true,
          status: true,
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
    } catch (queryError: any) {
      // Se a query falhar com mode: 'insensitive', tentar sem ele
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ [BARBEARIAS] Erro na query com mode: insensitive, tentando sem ele:', queryError?.message);
      }
      
      // Recriar where clause sem mode: 'insensitive'
      const whereFallback: any = {};
      
      if (busca && typeof busca === 'string') {
        whereFallback.OR = [
          { nome: { contains: busca } },
          { cidade: { contains: busca } },
          { bairro: { contains: busca } },
          { endereco: { contains: busca } },
        ];
      }
      
      if (cidade && typeof cidade === 'string') {
        whereFallback.cidade = { contains: cidade };
      }
      
      if (bairro && typeof bairro === 'string') {
        whereFallback.bairro = { contains: bairro };
      }
      
      barbearias = await prisma.barbearia.findMany({
        where: Object.keys(whereFallback).length > 0 ? whereFallback : {},
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          endereco: true,
          cidade: true,
          bairro: true,
          cep: true,
          foto: true,
          status: true,
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
    }
    
    // Formatar resposta para o frontend
    const barbeariasFormatadas = barbearias
      .filter((b) => b && b.id && b.nome) // Filtrar barbearias sem nome ou id
      .map((b) => ({
        id: b.id,
        nome: b.nome || 'Barbearia sem nome', // Garantir que sempre tenha um nome
      email: b.email,
      telefone: b.telefone,
      endereco: b.endereco,
      cidade: b.cidade,
      bairro: b.bairro,
      cep: b.cep,
      foto: b.foto,
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
  } catch (error: any) {
    console.error('❌ [BARBEARIAS] Erro ao listar barbearias públicas:', error);
    console.error('❌ [BARBEARIAS] Stack:', error?.stack);
    console.error('❌ [BARBEARIAS] Message:', error?.message);
    console.error('❌ [BARBEARIAS] Name:', error?.name);
    console.error('❌ [BARBEARIAS] Code:', error?.code);
    console.error('❌ [BARBEARIAS] Meta:', error?.meta);
    
    // Retornar mensagem de erro mais detalhada em desenvolvimento
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Erro ao listar barbearias: ${error?.message || 'Erro desconhecido'}`
      : 'Erro ao listar barbearias';
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
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
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        endereco: true,
        cidade: true,
        bairro: true,
        cep: true,
        foto: true,
        status: true,
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

    if (!barbearia || !barbearia.id || !barbearia.nome) {
      return res.status(404).json({ error: 'Barbearia não encontrada ou não está disponível' });
    }

    // Formatar resposta
    const barbeariaFormatada = {
      id: barbearia.id,
      nome: barbearia.nome || 'Barbearia sem nome',
      email: barbearia.email,
      telefone: barbearia.telefone,
      endereco: barbearia.endereco,
      cidade: barbearia.cidade,
      bairro: barbearia.bairro,
      cep: barbearia.cep,
      foto: barbearia.foto,
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
  } catch (error: any) {
    console.error('❌ [BARBEARIAS] Erro ao buscar barbearia pública:', error);
    console.error('❌ [BARBEARIAS] Stack:', error?.stack);
    console.error('❌ [BARBEARIAS] Message:', error?.message);
    console.error('❌ [BARBEARIAS] Name:', error?.name);
    console.error('❌ [BARBEARIAS] Code:', error?.code);
    console.error('❌ [BARBEARIAS] Meta:', error?.meta);
    
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Erro ao buscar barbearia: ${error?.message || 'Erro desconhecido'}`
      : 'Erro ao buscar barbearia';
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
}

/**
 * Buscar horários ocupados de uma barbearia em uma data específica
 * Retorna todos os horários que já estão agendados (confirmados ou pendentes)
 */
export async function buscarHorariosOcupados(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data } = req.query;

    if (!data || typeof data !== 'string') {
      return res.status(400).json({ error: 'Data é obrigatória (formato: YYYY-MM-DD)' });
    }

    // Criar datas de início e fim do dia usando UTC
    // Isso garante consistência com o armazenamento ao meio-dia UTC
    const dataInicio = new Date(`${data}T00:00:00.000Z`);
    const dataFim = new Date(`${data}T23:59:59.999Z`);

    // Buscar agendamentos confirmados ou pendentes para esta barbearia na data
    const agendamentos = await prisma.agendamento.findMany({
      where: {
        barbeariaId: id,
        data: {
          gte: dataInicio,
          lte: dataFim,
        },
        status: {
          in: ['confirmado', 'pendente', 'concluido'],
        },
      },
      include: {
        servico: {
          select: {
            duracao: true,
          },
        },
      },
    });

    // Extrair apenas os horários ocupados
    // Para cada agendamento, calcular os slots de tempo ocupados baseado na duração do serviço
    const horariosOcupados: string[] = [];
    
    for (const agendamento of agendamentos) {
      if (!agendamento.horario) continue;
      
      // Adicionar o horário inicial
      if (!horariosOcupados.includes(agendamento.horario)) {
        horariosOcupados.push(agendamento.horario);
      }
      
      // Pegar duração do serviço
      const duracao = agendamento.servico?.duracao || 40;
      
      // Se o serviço dura mais que 40 minutos, bloquear slots adicionais
      if (duracao > 40) {
        const [hora, minuto] = agendamento.horario.split(':').map(Number);
        let minutoAtual = hora * 60 + minuto;
        const minutoFim = minutoAtual + duracao;
        
        // Avançar de 40 em 40 minutos e bloquear cada slot
        minutoAtual += 40;
        while (minutoAtual < minutoFim) {
          const novaHora = Math.floor(minutoAtual / 60);
          const novoMinuto = minutoAtual % 60;
          const horarioSlot = `${novaHora.toString().padStart(2, '0')}:${novoMinuto.toString().padStart(2, '0')}`;
          
          if (!horariosOcupados.includes(horarioSlot)) {
            horariosOcupados.push(horarioSlot);
          }
          
          minutoAtual += 40;
        }
      }
    }

    // Ordenar horários
    horariosOcupados.sort();

    res.json({
      barbeariaId: id,
      data,
      horariosOcupados,
      totalAgendamentos: agendamentos.length,
    });
  } catch (error) {
    console.error('Erro ao buscar horários ocupados:', error);
    res.status(500).json({ error: 'Erro ao buscar horários ocupados' });
  }
}

