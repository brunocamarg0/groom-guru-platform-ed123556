# ☁️ Bancos de Dados Gratuitos na Nuvem

## 🎯 Opções Recomendadas (100% Gratuitas)

### 1. **Supabase** ⭐ (Mais Recomendado)
- **Tipo:** PostgreSQL
- **Limite Gratuito:** 500MB de banco + 2GB de banda
- **Vantagens:**
  - ✅ Interface web muito fácil
  - ✅ Dashboard completo
  - ✅ Backup automático
  - ✅ SSL incluso
  - ✅ Sempre online (não dorme)
  
**Link:** https://supabase.com

---

### 2. **Neon** ⭐ (Muito Popular)
- **Tipo:** PostgreSQL
- **Limite Gratuito:** 3GB de banco
- **Vantagens:**
  - ✅ Mais espaço que Supabase
  - ✅ Interface moderna
  - ✅ Auto-scaling
  - ✅ Branching (como Git para banco)
  
**Link:** https://neon.tech

---

### 3. **PlanetScale**
- **Tipo:** MySQL
- **Limite Gratuito:** 5GB de banco
- **Vantagens:**
  - ✅ Mais espaço (5GB)
  - ✅ Branching de schema
  - ✅ Sem downtime em deploys
  
**Link:** https://planetscale.com

---

### 4. **Railway**
- **Tipo:** PostgreSQL
- **Limite Gratuito:** $5 créditos/mês
- **Vantagens:**
  - ✅ Fácil de usar
  - ✅ Deploy automático
  
**Link:** https://railway.app

---

## 🚀 Como Configurar (Exemplo: Supabase)

### Passo 1: Criar conta no Supabase

1. Acesse: https://supabase.com
2. Clique em "Start your project"
3. Faça login com GitHub/Google
4. Crie um novo projeto:
   - Nome: `groom-guru-db`
   - Senha: (anote bem!)
   - Região: escolha a mais próxima (ex: South America)

### Passo 2: Obter a URL de conexão

1. No dashboard do Supabase, vá em **Settings** → **Database**
2. Role até **Connection string**
3. Copie a string que começa com `postgresql://...`
   - Exemplo: `postgresql://postgres:[SENHA]@db.xxxxx.supabase.co:5432/postgres`

### Passo 3: Atualizar o Prisma Schema

Edite `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Mudar de "sqlite" para "postgresql"
  url      = env("DATABASE_URL")
}
```

### Passo 4: Configurar o .env

Edite `backend/.env` e adicione:

```env
DATABASE_URL="postgresql://postgres:[SUA_SENHA]@db.xxxxx.supabase.co:5432/postgres?schema=public"
PORT=3001
FRONTEND_URL=http://localhost:8080
```

**⚠️ IMPORTANTE:** Substitua `[SUA_SENHA]` pela senha que você criou no Supabase!

### Passo 5: Executar migrações

```bash
cd backend
npm run prisma:migrate
npm run prisma:generate
```

### Passo 6: Testar

```bash
npm run dev
```

---

## 🚀 Como Configurar (Exemplo: Neon)

### Passo 1: Criar conta no Neon

1. Acesse: https://neon.tech
2. Clique em "Sign Up"
3. Faça login com GitHub
4. Crie um novo projeto:
   - Nome: `groom-guru`
   - Região: escolha a mais próxima

### Passo 2: Obter a URL de conexão

1. No dashboard, clique no seu projeto
2. Vá em **Connection Details**
3. Copie a **Connection string**
   - Exemplo: `postgresql://user:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

### Passo 3-6: Mesmos passos do Supabase acima!

---

## 🔄 Migrar de SQLite para PostgreSQL

Se você já tem dados no SQLite e quer migrar:

1. **Exportar dados do SQLite** (opcional, se tiver dados importantes)
2. **Configurar o novo banco na nuvem** (passos acima)
3. **Executar migrações:**
   ```bash
   npm run prisma:migrate
   ```
4. **Importar dados** (se necessário)

---

## 📊 Comparação Rápida

| Plataforma | Tipo | Espaço Grátis | Dificuldade | Recomendado Para |
|------------|------|---------------|-------------|-----------------|
| **Supabase** | PostgreSQL | 500MB | ⭐ Fácil | Iniciantes |
| **Neon** | PostgreSQL | 3GB | ⭐ Fácil | Projetos médios |
| **PlanetScale** | MySQL | 5GB | ⭐⭐ Médio | Projetos grandes |
| **Railway** | PostgreSQL | $5/mês | ⭐ Fácil | Deploy completo |

---

## ✅ Recomendação Final

**Para começar:** Use **Supabase** - é o mais fácil e tem tudo que você precisa!

**Para mais espaço:** Use **Neon** - 3GB é muito espaço para começar!

---

## 🆘 Precisa de Ajuda?

Se tiver dúvidas na configuração, me avise que eu ajudo! 😊
