# Como Acessar Banco de Dados Externo (Não Railway)

Seu banco de dados pode estar em **Supabase**, **Neon**, **AWS RDS**, ou outro provedor. Vamos descobrir qual e como acessar!

## 🔍 Passo 1: Descobrir Qual Banco Você Está Usando

### No Railway:

1. Acesse: https://railway.app
2. Abra seu projeto
3. Vá em **Settings** → **Variables**
4. Procure por `DATABASE_URL`
5. **Copie o valor** (pode estar oculto, clique para revelar)

### Analise a String de Conexão:

**Se começar com `postgresql://postgres.xxx@aws-0-xxx.pooler.supabase.com`:**
- ✅ Você está usando **Supabase**
- Veja instruções abaixo para Supabase

**Se começar com `postgresql://xxx@ep-xxx.region.aws.neon.tech`:**
- ✅ Você está usando **Neon**
- Veja instruções abaixo para Neon

**Se começar com `postgresql://xxx@xxx.rds.amazonaws.com`:**
- ✅ Você está usando **AWS RDS**
- Veja instruções abaixo para AWS RDS

---

## 🟢 Opção 1: Se for SUPABASE

### Acessar via Supabase Dashboard:

1. **Acesse:** https://supabase.com/dashboard
2. **Faça login** na sua conta
3. **Abra seu projeto** (procure pelo nome ou ID do projeto)
4. **No menu lateral, clique em "SQL Editor"** (ícone de código)
5. **Clique em "New query"**
6. **Cole este SQL:**
   ```sql
   ALTER TABLE "Barbearia" ADD COLUMN IF NOT EXISTS "foto" TEXT;
   ```
7. **Clique em "Run"** ou pressione `Ctrl+Enter`

### Verificar se funcionou:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Barbearia' AND column_name = 'foto';
```

---

## 🔵 Opção 2: Se for NEON

### Acessar via Neon Dashboard:

1. **Acesse:** https://console.neon.tech
2. **Faça login** na sua conta
3. **Abra seu projeto**
4. **No menu lateral, clique em "SQL Editor"**
5. **Cole este SQL:**
   ```sql
   ALTER TABLE "Barbearia" ADD COLUMN IF NOT EXISTS "foto" TEXT;
   ```
6. **Clique em "Run"**

### Ou via psql:

1. **No Neon Dashboard**, vá em **Connection Details**
2. **Copie a string de conexão**
3. **No terminal:**
   ```bash
   psql "postgresql://usuario:senha@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
   ```
4. **Execute:**
   ```sql
   ALTER TABLE "Barbearia" ADD COLUMN IF NOT EXISTS "foto" TEXT;
   ```

---

## 🟡 Opção 3: Se for AWS RDS ou Outro

### Via psql (PostgreSQL Client):

1. **Instale o psql** (se não tiver):
   - Windows: Baixe PostgreSQL (inclui psql)
   - Ou use: `choco install postgresql` (com Chocolatey)

2. **Obtenha a string de conexão:**
   - No Railway: Settings → Variables → `DATABASE_URL`
   - Copie o valor completo

3. **Conecte:**
   ```bash
   psql "SUA_DATABASE_URL_AQUI"
   ```

4. **Execute:**
   ```sql
   ALTER TABLE "Barbearia" ADD COLUMN IF NOT EXISTS "foto" TEXT;
   ```

### Via DBeaver (Interface Visual):

1. **Baixe DBeaver:** https://dbeaver.io/download/
2. **Instale e abra**
3. **Crie nova conexão PostgreSQL:**
   - Clique em "New Database Connection"
   - Escolha PostgreSQL
   - Preencha:
     - **Host:** Extraia da `DATABASE_URL`
     - **Port:** Geralmente 5432
     - **Database:** Nome do banco
     - **Username:** Usuário
     - **Password:** Senha
4. **Teste a conexão**
5. **Execute o SQL:**
   ```sql
   ALTER TABLE "Barbearia" ADD COLUMN IF NOT EXISTS "foto" TEXT;
   ```

---

## 🚀 Opção 4: Via Railway CLI (Funciona com Qualquer Banco)

Mesmo que o banco não esteja no Railway, você pode executar comandos através do Railway:

1. **Instale Railway CLI:**
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
   cd backend
   railway run npx prisma migrate deploy
   ```

   Isso executará a migration usando a `DATABASE_URL` configurada no Railway!

---

## ✅ Verificar se Funcionou

Após executar o SQL, verifique:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Barbearia' AND column_name = 'foto';
```

**Se retornar uma linha**, a coluna foi criada! ✅

---

## 🆘 Ainda Não Sabe Qual Banco?

**Me envie:**
1. As primeiras palavras da sua `DATABASE_URL` (sem a senha)
2. Ou uma captura de tela do Railway → Settings → Variables (ocultando valores sensíveis)

**Exemplo:**
- `postgresql://postgres.xxx@aws-0-xxx.pooler.supabase.com` → Supabase
- `postgresql://xxx@ep-xxx.aws.neon.tech` → Neon
- `postgresql://xxx@xxx.rds.amazonaws.com` → AWS RDS

Com isso, posso te dar instruções mais específicas! 🎯

