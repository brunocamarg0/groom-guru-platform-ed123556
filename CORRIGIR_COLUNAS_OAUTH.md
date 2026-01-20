# 🔧 CORREÇÃO URGENTE: Colunas OAuth não existem no banco

## ⚠️ Problema

O erro mostra que as colunas `facebookId`, `googleId`, `appleId` não existem na tabela `Cliente` do banco de dados, mas o Prisma Client foi gerado esperando essas colunas.

## ✅ Solução: Executar Migração no Railway

### Opção 1: Via Railway Console (Recomendado)

1. Acesse: https://railway.app
2. Selecione seu projeto
3. Vá para o serviço do backend
4. Clique em **"Deployments"**
5. Clique no deployment mais recente
6. Vá para a aba **"Console"** ou **"Shell"**
7. Execute:
   ```bash
   npx prisma db push
   ```

Isso irá:
- ✅ Criar as colunas `googleId`, `facebookId`, `appleId` na tabela `Cliente`
- ✅ Criar os índices únicos necessários
- ✅ Sincronizar o schema com o banco de dados

### Opção 2: Via SQL direto (Alternativa)

Se o `prisma db push` não funcionar, você pode executar o SQL diretamente:

1. Acesse seu banco de dados (Supabase, Railway Database, etc.)
2. Execute o SQL do arquivo `backend/scripts/adicionar-colunas-oauth.sql`

Ou execute diretamente:

```sql
-- Adicionar colunas OAuth
ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "googleId" TEXT;
ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "facebookId" TEXT;
ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "appleId" TEXT;

-- Criar índices únicos
CREATE UNIQUE INDEX IF NOT EXISTS "Cliente_googleId_key" ON "Cliente"("googleId") WHERE "googleId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Cliente_facebookId_key" ON "Cliente"("facebookId") WHERE "facebookId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Cliente_appleId_key" ON "Cliente"("appleId") WHERE "appleId" IS NOT NULL;
```

## 🔍 Verificar se funcionou

Após executar, verifique:

1. As colunas foram criadas:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'Cliente' 
   AND column_name IN ('googleId', 'facebookId', 'appleId');
   ```

2. Tente criar um cliente novamente
3. O erro não deve mais aparecer

## 📝 Nota Importante

**Essas colunas são opcionais** e são usadas apenas para login via OAuth (Google, Facebook, Apple). Se você não vai usar OAuth, as colunas podem ficar vazias (NULL).

## 🚨 Se ainda não funcionar

1. Verifique se o `DATABASE_URL` está correto no Railway
2. Verifique se você tem permissões para alterar a estrutura da tabela
3. Verifique os logs do Railway para ver se há outros erros
