import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export interface AuthRequest extends Request {
  userId?: string;
  userType?: 'dono' | 'admin' | 'cliente';
  barbeariaId?: string;
}

/**
 * Middleware para autenticar usuário dono
 */
export async function autenticarDono(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    // Buscar usuário dono
    const dono = await prisma.usuarioDono.findUnique({
      where: { id: decoded.userId },
      include: { barbearia: true },
    });

    if (!dono || !dono.ativo) {
      return res.status(401).json({ error: 'Usuário inválido ou inativo' });
    }

    req.userId = dono.id;
    req.userType = 'dono';
    req.barbeariaId = dono.barbeariaId;
    
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(401).json({ error: 'Token inválido' });
  }
}
