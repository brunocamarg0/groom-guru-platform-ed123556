import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { obterJWTSecret } from '../utils/token';

export interface AuthRequestCliente extends Request {
  userId?: string;
  userType?: 'cliente';
}

/**
 * Middleware para autenticar usuário cliente
 */
export async function autenticarCliente(
  req: AuthRequestCliente,
  res: Response,
  next: NextFunction
) {
  try {
    console.log('🔐 autenticarCliente: Iniciando autenticação...');
    
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.error('❌ autenticarCliente: Token não fornecido');
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Usar função centralizada para obter o secret (garante consistência)
    const jwtSecret = obterJWTSecret();
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    const userId = decoded.id || decoded.userId;
    
    if (!userId) {
      console.error('❌ autenticarCliente: ID do usuário não encontrado no token');
      return res.status(401).json({ error: 'Token inválido: ID do usuário não encontrado' });
    }
    
    // Verificar se é cliente
    if (decoded.tipo !== 'cliente') {
      console.error('❌ autenticarCliente: Token não é de cliente');
      return res.status(401).json({ error: 'Token inválido: não é um cliente' });
    }
    
    // Buscar cliente
    const cliente = await prisma.cliente.findUnique({
      where: { id: userId },
    });

    if (!cliente) {
      console.error('❌ autenticarCliente: Cliente não encontrado no banco');
      return res.status(401).json({ error: 'Cliente não encontrado' });
    }

    if (!cliente.ativo) {
      console.error('❌ autenticarCliente: Cliente inativo');
      return res.status(401).json({ error: 'Cliente inativo' });
    }

    console.log('✅ autenticarCliente: Autenticação bem-sucedida para:', cliente.email);
    req.userId = cliente.id;
    req.userType = 'cliente';
    
    next();
  } catch (error: any) {
    console.error('❌ Erro na autenticação do cliente:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido: formato incorreto' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
    }
    
    return res.status(401).json({ error: 'Erro de autenticação: ' + error.message });
  }
}

