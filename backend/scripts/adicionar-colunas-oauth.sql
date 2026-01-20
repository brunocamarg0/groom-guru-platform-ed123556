-- Script SQL para adicionar colunas OAuth na tabela Cliente
-- Execute este script no banco de dados se as colunas não existirem

-- Adicionar colunas OAuth se não existirem
DO $$ 
BEGIN
    -- Adicionar googleId se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Cliente' AND column_name = 'googleId'
    ) THEN
        ALTER TABLE "Cliente" ADD COLUMN "googleId" TEXT;
        CREATE UNIQUE INDEX IF NOT EXISTS "Cliente_googleId_key" ON "Cliente"("googleId") WHERE "googleId" IS NOT NULL;
    END IF;

    -- Adicionar facebookId se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Cliente' AND column_name = 'facebookId'
    ) THEN
        ALTER TABLE "Cliente" ADD COLUMN "facebookId" TEXT;
        CREATE UNIQUE INDEX IF NOT EXISTS "Cliente_facebookId_key" ON "Cliente"("facebookId") WHERE "facebookId" IS NOT NULL;
    END IF;

    -- Adicionar appleId se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Cliente' AND column_name = 'appleId'
    ) THEN
        ALTER TABLE "Cliente" ADD COLUMN "appleId" TEXT;
        CREATE UNIQUE INDEX IF NOT EXISTS "Cliente_appleId_key" ON "Cliente"("appleId") WHERE "appleId" IS NOT NULL;
    END IF;
END $$;
