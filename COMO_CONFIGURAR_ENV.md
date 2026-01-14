# 🔧 Como Configurar o Arquivo backend/.env

## ✅ O arquivo `.env` já existe!

Agora você precisa **editar** o arquivo `backend/.env` e preencher com suas configurações do Supabase.

## 📝 Passo a Passo

### 1. Abrir o arquivo `.env`

O arquivo está em: `backend/.env`

Você pode abrir com:
- **VS Code:** Clique com botão direito no arquivo → "Open with Code"
- **Notepad:** Clique com botão direito → "Abrir com" → "Bloco de Notas"
- **Qualquer editor de texto**

### 2. Preencher as variáveis

O arquivo deve ter este formato:

```env
# Banco de Dados Supabase
DATABASE_URL="postgresql://postgres.xxxxx:[SUA_SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Servidor
PORT=3001
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:5173

# JWT Secret
JWT_SECRET=seu-token-super-secreto-aqui-mude-em-producao

# Session Secret
SESSION_SECRET=seu-session-secret-aqui
```

### 3. Obter DATABASE_URL do Supabase

1. Acesse: https://supabase.com
2. Faça login e abra seu projeto
3. Vá em **Settings** (⚙️) → **Database**
4. Role até **"Connection string"**
5. Selecione a aba **"URI"**
6. Copie a string que aparece
7. **IMPORTANTE:** Substitua `[YOUR-PASSWORD]` pela senha que você criou ao criar o projeto

**Exemplo:**
```
postgresql://postgres.abcdefghijklmnop:[SUA_SENHA_AQUI]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

### 4. Gerar JWT_SECRET e SESSION_SECRET

#### Opção 1: PowerShell (Windows)
```powershell
# Gerar JWT_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Gerar SESSION_SECRET (execute novamente para gerar outro)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

#### Opção 2: Gerador Online
Acesse: https://generate-secret.vercel.app/32
- Gere um token e cole no `JWT_SECRET`
- Gere outro token e cole no `SESSION_SECRET`

#### Opção 3: Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 5. Exemplo Final do `.env`

```env
# Banco de Dados Supabase
DATABASE_URL="postgresql://postgres.abcdefghijklmnop:MinhaSenha123!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Servidor
PORT=3001
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:5173

# JWT Secret
JWT_SECRET=K8jL3mN9pQ2rS5tU7vW0xY1zA4bC6dE8fG0hI2jK4lM6nO8pQ0rS2tU4vW6xY8z

# Session Secret
SESSION_SECRET=A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v2W3x4Y5z6A7b8C9d0
```

## ✅ Verificar se está correto

Depois de preencher, teste se está funcionando:

```bash
cd backend
npm run dev
```

Se aparecer:
```
🚀 Server is running on http://localhost:3001
📚 API Health: http://localhost:3001/api/health
```

**Está funcionando!** ✅

Se der erro de conexão com o banco, verifique:
- Se a senha está correta
- Se o DATABASE_URL está completo
- Se o projeto Supabase está ativo

## ⚠️ IMPORTANTE

- **NUNCA** commite o arquivo `.env` no Git
- Mantenha suas senhas seguras
- Não compartilhe o arquivo `.env` publicamente
