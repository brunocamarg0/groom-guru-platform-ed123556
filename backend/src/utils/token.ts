import crypto from 'crypto';

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

