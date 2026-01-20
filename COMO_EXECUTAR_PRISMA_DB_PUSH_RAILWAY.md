# 🚀 Como Executar `npx prisma db push` no Railway

## 📋 Passo a Passo Completo

### Opção 1: Via Railway Console (Recomendado)

1. **Acesse o Railway:**
   - Vá para: https://railway.app
   - Faça login na sua conta

2. **Selecione seu Projeto:**
   - Clique no projeto que contém o backend
   - Você verá uma lista de serviços (frontend, backend, database, etc.)

3. **Acesse o Serviço do Backend:**
   - Clique no serviço do **backend** (geralmente chamado "Backend" ou "API")

4. **Abra o Console:**
   - No menu lateral, clique em **"Deployments"** (ou "Deployments" na parte superior)
   - Clique no **deployment mais recente** (o que está ativo/rodando)
   - Procure por uma aba chamada **"Console"**, **"Shell"**, **"Terminal"** ou **"Run Command"**
   - Clique nessa aba

5. **Execute o Comando:**
   - No console que abrir, digite:
     ```bash
     npx prisma db push
     ```
   - Pressione Enter
   - Aguarde a execução (pode levar alguns segundos)

6. **Verifique o Resultado:**
   - Você verá mensagens como:
     ```
     ✅ Prisma schema loaded from prisma/schema.prisma
     ✅ Database synchronized successfully
     ```
   - Se houver erros, eles serão exibidos no console

### Opção 2: Via Railway CLI (Se tiver instalado)

Se você tiver o Railway CLI instalado localmente:

1. **Instale o Railway CLI** (se ainda não tiver):
   ```bash
   npm install -g @railway/cli
   ```

2. **Faça login:**
   ```bash
   railway login
   ```

3. **Conecte ao projeto:**
   ```bash
   railway link
   ```
   - Selecione o projeto e serviço do backend

4. **Execute o comando:**
   ```bash
   railway run npx prisma db push
   ```

### Opção 3: Via SQL Direto no Banco de Dados

Se o console não funcionar, você pode executar o SQL diretamente:

1. **Acesse o Banco de Dados:**
   - No Railway, vá para o serviço do **banco de dados** (PostgreSQL)
   - Clique em **"Data"** ou **"Postgres"**
   - Clique em **"Query"** ou **"SQL Editor"**

2. **Execute o SQL:**
   - Cole o seguinte SQL:
   ```sql
   -- Adicionar colunas OAuth se não existirem
   ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "googleId" TEXT;
   ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "facebookId" TEXT;
   ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "appleId" TEXT;

   -- Criar índices únicos
   CREATE UNIQUE INDEX IF NOT EXISTS "Cliente_googleId_key" 
   ON "Cliente"("googleId") WHERE "googleId" IS NOT NULL;
   
   CREATE UNIQUE INDEX IF NOT EXISTS "Cliente_facebookId_key" 
   ON "Cliente"("facebookId") WHERE "facebookId" IS NOT NULL;
   
   CREATE UNIQUE INDEX IF NOT EXISTS "Cliente_appleId_key" 
   ON "Cliente"("appleId") WHERE "appleId" IS NOT NULL;
   ```

3. **Execute o SQL:**
   - Clique em **"Run"** ou **"Execute"**
   - Verifique se não há erros

## 🔍 Verificar se Funcionou

Após executar `npx prisma db push`, verifique:

1. **Mensagens de sucesso:**
   ```
   ✅ Database synchronized successfully
   ✅ Generated Prisma Client
   ```

2. **Teste no sistema:**
   - Tente criar um cliente novamente
   - Tente recuperar senha
   - Os erros de colunas não encontradas devem desaparecer

3. **Verificar no banco:**
   - Execute no SQL:
     ```sql
     SELECT column_name 
     FROM information_schema.columns 
     WHERE table_name = 'Cliente' 
     AND column_name IN ('googleId', 'facebookId', 'appleId');
     ```
   - Deve retornar as 3 colunas

## ⚠️ Troubleshooting

### Problema: Console não abre
**Solução:**
- Tente usar a Opção 3 (SQL direto)
- Ou aguarde o próximo deploy (o Railway pode executar automaticamente)

### Problema: Comando não encontrado
**Solução:**
- Certifique-se de estar no diretório correto (`/app` no Railway)
- Tente: `cd /app && npx prisma db push`

### Problema: Erro de conexão com banco
**Solução:**
- Verifique se a variável `DATABASE_URL` está configurada no Railway
- Vá em **Variables** no serviço do backend
- Confirme que `DATABASE_URL` existe e está correta

### Problema: Permissões insuficientes
**Solução:**
- Verifique se você tem permissões para alterar o banco de dados
- Se necessário, use o SQL direto (Opção 3)

## 📝 Nota Importante

**O Railway pode executar `prisma generate` automaticamente no deploy**, mas **NÃO executa `prisma db push` automaticamente**. Por isso, você precisa executar manualmente quando houver mudanças no schema.

## ✅ Após Executar

1. ✅ As colunas OAuth serão criadas
2. ✅ O sistema funcionará normalmente
3. ✅ Não haverá mais erros de colunas não encontradas
4. ✅ Você poderá criar clientes e recuperar senhas normalmente

## 🎯 Próximos Passos

Após executar `npx prisma db push`:

1. Teste criar um cliente
2. Teste recuperar senha
3. Verifique se tudo está funcionando
4. Se ainda houver erros, verifique os logs do Railway
