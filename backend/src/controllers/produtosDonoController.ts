import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Listar produtos da barbearia do dono
 */
export async function listarProdutos(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { ativo, categoria, estoqueBaixo } = req.query;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const where: any = {
      barbeariaId,
    };

    if (ativo !== undefined) {
      where.ativo = ativo === 'true';
    }

    if (categoria && typeof categoria === 'string') {
      where.categoria = categoria;
    }

    if (estoqueBaixo === 'true') {
      where.estoque = {
        lte: prisma.produto.fields.estoqueMinimo,
      };
    }

    const produtos = await prisma.produto.findMany({
      where,
      orderBy: { nome: 'asc' },
    });

    res.json(produtos);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
}

/**
 * Criar novo produto
 */
export async function criarProduto(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { nome, descricao, categoria, preco, estoque, estoqueMinimo, ativo, foto } = req.body;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    if (!nome || !categoria || !preco) {
      return res.status(400).json({ error: 'Nome, categoria e preço são obrigatórios' });
    }

    const produto = await prisma.produto.create({
      data: {
        nome,
        descricao: descricao || null,
        categoria,
        preco: parseFloat(preco),
        estoque: estoque ? parseInt(estoque) : 0,
        estoqueMinimo: estoqueMinimo ? parseInt(estoqueMinimo) : 0,
        ativo: ativo !== undefined ? ativo : true,
        foto: foto || null,
        barbeariaId,
      },
    });

    res.status(201).json(produto);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
}

/**
 * Atualizar produto
 */
export async function atualizarProduto(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { barbeariaId } = req;
    const { nome, descricao, categoria, preco, estoque, estoqueMinimo, ativo, foto } = req.body;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    // Verificar se o produto pertence à barbearia
    const produtoExistente = await prisma.produto.findFirst({
      where: { id, barbeariaId },
    });

    if (!produtoExistente) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const produto = await prisma.produto.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(descricao !== undefined && { descricao: descricao || null }),
        ...(categoria && { categoria }),
        ...(preco !== undefined && { preco: parseFloat(preco) }),
        ...(estoque !== undefined && { estoque: parseInt(estoque) }),
        ...(estoqueMinimo !== undefined && { estoqueMinimo: parseInt(estoqueMinimo) }),
        ...(ativo !== undefined && { ativo }),
        ...(foto !== undefined && { foto: foto || null }),
      },
    });

    res.json(produto);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
}

/**
 * Remover produto
 */
export async function removerProduto(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { barbeariaId } = req;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    // Verificar se o produto pertence à barbearia
    const produto = await prisma.produto.findFirst({
      where: { id, barbeariaId },
    });

    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    await prisma.produto.delete({
      where: { id },
    });

    res.json({ sucesso: true, mensagem: 'Produto removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover produto:', error);
    res.status(500).json({ error: 'Erro ao remover produto' });
  }
}

/**
 * Atualizar estoque do produto
 */
export async function atualizarEstoque(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { barbeariaId } = req;
    const { quantidade } = req.body;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    if (quantidade === undefined || quantidade === null) {
      return res.status(400).json({ error: 'Quantidade é obrigatória' });
    }

    // Verificar se o produto pertence à barbearia
    const produto = await prisma.produto.findFirst({
      where: { id, barbeariaId },
    });

    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const produtoAtualizado = await prisma.produto.update({
      where: { id },
      data: { estoque: parseInt(quantidade) },
    });

    res.json(produtoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    res.status(500).json({ error: 'Erro ao atualizar estoque' });
  }
}

