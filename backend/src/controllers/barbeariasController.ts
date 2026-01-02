import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { calcularDataVencimento } from '../utils/token';

/**
 * Listar todas as barbearias
 */
export async function listarBarbearias(req: Request, res: Response) {
  try {
    const barbearias = await prisma.barbearia.findMany({
      include: {
        dono: {
          select: {
            id: true,
            nome: true,
            email: true,
            ativo: true,
          },
        },
        convites: {
          where: {
            usado: false,
            expiraEm: {
              gt: new Date(),
            },
          },
          select: {
            id: true,
            token: true,
            expiraEm: true,
          },
        },
        _count: {
          select: {
            servicos: true,
            agendamentos: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(barbearias);
  } catch (error) {
    console.error('Erro ao listar barbearias:', error);
    res.status(500).json({ error: 'Erro ao listar barbearias' });
  }
}

/**
 * Buscar barbearia por ID
 */
export async function buscarBarbearia(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const barbearia = await prisma.barbearia.findUnique({
      where: { id },
      include: {
        dono: {
          select: {
            id: true,
            nome: true,
            email: true,
            ativo: true,
            emailVerificado: true,
          },
        },
        servicos: {
          orderBy: {
            ordem: 'asc',
          },
        },
        convites: {
          where: {
            usado: false,
            expiraEm: {
              gt: new Date(),
            },
          },
        },
      },
    });

    if (!barbearia) {
      return res.status(404).json({ error: 'Barbearia não encontrada' });
    }

    res.json(barbearia);
  } catch (error) {
    console.error('Erro ao buscar barbearia:', error);
    res.status(500).json({ error: 'Erro ao buscar barbearia' });
  }
}

/**
 * Criar nova barbearia (sem dono ainda)
 */
export async function criarBarbearia(req: Request, res: Response) {
  try {
    const { nome, cnpjCpf, responsavel, plano, email, telefone, endereco } = req.body;

    // Validações básicas
    if (!nome || !cnpjCpf || !responsavel || !plano) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, cnpjCpf, responsavel, plano' });
    }

    const dataVencimento = calcularDataVencimento(plano);

    const barbearia = await prisma.barbearia.create({
      data: {
        nome,
        cnpjCpf,
        responsavel,
        plano,
        email,
        telefone,
        endereco,
        dataVencimento,
        status: 'em_teste',
      },
    });

    res.status(201).json(barbearia);
  } catch (error) {
    console.error('Erro ao criar barbearia:', error);
    res.status(500).json({ error: 'Erro ao criar barbearia' });
  }
}

/**
 * Atualizar barbearia
 */
export async function atualizarBarbearia(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { nome, cnpjCpf, responsavel, plano, email, telefone, endereco, status } = req.body;

    const barbearia = await prisma.barbearia.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(cnpjCpf && { cnpjCpf }),
        ...(responsavel && { responsavel }),
        ...(plano && { plano }),
        ...(email !== undefined && { email }),
        ...(telefone !== undefined && { telefone }),
        ...(endereco !== undefined && { endereco }),
        ...(status && { status }),
      },
    });

    res.json(barbearia);
  } catch (error) {
    console.error('Erro ao atualizar barbearia:', error);
    res.status(500).json({ error: 'Erro ao atualizar barbearia' });
  }
}

/**
 * Alterar status da barbearia
 */
export async function alterarStatusBarbearia(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ativa', 'em_teste', 'bloqueada', 'cancelada'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const barbearia = await prisma.barbearia.update({
      where: { id },
      data: { status },
    });

    res.json(barbearia);
  } catch (error) {
    console.error('Erro ao alterar status:', error);
    res.status(500).json({ error: 'Erro ao alterar status' });
  }
}

/**
 * Deletar barbearia
 */
export async function deletarBarbearia(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.barbearia.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar barbearia:', error);
    res.status(500).json({ error: 'Erro ao deletar barbearia' });
  }
}

