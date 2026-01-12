# 🚀 Passo a Passo: Configurar Supabase e Integrar Backend

## 📋 Índice
1. [Configurar Supabase](#1-configurar-supabase)
2. [Executar Migrações](#2-executar-migrações)
3. [Atualizar DonoContext](#3-atualizar-donocontext)

---

## 1. Configurar Supabase

### Passo 1.1: Criar Conta no Supabase

1. Acesse: **https://supabase.com**
2. Clique em **"Start your project"** ou **"Sign Up"**
3. Faça login com:
   - GitHub (recomendado)
   - Google
   - Email

### Passo 1.2: Criar Novo Projeto

1. No dashboard, clique em **"New Project"**
2. Preencha os dados:
   - **Name:** `groom-guru-production`
   - **Database Password:** ⚠️ **ANOTE BEM ESTA SENHA!** Você precisará dela
   - **Region:** **South America (São Paulo)** - Melhor performance no Brasil
   - **Pricing Plan:** **Free** (gratuito)
3. Clique em **"Create new project"**
4. Aguarde ~2 minutos para o projeto ser criado

### Passo 1.3: Obter DATABASE_URL

1. No dashboard do projeto, vá em **Settings** (ícone de engrenagem no canto inferior esquerdo)
2. Clique em **Database**
3. Role até a seção **"Connection string"**
4. Selecione a aba **"URI"** (não "Session mode")
5. Você verá algo como:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
   ```
6. **IMPORTANTE:** Copie a string e substitua `[YOUR-PASSWORD]` pela senha que você criou no Passo 1.2

**Exemplo de DATABASE_URL final:**
```
postgresql://postgres.abcdefghijklmnop:[SUA_SENHA_AQUI]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

### Passo 1.4: Criar Arquivo .env no Backend

1. No projeto, vá até a pasta `backend`
2. Crie um arquivo chamado `.env` (sem extensão)
3. Adicione o seguinte conteúdo:

```env
# Banco de Dados Supabase
DATABASE_URL="postgresql://postgres.xxxxx:[SUA_SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Servidor
PORT=3001
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:5173

# JWT Secret (gere um token aleatório)
JWT_SECRET=seu-token-super-secreto-aqui-mude-em-producao

# Session Secret
SESSION_SECRET=seu-session-secret-aqui
```

**⚠️ IMPORTANTE:**
- Substitua `[SUA_SENHA]` pela senha do Supabase
- Para gerar JWT_SECRET, execute no terminal:
  ```bash
  openssl rand -base64 32
  ```
- Copie o resultado e cole no lugar de `seu-token-super-secreto-aqui-mude-em-producao`
- Faça o mesmo para SESSION_SECRET (gere outro token)

**🔒 SEGURANÇA:**
- NUNCA commite o arquivo `.env` no Git
- O arquivo `.env` já deve estar no `.gitignore`

---

## 2. Executar Migrações

### Passo 2.1: Instalar Dependências

Abra o terminal na pasta do projeto e execute:

```bash
cd backend
npm install
```

### Passo 2.2: Gerar Prisma Client

```bash
npx prisma generate
```

Este comando gera o cliente Prisma baseado no schema.

### Passo 2.3: Executar Migrações

```bash
npx prisma migrate dev --name add_profissionais_produtos_promocoes
```

Este comando irá:
- Criar as tabelas no banco Supabase
- Aplicar todas as migrações
- Criar um arquivo de migração

**Se der erro de conexão:**
- Verifique se o DATABASE_URL está correto
- Verifique se substituiu `[YOUR-PASSWORD]` pela senha real
- Verifique se o projeto Supabase está ativo

### Passo 2.4: Verificar se Funcionou

Execute:

```bash
npx prisma studio
```

Isso abrirá uma interface web onde você pode ver todas as tabelas criadas.

**Ou teste via terminal:**

```bash
cd backend
npm run dev
```

Se não der erro, está funcionando! ✅

---

## 3. Atualizar DonoContext

### Passo 3.1: Verificar se o Serviço de API Existe

O arquivo `src/services/api.ts` já foi criado. Verifique se existe.

### Passo 3.2: Adicionar Variável de Ambiente no Frontend

Crie/atualize o arquivo `.env` na **raiz do projeto** (não na pasta backend):

```env
VITE_API_URL=http://localhost:3001/api
```

### Passo 3.3: Atualizar DonoContext

Agora vamos atualizar o `DonoContext` para usar as APIs reais. Vou fazer isso para você!

---

## ✅ Checklist Final

- [ ] Conta criada no Supabase
- [ ] Projeto criado no Supabase
- [ ] DATABASE_URL copiado e configurado no `backend/.env`
- [ ] JWT_SECRET e SESSION_SECRET gerados e configurados
- [ ] `npm install` executado no backend
- [ ] `npx prisma generate` executado
- [ ] `npx prisma migrate dev` executado com sucesso
- [ ] Backend rodando sem erros (`npm run dev`)
- [ ] Variável `VITE_API_URL` configurada no `.env` da raiz
- [ ] DonoContext atualizado (vou fazer isso agora!)

---

## 🆘 Problemas Comuns

### Erro: "Can't reach database server"
**Solução:**
- Verifique se o DATABASE_URL está correto
- Verifique se a senha está correta
- Tente usar a connection string direta (sem pgbouncer):
  ```
  postgresql://postgres:[SENHA]@db.xxxxx.supabase.co:5432/postgres
  ```

### Erro: "Migration failed"
**Solução:**
- Verifique se não há tabelas antigas no banco
- Tente resetar o banco (CUIDADO: apaga todos os dados):
  ```bash
  npx prisma migrate reset
  ```

### Erro: "Module not found: @prisma/client"
**Solução:**
```bash
cd backend
npm install
npx prisma generate
```

---

## 🎉 Próximo Passo

Depois de configurar tudo, vou atualizar o DonoContext para usar as APIs reais!
