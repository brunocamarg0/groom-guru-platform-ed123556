import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Listar clientes (da barbearia do dono)
 * Inclui clientes com agendamentos E clientes criados recentemente (últimos 30 dias)
 */
export async function listarClientes(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { busca, vip } = req.query;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    // Buscar clientes que têm agendamentos na barbearia
    const agendamentos = await prisma.agendamento.findMany({
      where: { barbeariaId },
      select: { clienteId: true },
      distinct: ['clienteId'],
    });

    const clienteIdsComAgendamento = agendamentos
      .map((a) => a.clienteId)
      .filter((id): id is string => id !== null);

    // Buscar TODOS os clientes ativos (sem limite de tempo)
    // Isso garante que TODOS os clientes criados apareçam, mesmo sem agendamentos
    // IMPORTANTE: Para o painel do dono, queremos ver todos os clientes disponíveis
    const clientesAtivos = await prisma.cliente.findMany({
      where: {
        ativo: true,
      },
      select: { id: true },
    });

    const clienteIdsAtivos = clientesAtivos.map((c) => c.id);

    // Combinar IDs: clientes com agendamentos na barbearia + todos os clientes ativos
    // Isso garante que vemos clientes com histórico na barbearia E todos os clientes disponíveis
    const todosClienteIds = [...new Set([...clienteIdsComAgendamento, ...clienteIdsAtivos])];

    console.log('📋 [LISTAR CLIENTES] Clientes com agendamentos na barbearia:', clienteIdsComAgendamento.length);
    console.log('📋 [LISTAR CLIENTES] Total de clientes ativos no sistema:', clienteIdsAtivos.length);
    console.log('📋 [LISTAR CLIENTES] Total de IDs únicos a buscar:', todosClienteIds.length);

    // Se não houver IDs, retornar array vazio (não usar [''] que não funciona)
    const where: any = todosClienteIds.length > 0 
      ? { id: { in: todosClienteIds } }
      : { id: { in: [] } }; // Array vazio retorna nada, que é o comportamento esperado

    if (busca && typeof busca === 'string') {
      where.OR = [
        { nome: { contains: busca, mode: 'insensitive' } },
        { email: { contains: busca, mode: 'insensitive' } },
        { telefone: { contains: busca } },
      ];
    }

    const clientes = await prisma.cliente.findMany({
      where,
      include: {
        agendamentos: {
          where: { barbeariaId },
          select: {
            id: true,
            data: true,
            servico: {
              select: { preco: true },
            },
            pagamento: {
              select: { valor: true },
            },
          },
          orderBy: { data: 'desc' },
        },
        _count: {
          select: { 
            agendamentos: {
              where: { barbeariaId },
            },
          },
        },
      },
      orderBy: { nome: 'asc' },
    });

    // Transformar dados para incluir estatísticas
    const clientesComEstatisticas = clientes.map((cliente) => {
      const agendamentosBarbearia = cliente.agendamentos || [];
      const totalAgendamentos = agendamentosBarbearia.length;
      
      // Calcular ticket médio baseado nos pagamentos
      const pagamentos = agendamentosBarbearia
        .filter((ag) => ag.pagamento)
        .map((ag) => ag.pagamento?.valor || 0);
      
      const ticketMedio = pagamentos.length > 0
        ? pagamentos.reduce((sum, val) => sum + val, 0) / pagamentos.length
        : 0;

      // Último agendamento
      const ultimoAgendamento = agendamentosBarbearia.length > 0
        ? agendamentosBarbearia[0].data
        : null;

      return {
        ...cliente,
        totalAgendamentos,
        ticketMedio,
        ultimoAgendamento,
        frequencia: totalAgendamentos, // Simplificado: total de agendamentos
      };
    });

    res.json(clientesComEstatisticas);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ error: 'Erro ao listar clientes' });
  }
}

/**
 * Buscar cliente por ID
 */
