# 🚀 Guia de Configuração Rápida

## ⚡ Setup Completo em 3 Passos

### 1️⃣ Instalar Dependências
```bash
cd backend
npm install
```

### 2️⃣ Configurar Banco de Dados

**Opção A: Banco Local (SQLite)** - Para desenvolvimento rápido
```bash
# Script automático (recomendado)
node scripts/setup-db.js

# Ou manual
npm run prisma:migrate
npm run prisma:generate
```

**Opção B: Banco na Nuvem (PostgreSQL/MySQL)** - Para produção
```bash
# Use um banco gratuito na nuvem (Supabase, Neon, PlanetScale)
# Veja o guia completo: GUIA_BANCO_NUVEM.md

# Script interativo para configurar
node scripts/setup-cloud-db.js

# Depois execute as migrações
npm run prisma:migrate
npm run prisma:generate
```

📖 **Guia completo de bancos na nuvem:** Veja `GUIA_BANCO_NUVEM.md`

### 3️⃣ Iniciar Servidor
```bash
npm run dev
```

✅ Servidor rodando em: http://localhost:3001

---

## 📧 Configuração de Email

### Para Desenvolvimento (Ethereal Email)
Não precisa configurar nada! O sistema usa Ethereal Email automaticamente.

Quando enviar um email, você verá no console:
```
📧 Preview do email: https://ethereal.email/message/...
```

Acesse o link para ver o email enviado.

### Para Produção (SMTP Real)

Edite o arquivo `.env` e adicione:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
EMAIL_FROM="Groom Guru <noreply@groomguru.com>"
```

**Gmail:** Use "Senha de App" (não a senha normal)
- Acesse: https://myaccount.google.com/apppasswords

**Outros provedores:**
- Outlook: `smtp-mail.outlook.com:587`
- SendGrid: `smtp.sendgrid.net:587`
- Mailgun: `smtp.mailgun.org:587`

---

## 🧪 Testar o Fluxo Completo

### 1. Criar Barbearia
```bash
POST http://localhost:3001/api/admin/barbearias
{
  "nome": "Barbearia Teste",
  "cnpjCpf": "12.345.678/0001-90",
  "responsavel": "João Silva",
  "plano": "premium",
  "email": "joao@barbearia.com",
  "telefone": "(11) 99999-9999"
}
```

### 2. Verificar Email
- Se usar Ethereal: veja o link no console
- Se usar SMTP real: verifique a caixa de entrada

### 3. Ativar Conta
- Acesse o link do email
- Preencha nome, email e senha
- ✅ Conta criada!

---

## 🗄️ Visualizar Dados

```bash
npm run prisma:studio
```

Abre interface visual em: http://localhost:5555

---

## ❌ Problemas Comuns

### "Cannot find module '@prisma/client'"
```bash
npm run prisma:generate
```

### "Migration failed"
```bash
# Deletar banco e recriar (CUIDADO: apaga todos os dados!)
rm prisma/dev.db
npm run prisma:migrate
```

### "Email não está sendo enviado"
- Verifique se tem email no cadastro da barbearia
- Verifique logs do console
- Se usar Ethereal, veja o link de preview

---

## 📝 Estrutura do Banco

- `Barbearia` - Dados da barbearia
- `UsuarioDono` - Usuário dono (criado via convite)
- `Convite` - Tokens de ativação
- `Servico` - Serviços da barbearia
- `Agendamento` - Agendamentos





