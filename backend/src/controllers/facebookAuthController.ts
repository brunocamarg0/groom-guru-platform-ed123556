import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { gerarTokenJWT } from '../utils/token';

/**
 * Callback do OAuth Facebook para Cliente
 */
export async function facebookCallbackCliente(req: Request, res: Response) {
  try {
    const profile: any = req.user;

    if (!profile || !profile.facebookId || !profile.email) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=facebook_auth_failed`);
    }

    const { facebookId, nome, email, foto } = profile;

    // Buscar ou criar cliente
    let cliente = await prisma.cliente.findFirst({
      where: {
        OR: [
          { facebookId },
          { email },
        ],
      },
    });

    if (!cliente) {
      // Criar novo cliente
      cliente = await prisma.cliente.create({
        data: {
          nome,
          email,
          facebookId,
          foto,
          emailVerificado: true,
          ativo: true,
        },
      });
    } else if (!cliente.facebookId) {
      // Atualizar cliente existente com Facebook ID
      cliente = await prisma.cliente.update({
        where: { id: cliente.id },
        data: {
          facebookId,
          foto: foto || cliente.foto,
          emailVerificado: true,
        },
      });
    } else if (cliente.facebookId !== facebookId) {
      // Email já existe mas com outro Facebook ID
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=email_already_exists`);
    }

    // Gerar token JWT
    const token = gerarTokenJWT({
      id: cliente.id,
      email: cliente.email,
      tipo: 'cliente',
    });

    // Redirecionar para frontend com token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&type=cliente`);
  } catch (error) {
    console.error('Erro no callback Facebook Cliente:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=facebook_auth_error`);
  }
}

/**
 * Callback do OAuth Facebook para Dono
 */
export async function facebookCallbackDono(req: Request, res: Response) {
  try {
    const profile: any = req.user;
    const barbeariaId = (req.session as any)?.barbeariaId;

    if (!profile || !profile.facebookId || !profile.email) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=facebook_auth_failed`);
    }

    if (!barbeariaId || typeof barbeariaId !== 'string') {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=missing_barbearia_id`);
    }

    const { facebookId, nome, email, foto } = profile;

    // Verificar se barbearia existe e não tem dono
    const barbearia = await prisma.barbearia.findUnique({
      where: { id: barbeariaId },
      include: { dono: true },
    });

    if (!barbearia) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=barbearia_not_found`);
    }

    if (barbearia.dono && barbearia.dono.id) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=barbearia_has_owner`);
    }

    // Buscar ou criar dono
    let dono = await prisma.usuarioDono.findFirst({
      where: {
        OR: [
          { facebookId },
          { email },
        ],
      },
    });

    if (!dono) {
      // Criar novo dono
      dono = await prisma.usuarioDono.create({
        data: {
          nome,
          email,
          facebookId,
          foto,
          barbeariaId,
          emailVerificado: true,
          ativo: true,
        },
      });
    } else if (dono.barbeariaId !== barbeariaId) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=email_already_used`);
    } else if (!dono.facebookId) {
      // Atualizar dono existente com Facebook ID
      dono = await prisma.usuarioDono.update({
        where: { id: dono.id },
        data: {
          facebookId,
          foto: foto || dono.foto,
          emailVerificado: true,
        },
      });
    }

    // Gerar token JWT
    const token = gerarTokenJWT({
      id: dono.id,
      email: dono.email,
      tipo: 'dono',
    });

    // Redirecionar para frontend com token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&type=dono`);
  } catch (error) {
    console.error('Erro no callback Facebook Dono:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=facebook_auth_error`);
  }
}

