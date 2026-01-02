import bcrypt from 'bcryptjs';

/**
 * Hash de senha usando bcrypt
 */
export async function hashSenha(senha: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(senha, salt);
}

/**
 * Compara senha com hash
 */
export async function compararSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

