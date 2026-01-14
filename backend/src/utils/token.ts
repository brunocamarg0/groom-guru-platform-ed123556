import crypto from 'crypto';
import jwt from 'jsonwebtoken';

/**
 * Gera um token único e seguro para convites
 */
export function gerarTokenConvite(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calcula a data de vencimento do plano
 */
export function calcularDataVencimento(plano: string): Date {
  const hoje = new Date();
  const vencimento = new Date(hoje);
  
  switch (plano) {
    case 'basico':
      vencimento.setMonth(vencimento.getMonth() + 1); // 1 mês
      break;
    case 'premium':
      vencimento.setMonth(vencimento.getMonth() + 1); // 1 mês
      break;
    case 'enterprise':
      vencimento.setFullYear(vencimento.getFullYear() + 1); // 1 ano
      break;
    default:
      vencimento.setDate(vencimento.getDate() + 7); // 7 dias (trial)
  }
  
  return vencimento;
}

/**
 * Valida se um token de convite é válido
 */
export function validarToken(token: string): boolean {
  return token.length === 64 && /^[a-f0-9]+$/i.test(token);
}

/**
 * Gera token JWT para autenticação
 */
export function gerarTokenJWT(payload: { id: string; email: string; tipo: 'dono' | 'cliente' | 'admin'; barbeariaId?: string }): string {
  const secret = process.env.JWT_SECRET || 'seu-secret-super-seguro-aqui-mude-em-producao';
  return jwt.sign(payload, secret, {
    expiresIn: '7d', // Token expira em 7 dias
  });
}

/**
 * Verifica e decodifica token JWT
 */
export function verificarTokenJWT(token: string): { id: string; email: string; tipo: 'dono' | 'cliente' | 'admin'; barbeariaId?: string } {
  const secret = process.env.JWT_SECRET || 'seu-secret-super-seguro-aqui-mude-em-producao';
  return jwt.verify(token, secret) as { id: string; email: string; tipo: 'dono' | 'cliente' | 'admin'; barbeariaId?: string };
}



