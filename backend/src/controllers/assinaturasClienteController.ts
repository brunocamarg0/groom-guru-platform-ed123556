import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * GET /api/dono/assinaturas-cliente
 * Listar assinaturas de clientes da barbearia (dono)
 */
export async function listarAssinaturasCliente(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { status, profissionalId } = req.query;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const where: any = {
      plano: {
        barbeariaId,
      },
    };

    if (status && typeof status === 'string') {
      where.status = status;
    }

    if (profissionalId && typeof profissionalId === 'string') {
      where.profissionalId = profissionalId;
    }

    const assinaturas = await prisma.assinaturaCliente.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
        plano: true,
        profissional: {
          select: {
            id: true,
            nome: true,
            comissaoAssinatura: true,
          },
        },
        _count: {
          select: {
            pagamentos: true,
            comissoes: true,
          },
        },
      },
      orderBy: {
        dataVencimento: 'asc',
      },
    });

    res.json(assinaturas);
  } catch (error: any) {
    console.error('Erro ao listar assinaturas de clientes:', error);
    res.status(500).json({ error: 'Erro ao listar assinaturas de clientes' });
  }
}

/**
 * GET /api/dono/assinaturas-cliente/:id
 * Buscar assinatura específica
 */
export async function buscarAssinaturaCliente(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { id } = req.params;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const assinatura = await prisma.assinaturaCliente.findFirst({
      where: {
        id,
        plano: {
          barbeariaId,
        },
      },
      include: {
        cliente: true,
        plano: true,
        profissional: {
          select: {
            id: true,
            nome: true,
            comissaoAssinatura: true,
          },
        },
        pagamentos: {
          orderBy: {
            dataVencimento: 'desc',
          },
        },
        comissoes: {
          orderBy: {
            createdAt: 'desc',
          },
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
    });

    if (!assinatura) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    res.json(assinatura);
  } catch (error: any) {
    console.error('Erro ao buscar assinatura de cliente:', error);
    res.status(500).json({ error: 'Erro ao buscar assinatura de cliente' });
  }
}

/**
 * POST /api/dono/assinaturas-cliente
 * Criar nova assinatura de cliente
 */
export async function criarAssinaturaCliente(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { clienteId, planoId, profissionalId } = req.body;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    if (!clienteId || !planoId) {
      return res.status(400).json({ 
        error: 'clienteId e planoId são obrigatórios' 
      });
    }

    // Verificar se o plano pertence à barbearia
    const plano = await prisma.planoCliente.findFirst({
      where: {
        id: planoId,
        barbeariaId,
      },
    });

    if (!plano) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    // Verificar se o cliente já tem assinatura ativa
    const assinaturaExistente = await prisma.assinaturaCliente.findUnique({
      where: { clienteId },
    });

    if (assinaturaExistente && assinaturaExistente.status === 'ativa') {
      return res.status(400).json({ 
        error: 'Cliente já possui assinatura ativa' 
      });
    }

    // Verificar se profissional pertence à barbearia (se fornecido)
    if (profissionalId) {
      const profissional = await prisma.profissional.findFirst({
        where: {
          id: profissionalId,
          barbeariaId,
        },
      });

      if (!profissional) {
        return res.status(404).json({ error: 'Profissional não encontrado' });
      }
    }

    // Calcular datas
    const dataInicio = new Date();
    const dataVencimento = new Date();
    dataVencimento.setMonth(dataVencimento.getMonth() + plano.duracaoMeses);
    const proximoVencimento = new Date(dataVencimento);

    const assinatura = await prisma.assinaturaCliente.create({
      data: {
        clienteId,
        planoId,
        profissionalId: profissionalId || null,
        dataInicio,
        dataVencimento,
        proximoVencimento,
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        plano: true,
        profissional: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    res.status(201).json(assinatura);
  } catch (error: any) {
    console.error('Erro ao criar assinatura de cliente:', error);
    res.status(500).json({ error: 'Erro ao criar assinatura de cliente' });
  }
}

/**
 * PUT /api/dono/assinaturas-cliente/:id
 * Atualizar assinatura de cliente
 */
export async function atualizarAssinaturaCliente(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { id } = req.params;
    const { profissionalId, status } = req.body;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    // Verificar se a assinatura pertence à barbearia
    const assinaturaExistente = await prisma.assinaturaCliente.findFirst({
      where: {
        id,
        plano: {
          barbeariaId,
        },
      },
    });

    if (!assinaturaExistente) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    // Verificar profissional se fornecido
    if (profissionalId) {
      const profissional = await prisma.profissional.findFirst({
        where: {
          id: profissionalId,
          barbeariaId,
        },
      });

      if (!profissional) {
        return res.status(404).json({ error: 'Profissional não encontrado' });
      }
    }

    const data: any = {};
    if (profissionalId !== undefined) {
      data.profissionalId = profissionalId || null;
    }
    if (status) {
      data.status = status;
    }

    const assinatura = await prisma.assinaturaCliente.update({
      where: { id },
      data,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        plano: true,
        profissional: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    res.json(assinatura);
  } catch (error: any) {
    console.error('Erro ao atualizar assinatura de cliente:', error);
    res.status(500).json({ error: 'Erro ao atualizar assinatura de cliente' });
  }
}

/**
 * POST /api/dono/assinaturas-cliente/:id/cancelar
 * Cancelar assinatura de cliente
 */
export async function cancelarAssinaturaCliente(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { id } = req.params;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    const assinatura = await prisma.assinaturaCliente.findFirst({
      where: {
        id,
        plano: {
          barbeariaId,
        },
      },
    });

    if (!assinatura) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    const assinaturaAtualizada = await prisma.assinaturaCliente.update({
      where: { id },
      data: {
        status: 'cancelada',
      },
    });

    res.json(assinaturaAtualizada);
  } catch (error: any) {
    console.error('Erro ao cancelar assinatura de cliente:', error);
    res.status(500).json({ error: 'Erro ao cancelar assinatura de cliente' });
  }
}

