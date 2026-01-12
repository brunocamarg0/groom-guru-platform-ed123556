import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Listar serviços da barbearia do dono
 */
export async function listarServicos(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const servicos = await prisma.servico.findMany({
      where: { barbeariaId },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    });

    res.json(servicos);
  } catch (error) {
    console.error('Erro ao listar serviços:', error);
    res.status(500).json({ error: 'Erro ao listar serviços' });
  }
}

/**
 * Criar novo serviço
 */
export async function criarServico(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { nome, descricao, preco, duracao, tipo, ordem, ativo } = req.body;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    if (!nome || !preco || !duracao) {
      return res.status(400).json({ error: 'Nome, preço e duração são obrigatórios' });
    }

    const servico = await prisma.servico.create({
      data: {
        nome,
        descricao: descricao || null,
        preco: parseFloat(preco),
        duracao: parseInt(duracao),
        tipo: tipo || null,
        ordem: ordem || 0,
        ativo: ativo !== undefined ? ativo : true,
        barbeariaId,
      },
    });

    res.status(201).json(servico);
  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    res.status(500).json({ error: 'Erro ao criar serviço' });
  }
}

/**
 * Atualizar serviço
 */
export async function atualizarServico(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { barbeariaId } = req;
    const { nome, descricao, preco, duracao, tipo, ordem, ativo } = req.body;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    // Verificar se o serviço pertence à barbearia
    const servicoExistente = await prisma.servico.findFirst({
      where: { id, barbeariaId },
    });

    if (!servicoExistente) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    const servico = await prisma.servico.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(descricao !== undefined && { descricao: descricao || null }),
        ...(preco !== undefined && { preco: parseFloat(preco) }),
        ...(duracao !== undefined && { duracao: parseInt(duracao) }),
        ...(tipo !== undefined && { tipo: tipo || null }),
        ...(ordem !== undefined && { ordem: parseInt(ordem) }),
        ...(ativo !== undefined && { ativo }),
      },
    });

    res.json(servico);
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    res.status(500).json({ error: 'Erro ao atualizar serviço' });
  }
}

/**
 * Remover serviço
 */
export async function removerServico(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { barbeariaId } = req;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    // Verificar se o serviço pertence à barbearia
    const servico = await prisma.servico.findFirst({
      where: { id, barbeariaId },
    });

    if (!servico) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    // Verificar se há agendamentos com este serviço
    const agendamentosComServico = await prisma.agendamento.findFirst({
      where: {
        servicoId: id,
        status: { in: ['pendente', 'confirmado'] },
      },
    });

    if (agendamentosComServico) {
      return res.status(400).json({
        error: 'Não é possível remover um serviço que possui agendamentos pendentes ou confirmados',
      });
    }

    await prisma.servico.delete({
      where: { id },
    });

    res.json({ sucesso: true, mensagem: 'Serviço removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover serviço:', error);
    res.status(500).json({ error: 'Erro ao remover serviço' });
  }
}

/**
 * Toggle ativo/inativo do serviço
 */
export async function toggleAtivoServico(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { barbeariaId } = req;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const servico = await prisma.servico.findFirst({
      where: { id, barbeariaId },
    });

    if (!servico) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    const servicoAtualizado = await prisma.servico.update({
      where: { id },
      data: { ativo: !servico.ativo },
    });

    res.json(servicoAtualizado);
  } catch (error) {
    console.error('Erro ao alterar status do serviço:', error);
    res.status(500).json({ error: 'Erro ao alterar status do serviço' });
  }
}
