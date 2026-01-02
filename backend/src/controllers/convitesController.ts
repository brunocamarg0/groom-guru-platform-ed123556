import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { gerarTokenConvite } from '../utils/token';

/**
 * Gerar convite para barbearia
 */
export async function gerarConvite(req: Request, res: Response) {
  try {
    const { barbeariaId } = req.params;
    const { email, diasValidade = 7 } = req.body;

    // Verificar se barbearia existe
    const barbearia = await prisma.barbearia.findUnique({
      where: { id: barbeariaId },
      include: {
        dono: true,
      },
    });

    if (!barbearia) {
      return res.status(404).json({ error: 'Barbearia não encontrada' });
    }

    // Verificar se já tem dono
    if (barbearia.dono) {
      return res.status(400).json({ error: 'Esta barbearia já possui um dono cadastrado' });
    }

    // Gerar token e data de expiração
    const token = gerarTokenConvite();
    const expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + diasValidade);

    // Criar convite
    const convite = await prisma.convite.create({
      data: {
        token,
        email,
        expiraEm,
        barbeariaId,
      },
    });

    // URL de ativação (será usado no frontend)
    const urlAtivacao = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/ativar-conta?token=${token}`;

    res.status(201).json({
      convite: {
        id: convite.id,
        token: convite.token,
        expiraEm: convite.expiraEm,
        urlAtivacao,
      },
      barbearia: {
        id: barbearia.id,
        nome: barbearia.nome,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar convite:', error);
    res.status(500).json({ error: 'Erro ao gerar convite' });
  }
}

/**
 * Validar token de convite
 */
export async function validarToken(req: Request, res: Response) {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token é obrigatório' });
    }

    const convite = await prisma.convite.findUnique({
      where: { token },
      include: {
        barbearia: {
          select: {
            id: true,
            nome: true,
            cnpjCpf: true,
            responsavel: true,
            plano: true,
          },
        },
      },
    });

    if (!convite) {
      return res.status(404).json({ error: 'Convite não encontrado' });
    }

    if (convite.usado) {
      return res.status(400).json({ error: 'Este convite já foi utilizado' });
    }

    if (new Date() > convite.expiraEm) {
      return res.status(400).json({ error: 'Este convite expirou' });
    }

    // Verificar se barbearia já tem dono
    const barbearia = await prisma.barbearia.findUnique({
      where: { id: convite.barbeariaId },
      include: { dono: true },
    });

    if (barbearia?.dono) {
      return res.status(400).json({ error: 'Esta barbearia já possui um dono cadastrado' });
    }

    res.json({
      valido: true,
      convite: {
        id: convite.id,
        expiraEm: convite.expiraEm,
      },
      barbearia: convite.barbearia,
    });
  } catch (error) {
    console.error('Erro ao validar token:', error);
    res.status(500).json({ error: 'Erro ao validar token' });
  }
}

/**
 * Ativar conta do dono (criar usuário)
 */
export async function ativarConta(req: Request, res: Response) {
  try {
    const { token, nome, email, senha } = req.body;

    if (!token || !nome || !email || !senha) {
      return res.status(400).json({ error: 'Campos obrigatórios: token, nome, email, senha' });
    }

    // Validar token
    const convite = await prisma.convite.findUnique({
      where: { token },
      include: {
        barbearia: {
          include: { dono: true },
        },
      },
    });

    if (!convite) {
      return res.status(404).json({ error: 'Convite não encontrado' });
    }

    if (convite.usado) {
      return res.status(400).json({ error: 'Este convite já foi utilizado' });
    }

    if (new Date() > convite.expiraEm) {
      return res.status(400).json({ error: 'Este convite expirou' });
    }

    if (convite.barbearia.dono) {
      return res.status(400).json({ error: 'Esta barbearia já possui um dono cadastrado' });
    }

    // Verificar se email já está em uso
    const emailExistente = await prisma.usuarioDono.findUnique({
      where: { email },
    });

    if (emailExistente) {
      return res.status(400).json({ error: 'Este email já está em uso' });
    }

    // Hash da senha
    const { hashSenha } = await import('../utils/password');
    const senhaHash = await hashSenha(senha);

    // Criar usuário dono e marcar convite como usado (transação)
    const resultado = await prisma.$transaction(async (tx) => {
      // Criar usuário dono
      const dono = await tx.usuarioDono.create({
        data: {
          nome,
          email,
          senha: senhaHash,
          barbeariaId: convite.barbeariaId,
          emailVerificado: false, // Pode implementar verificação de email depois
        },
      });

      // Marcar convite como usado
      await tx.convite.update({
        where: { id: convite.id },
        data: {
          usado: true,
          usadoEm: new Date(),
        },
      });

      return dono;
    });

    res.status(201).json({
      sucesso: true,
      mensagem: 'Conta ativada com sucesso!',
      usuario: {
        id: resultado.id,
        nome: resultado.nome,
        email: resultado.email,
      },
      barbearia: {
        id: convite.barbearia.id,
        nome: convite.barbearia.nome,
      },
    });
  } catch (error) {
    console.error('Erro ao ativar conta:', error);
    res.status(500).json({ error: 'Erro ao ativar conta' });
  }
}

/**
 * Listar convites de uma barbearia
 */
export async function listarConvites(req: Request, res: Response) {
  try {
    const { barbeariaId } = req.params;

    const convites = await prisma.convite.findMany({
      where: { barbeariaId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(convites);
  } catch (error) {
    console.error('Erro ao listar convites:', error);
    res.status(500).json({ error: 'Erro ao listar convites' });
  }
}

