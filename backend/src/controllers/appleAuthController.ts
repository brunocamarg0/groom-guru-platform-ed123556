import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { gerarTokenJWT } from '../utils/token';

/**
 * Callback do OAuth Apple para Cliente
 */
export async function appleCallbackCliente(req: Request, res: Response) {
  try {
    const profile: any = req.user;

    if (!profile || !profile.appleId || !profile.email) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=apple_auth_failed`);
    }

    const { appleId, nome, email, foto } = profile;

    // Buscar ou criar cliente
    let cliente = await prisma.cliente.findFirst({
      where: {
        OR: [
          { appleId },
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
          appleId,
          foto,
          emailVerificado: true,
          ativo: true,
        },
      });
    } else if (!cliente.appleId) {
      // Atualizar cliente existente com Apple ID
      cliente = await prisma.cliente.update({
        where: { id: cliente.id },
        data: {
          appleId,
          foto: foto || cliente.foto,
          emailVerificado: true,
        },
      });
    } else if (cliente.appleId !== appleId) {
      // Email já existe mas com outro Apple ID
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
    console.error('Erro no callback Apple Cliente:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=apple_auth_error`);
  }
}

/**
 * Callback do OAuth Apple para Dono
 */
export async function appleCallbackDono(req: Request, res: Response) {
  try {
    const profile: any = req.user;
    const barbeariaId = (req.session as any)?.barbeariaId;

    if (!profile || !profile.appleId || !profile.email) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=apple_auth_failed`);
    }

    if (!barbeariaId || typeof barbeariaId !== 'string') {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=missing_barbearia_id`);
    }

    const { appleId, nome, email, foto } = profile;

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
          { appleId },
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
          appleId,
          foto,
          barbeariaId,
          emailVerificado: true,
          ativo: true,
        },
      });
    } else if (dono.barbeariaId !== barbeariaId) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=email_already_used`);
    } else if (!dono.appleId) {
      // Atualizar dono existente com Apple ID
      dono = await prisma.usuarioDono.update({
        where: { id: dono.id },
        data: {
          appleId,
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
    console.error('Erro no callback Apple Dono:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=apple_auth_error`);
  }
}

