import { Request, Response } from 'express';
import prisma from '../lib/prisma';

interface AuthRequest extends Request {
  userId?: string;
  userType?: string;
  barbeariaId?: string;
}

/**
 * GET /api/admin/assinaturas
 * Listar todas as assinaturas (admin)
 */
export async function listarAssinaturas(req: Request, res: Response) {
  try {
    const assinaturas = await prisma.assinatura.findMany({
      include: {
        barbearia: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
        plano: true,
        faturas: {
          orderBy: {
            dataVencimento: 'desc',
          },
          take: 5, // Últimas 5 faturas
        },
      },
      orderBy: {
        dataVencimento: 'asc',
      },
    });

    res.json(assinaturas);
  } catch (error: any) {
    console.error('Erro ao listar assinaturas:', error);
    res.status(500).json({ error: 'Erro ao listar assinaturas' });
  }
}

/**
 * GET /api/admin/assinaturas/:id
 * Buscar assinatura específica
 */
export async function buscarAssinatura(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const assinatura = await prisma.assinatura.findUnique({
      where: { id },
      include: {
        barbearia: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            responsavel: true,
          },
        },
        plano: true,
        faturas: {
          orderBy: {
            dataVencimento: 'desc',
          },
        },
      },
    });

    if (!assinatura) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    res.json(assinatura);
  } catch (error: any) {
    console.error('Erro ao buscar assinatura:', error);
    res.status(500).json({ error: 'Erro ao buscar assinatura' });
  }
}

/**
 * POST /api/admin/assinaturas
 * Criar nova assinatura (admin)
 */
export async function criarAssinatura(req: Request, res: Response) {
  try {
    const { barbeariaId, planoId, dataInicio } = req.body;

    if (!barbeariaId || !planoId) {
      return res.status(400).json({ error: 'barbeariaId e planoId são obrigatórios' });
    }

    // Verificar se barbearia existe
    const barbearia = await prisma.barbearia.findUnique({
      where: { id: barbeariaId },
    });

    if (!barbearia) {
      return res.status(404).json({ error: 'Barbearia não encontrada' });
    }

    // Verificar se plano existe
    const plano = await prisma.plano.findUnique({
      where: { id: planoId },
    });

    if (!plano) {
      return res.status(404).json({ error: 'Plano não encontrada' });
    }

    // Verificar se já existe assinatura ativa
    const assinaturaExistente = await prisma.assinatura.findUnique({
      where: { barbeariaId },
    });

    if (assinaturaExistente && assinaturaExistente.status === 'ativa') {
      return res.status(400).json({ error: 'Barbearia já possui assinatura ativa' });
    }

    // Calcular data de vencimento (30 dias a partir de hoje ou dataInicio)
    const inicio = dataInicio ? new Date(dataInicio) : new Date();
    const vencimento = new Date(inicio);
    vencimento.setMonth(vencimento.getMonth() + 1);

    // Criar assinatura
    const assinatura = await prisma.assinatura.create({
      data: {
        barbeariaId,
        planoId,
        status: 'ativa',
        dataInicio: inicio,
        dataVencimento: vencimento,
        proximoVencimento: vencimento,
      },
      include: {
        barbearia: true,
        plano: true,
      },
    });

    // Gerar primeira fatura
    const fatura = await prisma.fatura.create({
      data: {
        assinaturaId: assinatura.id,
        valor: plano.valorMensal,
        dataVencimento: vencimento,
        status: 'pendente',
      },
    });

    res.status(201).json({
      ...assinatura,
      primeiraFatura: fatura,
    });
  } catch (error: any) {
    console.error('Erro ao criar assinatura:', error);
    res.status(500).json({ error: 'Erro ao criar assinatura' });
  }
}

/**
 * PUT /api/admin/assinaturas/:id
 * Atualizar assinatura
 */
export async function atualizarAssinatura(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { planoId, status } = req.body;

    const assinatura = await prisma.assinatura.findUnique({
      where: { id },
    });

    if (!assinatura) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    const dadosAtualizacao: any = {};

    if (planoId) {
      const plano = await prisma.plano.findUnique({
        where: { id: planoId },
      });

      if (!plano) {
        return res.status(404).json({ error: 'Plano não encontrado' });
      }

      dadosAtualizacao.planoId = planoId;
      // Se mudou o plano, atualizar valor da próxima fatura
      if (assinatura.planoId !== planoId) {
        // Atualizar próxima fatura pendente
        await prisma.fatura.updateMany({
          where: {
            assinaturaId: id,
            status: 'pendente',
          },
          data: {
            valor: plano.valorMensal,
          },
        });
      }
    }

    if (status) {
      dadosAtualizacao.status = status;
    }

    const assinaturaAtualizada = await prisma.assinatura.update({
      where: { id },
      data: dadosAtualizacao,
      include: {
        barbearia: true,
        plano: true,
      },
    });

    res.json(assinaturaAtualizada);
  } catch (error: any) {
    console.error('Erro ao atualizar assinatura:', error);
    res.status(500).json({ error: 'Erro ao atualizar assinatura' });
  }
}

/**
 * DELETE /api/admin/assinaturas/:id
 * Cancelar assinatura
 */
export async function cancelarAssinatura(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const assinatura = await prisma.assinatura.findUnique({
      where: { id },
    });

    if (!assinatura) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    // Cancelar assinatura
    await prisma.assinatura.update({
      where: { id },
      data: {
        status: 'cancelada',
      },
    });

    // Cancelar faturas pendentes
    await prisma.fatura.updateMany({
      where: {
        assinaturaId: id,
        status: 'pendente',
      },
      data: {
        status: 'cancelada',
      },
    });

    // Suspender barbearia
    await prisma.barbearia.update({
      where: { id: assinatura.barbeariaId },
      data: {
        status: 'bloqueada',
      },
    });

    res.json({ message: 'Assinatura cancelada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({ error: 'Erro ao cancelar assinatura' });
  }
}

/**
 * POST /api/admin/assinaturas/:id/gerar-fatura
 * Gerar fatura manualmente (admin)
 */
export async function gerarFatura(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { valor, dataVencimento } = req.body;

    const assinatura = await prisma.assinatura.findUnique({
      where: { id },
      include: {
        plano: true,
      },
    });

    if (!assinatura) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    const valorFatura = valor || assinatura.plano.valorMensal;
    const vencimento = dataVencimento ? new Date(dataVencimento) : new Date(assinatura.proximoVencimento);

    const fatura = await prisma.fatura.create({
      data: {
        assinaturaId: id,
        valor: valorFatura,
        dataVencimento: vencimento,
        status: 'pendente',
      },
    });

    res.status(201).json(fatura);
  } catch (error: any) {
    console.error('Erro ao gerar fatura:', error);
    res.status(500).json({ error: 'Erro ao gerar fatura' });
  }
}

/**
 * GET /api/admin/assinaturas/:id/faturas
 * Listar faturas de uma assinatura
 */
export async function listarFaturas(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const faturas = await prisma.fatura.findMany({
      where: { assinaturaId: id },
      orderBy: {
        dataVencimento: 'desc',
      },
    });

    res.json(faturas);
  } catch (error: any) {
    console.error('Erro ao listar faturas:', error);
    res.status(500).json({ error: 'Erro ao listar faturas' });
  }
}

