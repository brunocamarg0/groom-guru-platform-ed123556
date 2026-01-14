# 📝 Como Criar o Arquivo backend/.env

## Método 1: Copiar do exemplo (Recomendado)

1. No terminal, vá até a pasta `backend`:
   ```bash
   cd backend
   ```

2. Copie o arquivo de exemplo:
   ```bash
   # Windows (PowerShell)
   Copy-Item .env.example .env
   
   # Windows (CMD)
   copy .env.example .env
   
   # Linux/Mac
   cp .env.example .env
   ```

3. Edite o arquivo `.env` e preencha com suas configurações do Supabase.

## Método 2: Criar manualmente

1. Crie um arquivo chamado `.env` na pasta `backend`
2. Cole o seguinte conteúdo:

```env
# Banco de Dados Supabase
# Substitua [SUA_SENHA] pela senha que você criou no Supabase
DATABASE_URL="postgresql://postgres.xxxxx:[SUA_SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Servidor
PORT=3001
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:5173

# JWT Secret (gere um token aleatório com: openssl rand -base64 32)
JWT_SECRET=seu-token-super-secreto-aqui-mude-em-producao

# Session Secret (gere outro token aleatório)
SESSION_SECRET=seu-session-secret-aqui
```

3. **IMPORTANTE:** Substitua:
   - `[SUA_SENHA]` pela senha do Supabase
   - `xxxxx` pela referência do seu projeto Supabase
   - `seu-token-super-secreto-aqui-mude-em-producao` por um token gerado
   - `seu-session-secret-aqui` por outro token gerado

## Como Gerar Tokens Seguros

### No Windows (PowerShell):
```powershell
# Gerar JWT_SECRET
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString() + (New-Guid).ToString()))

# Ou use um gerador online: https://generate-secret.vercel.app/32
```

### No Linux/Mac:
```bash
openssl rand -base64 32
```

## ⚠️ IMPORTANTE

- **NUNCA** commite o arquivo `.env` no Git
- O arquivo `.env` já deve estar no `.gitignore`
- Mantenha suas senhas e tokens seguros!
