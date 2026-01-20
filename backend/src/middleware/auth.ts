import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { obterJWTSecret } from '../utils/token';

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
    console.log('🔐 autenticarDono: Iniciando autenticação...');
    console.log('🔐 autenticarDono: Path:', req.path);
    console.log('🔐 autenticarDono: Method:', req.method);
    
    const authHeader = req.headers.authorization;
    console.log('🔐 autenticarDono: Authorization header presente:', !!authHeader);
    console.log('🔐 autenticarDono: Authorization header (primeiros 30 chars):', authHeader ? authHeader.substring(0, 30) + '...' : 'N/A');
    
    const token = authHeader?.replace('Bearer ', '').trim();
    
    if (!token) {
      console.error('❌ autenticarDono: Token não fornecido');
      console.error('❌ autenticarDono: Headers authorization:', req.headers.authorization);
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    // Verificar formato básico do token (deve ter 3 partes separadas por ponto)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('❌ autenticarDono: Token em formato inválido (não é JWT válido)');
      console.error('❌ autenticarDono: Token parts:', tokenParts.length);
      console.error('❌ autenticarDono: Token (primeiros 50 chars):', token.substring(0, 50));
      return res.status(401).json({ error: 'Token inválido: formato incorreto' });
    }

    console.log('🔐 autenticarDono: Token presente e formato válido, verificando...');
    // Usar função centralizada para obter o secret (garante consistência)
    const jwtSecret = obterJWTSecret();
    console.log('🔐 autenticarDono: JWT_SECRET configurado:', !!process.env.JWT_SECRET);
    console.log('🔐 autenticarDono: JWT_SECRET (primeiros 10 chars):', jwtSecret.substring(0, 10) + '...');
    console.log('🔐 autenticarDono: Token completo (primeiros 50 chars):', token.substring(0, 50) + '...');
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret) as any;
      console.log('✅ autenticarDono: Token decodificado com sucesso:', { id: decoded.id, email: decoded.email, tipo: decoded.tipo });
    } catch (verifyError: any) {
      console.error('❌ autenticarDono: Erro ao verificar token JWT:');
      console.error('   Erro tipo:', verifyError.name);
      console.error('   Erro mensagem:', verifyError.message);
      console.error('   Token (primeiros 100 chars):', token.substring(0, 100));
      console.error('   JWT_SECRET presente:', !!process.env.JWT_SECRET);
      console.error('   JWT_SECRET usado (primeiros 20 chars):', jwtSecret.substring(0, 20) + '...');
      throw verifyError; // Re-throw para ser capturado pelo catch externo
    }
    
    // O token contém { id, email, tipo }
    const userId = decoded.id || decoded.userId;
    
    if (!userId) {
      console.error('❌ autenticarDono: ID do usuário não encontrado no token');
      return res.status(401).json({ error: 'Token inválido: ID do usuário não encontrado' });
    }
    
    console.log('🔐 autenticarDono: Buscando dono no banco com ID:', userId);
    // Buscar usuário dono
    let dono;
    try {
      dono = await prisma.usuarioDono.findUnique({
        where: { id: userId },
        include: { barbearia: true },
      });
    } catch (prismaError: any) {
      console.error('❌ autenticarDono: Erro ao buscar dono no Prisma:');
      console.error('   Erro tipo:', prismaError.name);
      console.error('   Erro código:', prismaError.code);
      console.error('   Erro mensagem:', prismaError.message);
      console.error('   Erro meta:', JSON.stringify(prismaError.meta, null, 2));
      console.error('   Erro stack:', prismaError.stack);
      throw prismaError; // Re-throw para ser capturado pelo catch externo
    }

    if (!dono) {
      console.error('❌ autenticarDono: Dono não encontrado no banco');
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    if (!dono.ativo) {
      console.error('❌ autenticarDono: Dono inativo');
      return res.status(401).json({ error: 'Usuário inativo' });
    }

    console.log('✅ autenticarDono: Autenticação bem-sucedida para:', dono.email);
    req.userId = dono.id;
    req.userType = 'dono';
    req.barbeariaId = dono.barbeariaId;
    
    next();
  } catch (error: any) {
    console.error('❌ Erro na autenticação:', error);
    console.error('❌ Erro tipo:', error.name);
    console.error('❌ Erro mensagem:', error.message);
    console.error('❌ Erro stack:', error.stack);
    
    // Mensagens de erro mais específicas
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido: formato incorreto' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
    }
    
    return res.status(401).json({ error: 'Token inválido' });
  }
}
