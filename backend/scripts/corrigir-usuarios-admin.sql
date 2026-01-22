-- Script SQL para corrigir/criar usuários admin
-- Execute este script diretamente no banco de dados usando Prisma Studio ou seu cliente SQL favorito
--
-- ⚠️ IMPORTANTE: Este script requer que você gere o HASH da senha manualmente
-- 
-- O QUE É UM HASH?
-- Um hash é uma versão criptografada da senha. Por segurança, senhas nunca são
-- armazenadas em texto plano no banco de dados. Em vez disso, armazenamos um "hash".
-- 
-- Exemplo:
--   Senha original: "Admin123!@#"
--   Hash gerado: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
--
-- COMO GERAR O HASH?
-- Opção 1 (RECOMENDADO): Use o script TypeScript que faz isso automaticamente:
--   npx tsx backend/scripts/corrigir-usuarios-admin.ts
--
-- Opção 2: Use a API que também faz isso automaticamente:
--   http://localhost:3000/api/admin/corrigir-admin
--
-- Opção 3: Se precisar fazer manualmente, use uma ferramenta online:
--   https://bcrypt-generator.com/
--   - Digite sua senha (ex: "Admin123!@#")
--   - Clique em "Generate"
--   - Copie o hash gerado (começa com $2a$ ou $2b$)
--
-- ============================================
-- INSTRUÇÕES PARA USAR ESTE SCRIPT SQL:
-- ============================================
-- 1. Gere o hash da senha usando uma das opções acima
-- 2. Substitua 'HASH_DA_SENHA_AQUI' abaixo pelo hash gerado
-- 3. Execute este script no seu banco de dados
-- ============================================

-- Primeiro, vamos verificar se os usuários existem
SELECT id, nome, email, role, ativo, "createdAt"
FROM "UsuarioAdmin"
WHERE email IN ('brunocamargocontato@hotmail.com', 'bernardostrabelli@gmail.com');

-- Atualizar ou criar usuário: brunocamargocontato@hotmail.com
INSERT INTO "UsuarioAdmin" (id, nome, email, senha, role, ativo, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Bruno Camargo',
  'brunocamargocontato@hotmail.com',
  '$2a$10$HASH_DA_SENHA_AQUI', -- SUBSTITUA pelo hash bcrypt da senha
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET
  nome = EXCLUDED.nome,
  senha = EXCLUDED.senha,
  role = EXCLUDED.role,
  ativo = true,
  "updatedAt" = NOW();

-- Atualizar ou criar usuário: bernardostrabelli@gmail.com
INSERT INTO "UsuarioAdmin" (id, nome, email, senha, role, ativo, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Bernardo Trabelli',
  'bernardostrabelli@gmail.com',
  '$2a$10$HASH_DA_SENHA_AQUI', -- SUBSTITUA pelo hash bcrypt da senha
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET
  nome = EXCLUDED.nome,
  senha = EXCLUDED.senha,
  role = EXCLUDED.role,
  ativo = true,
  "updatedAt" = NOW();

-- Verificar resultado
SELECT id, nome, email, role, ativo, "createdAt"
FROM "UsuarioAdmin"
WHERE email IN ('brunocamargocontato@hotmail.com', 'bernardostrabelli@gmail.com');
