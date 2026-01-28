import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Criar novo ticket de suporte (rota do cliente)
 */
export async function criarTicket(req: Request, res: Response) {
  try {
    console.log('🔧 [SUPORTE] Criar ticket chamado');
    console.log('🔧 [SUPORTE] Body recebido:', JSON.stringify(req.body, null, 2));

    const { categoria, assunto, mensagem, clienteNome, clienteEmail, clienteId } = req.body;

    // Validações
    if (!categoria) {
      console.error('❌ [SUPORTE] Categoria não informada');
      return res.status(400).json({ 
        error: 'Categoria é obrigatória',
        required: ['categoria']
      });
    }

    if (!mensagem || !mensagem.trim()) {
      console.error('❌ [SUPORTE] Mensagem não informada ou vazia');
      return res.status(400).json({ 
        error: 'Mensagem é obrigatória',
        required: ['mensagem']
      });
    }

    if (!clienteEmail || !clienteEmail.trim()) {
      console.error('❌ [SUPORTE] Email do cliente não informado');
      return res.status(400).json({ 
        error: 'Email do cliente é obrigatório',
        required: ['clienteEmail']
      });
    }

    // Validar se clienteId existe no banco (se fornecido)
    let clienteIdValido = null;
    if (clienteId) {
      try {
        const clienteExiste = await prisma.cliente.findUnique({
          where: { id: clienteId },
          select: { id: true },
        });
        if (clienteExiste) {
          clienteIdValido = clienteId;
        } else {
          console.warn('⚠️ [SUPORTE] ClienteId fornecido não existe no banco:', clienteId);
        }
      } catch (err) {
        console.warn('⚠️ [SUPORTE] Erro ao verificar clienteId:', err);
      }
    }

    const ticket = await prisma.ticketSuporte.create({
      data: {
        categoria,
        assunto: assunto || `Dúvida sobre ${categoria}`,
        mensagem: mensagem.trim(),
        clienteNome: clienteNome || 'Cliente não identificado',
        clienteEmail: clienteEmail.trim(),
        clienteId: clienteIdValido,
        prioridade: 'media',
        status: 'aberto',
      },
    });

    console.log('✅ [SUPORTE] Ticket criado com sucesso:', ticket.id);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Ticket criado com sucesso. Nossa equipe entrará em contato em breve.',
      ticketId: ticket.id,
    });
  } catch (error: any) {
    console.error('❌ [SUPORTE] Erro ao criar ticket:', error);
    console.error('❌ [SUPORTE] Stack:', error?.stack);
    console.error('❌ [SUPORTE] Message:', error?.message);
    console.error('❌ [SUPORTE] Code:', error?.code);
    console.error('❌ [SUPORTE] Meta:', error?.meta);
    
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Erro ao criar ticket: ${error?.message || 'Erro desconhecido'}`
      : 'Erro ao criar ticket de suporte';
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
}

/**
 * Listar todos os tickets (rota admin)
 */
export async function listarTickets(req: Request, res: Response) {
  try {
    const { status, prioridade } = req.query;

    const where: any = {};
    
    if (status && typeof status === 'string') {
      where.status = status;
    }
    
    if (prioridade && typeof prioridade === 'string') {
      where.prioridade = prioridade;
    }

    const tickets = await prisma.ticketSuporte.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // Abertos primeiro
        { createdAt: 'desc' },
      ],
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
      },
    });

    res.json(tickets);
  } catch (error) {
    console.error('❌ [SUPORTE] Erro ao listar tickets:', error);
    res.status(500).json({ error: 'Erro ao listar tickets' });
  }
}

/**
 * Buscar ticket por ID (rota admin)
 */
export async function buscarTicket(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticketSuporte.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('❌ [SUPORTE] Erro ao buscar ticket:', error);
    res.status(500).json({ error: 'Erro ao buscar ticket' });
  }
}

/**
 * Atualizar status do ticket (rota admin)
 */
export async function atualizarStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, prioridade } = req.body;

    const data: any = {};
    
    if (status) {
      data.status = status;
      if (status === 'resolvido' || status === 'fechado') {
        data.resolvidoEm = new Date();
      }
    }
    
    if (prioridade) {
      data.prioridade = prioridade;
    }

    const ticket = await prisma.ticketSuporte.update({
      where: { id },
      data,
    });

    console.log('✅ [SUPORTE] Ticket atualizado:', id, data);

    res.json(ticket);
  } catch (error) {
    console.error('❌ [SUPORTE] Erro ao atualizar ticket:', error);
    res.status(500).json({ error: 'Erro ao atualizar ticket' });
  }
}

/**
 * Responder ticket (rota admin)
 */
export async function responderTicket(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { resposta, respondidoPor } = req.body;

    if (!resposta) {
      return res.status(400).json({ error: 'Resposta é obrigatória' });
    }

    const ticket = await prisma.ticketSuporte.update({
      where: { id },
      data: {
        resposta,
        respondidoPor: respondidoPor || 'Admin',
        respondidoEm: new Date(),
        status: 'em_andamento', // Muda para em_andamento ao responder
      },
    });

    console.log('✅ [SUPORTE] Ticket respondido:', id);

    // TODO: Enviar email/WhatsApp para o cliente com a resposta
    // Por enquanto, apenas retornamos o ticket atualizado

    res.json({
      sucesso: true,
      mensagem: 'Resposta enviada com sucesso',
      ticket,
    });
  } catch (error) {
    console.error('❌ [SUPORTE] Erro ao responder ticket:', error);
    res.status(500).json({ error: 'Erro ao responder ticket' });
  }
}

/**
 * Estatísticas de tickets (rota admin)
 */
export async function estatisticasTickets(req: Request, res: Response) {
  try {
    const [total, abertos, emAndamento, resolvidos] = await Promise.all([
      prisma.ticketSuporte.count(),
      prisma.ticketSuporte.count({ where: { status: 'aberto' } }),
      prisma.ticketSuporte.count({ where: { status: 'em_andamento' } }),
      prisma.ticketSuporte.count({ where: { status: 'resolvido' } }),
    ]);

    res.json({
      total,
      abertos,
      emAndamento,
      resolvidos,
    });
  } catch (error) {
    console.error('❌ [SUPORTE] Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
}