export async function buscarCliente(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { barbeariaId } = req;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    // Verificar se o cliente tem agendamentos na barbearia
    const temAgendamento = await prisma.agendamento.findFirst({
      where: {
        clienteId: id,
        barbeariaId,
      },
    });

    if (!temAgendamento) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        agendamentos: {
          where: { barbeariaId },
          include: {
            servico: true,
            pagamento: true,
          },
          orderBy: { data: 'desc' },
        },
        avaliacoes: {
          where: {
            agendamento: {
              barbeariaId,
            },
          },
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

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
}

/**
 * Criar novo cliente
 */
export async function criarCliente(req: AuthRequest, res: Response) {
  try {
    const { nome, email, telefone, foto, dataNascimento } = req.body;

    // Validação de campos obrigatórios
    if (!nome || nome.trim() === '') {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    // Email é opcional, mas se fornecido deve ser válido e único
    let emailFinal: string | null = null;
    
    if (email && email.trim() !== '') {
      // Validar formato de email básico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Formato de email inválido' });
      }

      emailFinal = email.trim().toLowerCase();

      // Verificar se já existe cliente com esse email no banco de dados
      console.log('🔍 Verificando se email existe:', emailFinal);
      const clienteExistente = await prisma.cliente.findUnique({
        where: { email: emailFinal },
        select: { id: true, email: true, nome: true },
      });

      console.log('🔍 Resultado da busca:', clienteExistente ? `Encontrado: ${clienteExistente.nome}` : 'Não encontrado');

      if (clienteExistente) {
        return res.status(400).json({ 
          error: 'Este email já está cadastrado',
          detalhes: `O email ${emailFinal} já está associado a outro cliente`
        });
      }
    } else {
      // Gerar email temporário único se não fornecido
      emailFinal = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}@temp.com`;
      console.log('📧 Email não fornecido, gerando temporário:', emailFinal);
    }

    // Verificar se telefone já está em uso (se fornecido)
    if (telefone && telefone.trim() !== '') {
      const clienteExistentePorTelefone = await prisma.cliente.findFirst({
        where: {
          telefone: telefone.trim(),
        },
        select: { id: true, telefone: true, nome: true },
      });

      if (clienteExistentePorTelefone) {
        return res.status(400).json({ 
          error: 'Este telefone já está cadastrado',
          detalhes: `O telefone ${telefone} já está associado a outro cliente`
        });
      }
    }

    // Criar cliente
    console.log('✅ Criando cliente:', { nome, email: emailFinal, telefone });
    const cliente = await prisma.cliente.create({
      data: {
        nome: nome.trim(),
        email: emailFinal!,
        telefone: telefone?.trim() || null,
        foto: foto || null,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
        ativo: true,
        emailVerificado: false,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        foto: true,
        dataNascimento: true,
        ativo: true,
        createdAt: true,
      },
    });

    console.log('✅ Cliente criado com sucesso:', cliente.id);
    res.status(201).json(cliente);
  } catch (error: any) {
    console.error('❌ Erro ao criar cliente:', error);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Código do erro:', error.code);
    console.error('❌ Mensagem:', error.message);
    
    // Tratar erros específicos do Prisma
    if (error.code === 'P2002') {
      // Violação de constraint única
      const campo = error.meta?.target?.[0] || 'campo';
      return res.status(400).json({ 
        error: `Este ${campo} já está cadastrado`,
        detalhes: error.meta 
      });
    }
    
    if (error.code === 'P2003') {
      // Foreign key constraint
      return res.status(400).json({ 
        error: 'Erro de relacionamento no banco de dados',
        detalhes: error.meta 
      });
    }

    if (error.message?.includes('does not exist')) {
      return res.status(500).json({ 
        error: 'Tabelas não criadas no banco de dados. Execute as migrações: npm run prisma:push',
        detalhes: error.message 
      });
    }
    
    res.status(500).json({ 
      error: 'Erro ao criar cliente',
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Atualizar cliente
 */
export async function atualizarCliente(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { nome, email, telefone, foto, dataNascimento, ativo } = req.body;

    const cliente = await prisma.cliente.findUnique({
      where: { id },
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Se estiver mudando o email, verificar se não existe outro com o mesmo email
    if (email && email !== cliente.email) {
      const emailExistente = await prisma.cliente.findUnique({
        where: { email },
      });

      if (emailExistente) {
        return res.status(400).json({ error: 'Já existe um cliente com este email' });
      }
    }

    const clienteAtualizado = await prisma.cliente.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(email && { email }),
        ...(telefone !== undefined && { telefone: telefone || null }),
        ...(foto !== undefined && { foto: foto || null }),
        ...(dataNascimento && { dataNascimento: new Date(dataNascimento) }),
        ...(ativo !== undefined && { ativo }),
      },
    });

    res.json(clienteAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
}
