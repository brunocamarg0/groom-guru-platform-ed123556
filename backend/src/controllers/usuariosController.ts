import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { hashSenha } from '../utils/password';

/**
 * Criar usuário dono diretamente (sem convite)
 */
export async function criarUsuarioDono(req: Request, res: Response) {
  try {
    const { barbeariaId, nome, email, senha } = req.body;

    if (!barbeariaId || !nome || !email || !senha) {
      return res.status(400).json({ error: 'Campos obrigatórios: barbeariaId, nome, email, senha' });
    }

    // Verificar se barbearia existe
    const barbearia = await prisma.barbearia.findUnique({
      where: { id: barbeariaId },
      include: { dono: true },
    });

    if (!barbearia) {
      return res.status(404).json({ error: 'Barbearia não encontrada' });
    }

    // Verificar se já tem dono
    if (barbearia.dono) {
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
    const senhaHash = await hashSenha(senha);

    // Criar usuário dono
    const dono = await prisma.usuarioDono.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        barbeariaId,
        emailVerificado: false,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
        createdAt: true,
      },
    });

    // Enviar email de boas-vindas (não bloqueia o cadastro se falhar)
    try {
      const { enviarEmailBoasVindas } = await import('../services/emailService');
      await enviarEmailBoasVindas({
        email: dono.email,
        nomeBarbearia: barbearia.nome,
      });
      console.log('✅ [CRIAR USUARIO DONO] Email de boas-vindas enviado com sucesso');
    } catch (emailError: any) {
      // Não falhar o cadastro se o email não for enviado
      console.error('⚠️ [CRIAR USUARIO DONO] Erro ao enviar email de boas-vindas (não crítico):', emailError.message);
    }

    res.status(201).json({
      sucesso: true,
      mensagem: 'Usuário dono criado com sucesso!',
      usuario: dono,
    });
  } catch (error) {
    console.error('Erro ao criar usuário dono:', error);
    res.status(500).json({ error: 'Erro ao criar usuário dono' });
  }
}

/**
 * Buscar usuário dono de uma barbearia
 */
export async function buscarUsuarioDono(req: Request, res: Response) {
  try {
    const { barbeariaId } = req.params;

    const dono = await prisma.usuarioDono.findUnique({
      where: { barbeariaId },
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
        emailVerificado: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!dono) {
      return res.status(404).json({ error: 'Usuário dono não encontrado' });
    }

    res.json(dono);
  } catch (error) {
    console.error('Erro ao buscar usuário dono:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário dono' });
  }
}

/**
 * Atualizar usuário dono
 */
export async function atualizarUsuarioDono(req: Request, res: Response) {
  try {
    const { barbeariaId } = req.params;
    const { nome, email, senha, ativo } = req.body;

    // Verificar se usuário existe
    const donoExistente = await prisma.usuarioDono.findUnique({
      where: { barbeariaId },
    });

    if (!donoExistente) {
      return res.status(404).json({ error: 'Usuário dono não encontrado' });
    }

    // Se mudou email, verificar se não está em uso
    if (email && email !== donoExistente.email) {
      const emailExistente = await prisma.usuarioDono.findUnique({
        where: { email },
      });

      if (emailExistente) {
        return res.status(400).json({ error: 'Este email já está em uso' });
      }
    }

    // Preparar dados para atualização
    const dadosAtualizacao: any = {};
    if (nome) dadosAtualizacao.nome = nome;
    if (email) dadosAtualizacao.email = email;
    if (ativo !== undefined) dadosAtualizacao.ativo = ativo;
    if (senha) {
      dadosAtualizacao.senha = await hashSenha(senha);
    }

    const dono = await prisma.usuarioDono.update({
      where: { barbeariaId },
      data: dadosAtualizacao,
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
        emailVerificado: true,
      },
    });

    res.json(dono);
  } catch (error) {
    console.error('Erro ao atualizar usuário dono:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário dono' });
  }
}

/**
 * Deletar usuário dono
 */
export async function deletarUsuarioDono(req: Request, res: Response) {
  try {
    const { barbeariaId } = req.params;

    await prisma.usuarioDono.delete({
      where: { barbeariaId },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar usuário dono:', error);
    res.status(500).json({ error: 'Erro ao deletar usuário dono' });
  }
}





