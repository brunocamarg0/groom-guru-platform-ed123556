# Como Acessar o Banco de Dados no Railway

Existem várias formas de acessar o banco de dados PostgreSQL no Railway:

## Opção 1: Via Railway Dashboard (Mais Fácil) ⭐

1. **Acesse o Railway Dashboard:**
   - Vá para: https://railway.app
   - Faça login na sua conta

2. **Encontre seu projeto:**
   - Clique no projeto "groom-guru-platform" (ou o nome do seu projeto)

3. **Acesse o serviço do banco de dados:**
   - Procure pelo serviço do PostgreSQL (geralmente chamado "Postgres" ou "Database")
   - Clique nele

4. **Acesse o Query Editor:**
   - Na página do serviço, procure por "Query" ou "Data" na barra lateral
   - Ou clique na aba "Data" ou "Query"
   - Você verá um editor SQL

5. **Execute o SQL:**
   - Cole este comando:
   ```sql
   ALTER TABLE "Barbearia" ADD COLUMN IF NOT EXISTS "foto" TEXT;
   ```
   - Clique em "Run" ou "Execute"

## Opção 2: Via Railway CLI

1. **Instale o Railway CLI:**
   ```bash
   npm i -g @railway/cli
   ```

2. **Faça login:**
   ```bash
   railway login
   ```

3. **Conecte ao projeto:**
   ```bash
   railway link
   ```

4. **Execute a migration:**
   ```bash
   railway run npx prisma migrate deploy
   ```

   Ou execute SQL direto:
   ```bash
   railway run psql $DATABASE_URL -c "ALTER TABLE \"Barbearia\" ADD COLUMN IF NOT EXISTS \"foto\" TEXT;"
   ```

## Opção 3: Via psql (PostgreSQL Client)

1. **Obtenha a string de conexão:**
   - No Railway Dashboard, vá para o serviço do PostgreSQL
   - Clique em "Variables" ou "Settings"
   - Copie o valor de `DATABASE_URL` ou `POSTGRES_URL`

2. **Conecte via psql:**
   ```bash
   psql "postgresql://usuario:senha@host:porta/database"
   ```
   
   Substitua pelos valores da sua `DATABASE_URL`

3. **Execute o SQL:**
   ```sql
   ALTER TABLE "Barbearia" ADD COLUMN IF NOT EXISTS "foto" TEXT;
   ```

## Opção 4: Via Prisma Studio (Interface Visual)

1. **Instale o Railway CLI** (se ainda não tiver):
   ```bash
   npm i -g @railway/cli
   ```

2. **Conecte ao projeto:**
   ```bash
   railway link
   ```

3. **Execute o Prisma Studio:**
   ```bash
   cd backend
   railway run npx prisma studio
   ```

4. **Acesse no navegador:**
   - O Railway abrirá um túnel
   - Acesse a URL fornecida (geralmente algo como `http://localhost:5555`)
   - Você verá uma interface visual do banco de dados

## Opção 5: Via DBeaver ou outro cliente SQL

1. **Obtenha as credenciais:**
   - No Railway Dashboard, vá para o serviço do PostgreSQL
   - Clique em "Variables" ou "Settings"
   - Anote:
     - Host (do `DATABASE_URL`)
     - Porta (geralmente 5432)
     - Database (nome do banco)
     - Username (usuário)
     - Password (senha)

2. **Configure a conexão no DBeaver:**
   - Abra o DBeaver
   - Crie uma nova conexão PostgreSQL
   - Preencha as credenciais
   - Teste a conexão

3. **Execute o SQL:**
   ```sql
   ALTER TABLE "Barbearia" ADD COLUMN IF NOT EXISTS "foto" TEXT;
   ```

## Verificar se a coluna foi criada

Após executar o SQL, verifique se funcionou:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Barbearia' AND column_name = 'foto';
```

Se retornar uma linha com `column_name = 'foto'` e `data_type = 'text'`, a coluna foi criada com sucesso! ✅

## Recomendação

**Use a Opção 1 (Railway Dashboard)** - É a mais fácil e não requer instalação de ferramentas adicionais.

