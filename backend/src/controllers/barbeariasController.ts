import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { calcularDataVencimento, gerarTokenConvite } from '../utils/token';
import { enviarEmailConvite } from '../services/emailService';

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
 * Criar nova barbearia (sem dono ainda) e gerar convite automaticamente
 */
export async function criarBarbearia(req: Request, res: Response) {
  try {
    const { nome, cnpjCpf, responsavel, plano, email, telefone, endereco, cidade, bairro, cep, enviarEmail = true } = req.body;

    // Validações básicas
    if (!nome || !cnpjCpf || !responsavel || !plano) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, cnpjCpf, responsavel, plano' });
    }

    const dataVencimento = calcularDataVencimento(plano);

    // Criar barbearia e convite em uma transação
    const resultado = await prisma.$transaction(async (tx) => {
      // Criar barbearia
      const barbearia = await tx.barbearia.create({
        data: {
          nome,
          cnpjCpf,
          responsavel,
          plano,
          email,
          telefone,
          endereco,
          cidade,
          bairro,
          cep,
          dataVencimento,
          status: 'em_teste',
        },
      });

      // Gerar convite automaticamente
      const token = gerarTokenConvite();
      const expiraEm = new Date();
      expiraEm.setDate(expiraEm.getDate() + 7); // 7 dias de validade

      const convite = await tx.convite.create({
        data: {
          token,
          email: email || null, // Email da barbearia se fornecido
          expiraEm,
          barbeariaId: barbearia.id,
        },
      });

      return { barbearia, convite };
    });

    // Enviar email se solicitado e se tiver email
    let emailEnviado = false;
    let emailInfo = null;

    if (enviarEmail && email) {
      try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const linkAtivacao = `${frontendUrl}/ativar-conta?token=${resultado.convite.token}`;

        emailInfo = await enviarEmailConvite({
          email,
          nomeBarbearia: nome,
          nomeResponsavel: responsavel,
          linkAtivacao,
          expiraEm: resultado.convite.expiraEm,
        });

        emailEnviado = true;
      } catch (emailError) {
        console.error('Erro ao enviar email (barbearia criada mesmo assim):', emailError);
        // Não falha a criação se o email falhar
      }
    }

    res.status(201).json({
      ...resultado.barbearia,
      convite: {
        id: resultado.convite.id,
        token: resultado.convite.token,
        expiraEm: resultado.convite.expiraEm,
        linkAtivacao: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/ativar-conta?token=${resultado.convite.token}`,
      },
      emailEnviado,
      emailInfo,
    });
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

