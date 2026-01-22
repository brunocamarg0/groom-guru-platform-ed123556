-- AlterTable: Adicionar coluna foto para armazenar imagem da barbearia
ALTER TABLE "Barbearia" ADD COLUMN IF NOT EXISTS "foto" TEXT;

-- Comentário: Esta coluna armazena a foto da barbearia em base64
-- A foto é exibida no painel do cliente quando ele busca barbearias
COMMENT ON COLUMN "Barbearia"."foto" IS 'Foto da barbearia em base64 (exibida na listagem de barbearias para clientes)';
