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
    
    // Log detalhado de cada barbearia encontrada
    if (barbearias.length > 0) {
      console.log('\n📋 [BARBEARIAS] BARBEARIAS CADASTRADAS NO SISTEMA:');
      console.log('═'.repeat(80));
      barbearias.forEach((b, index) => {
        console.log(`\n${index + 1}. ${b.nome}`);
        console.log(`   ID: ${b.id}`);
        console.log(`   Status: ${b.status}`);
        console.log(`   Email: ${b.email || 'Não informado'}`);
        console.log(`   Telefone: ${b.telefone || 'Não informado'}`);
        console.log(`   Cidade: ${b.cidade || 'Não informado'}`);
        console.log(`   Bairro: ${b.bairro || 'Não informado'}`);
        console.log(`   Serviços: ${b.servicos.length} ativos`);
        console.log(`   Profissionais: ${b.profissionais.length} ativos`);
        console.log(`   Total Agendamentos: ${b._count.agendamentos}`);
      });
      console.log('\n═'.repeat(80));
      console.log(`\n✅ Total: ${barbearias.length} barbearia(s) disponível(is) para agendamento\n`);
    } else {
      console.log('⚠️ [BARBEARIAS] NENHUMA BARBEARIA ENCONTRADA!');
      console.log('⚠️ [BARBEARIAS] Verifique se há barbearias cadastradas no banco de dados.');
    }
    
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

    console.log(`🔧 [HORARIOS] Buscando horários ocupados para barbearia ${id} na data ${data}`);

    // Criar datas de início e fim do dia usando timezone de Brasília (-03:00)
    // Isso garante que a busca considere o dia correto independente do servidor
    const dataInicio = new Date(`${data}T00:00:00-03:00`);
    const dataFim = new Date(`${data}T23:59:59.999-03:00`);
    
    console.log(`🔧 [HORARIOS] Range de busca: ${dataInicio.toISOString()} até ${dataFim.toISOString()}`);

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

    console.log(`🔧 [HORARIOS] Agendamentos encontrados: ${agendamentos.length}`);
    agendamentos.forEach((a, i) => {
      console.log(`   ${i + 1}. Horário: ${a.horario}, Status: ${a.status}, Duração serviço: ${a.servico?.duracao || 40}min`);
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

    console.log(`✅ [HORARIOS] ${horariosOcupados.length} horário(s) ocupado(s): ${horariosOcupados.join(', ')}`);

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

