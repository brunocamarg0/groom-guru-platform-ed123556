# 🗄️ Configuração do Banco de Dados

## ⚠️ IMPORTANTE: O banco de dados é necessário!

O sistema usa **SQLite** (banco de dados em arquivo) para armazenar:
- ✅ Cadastros de usuários (donos de barbearia)
- ✅ Dados das barbearias
- ✅ Agendamentos
- ✅ Serviços
- ✅ E muito mais!

## 🚀 Como Configurar (3 passos simples)

### 1️⃣ Navegue até a pasta backend
```bash
cd backend
```

### 2️⃣ Execute o script de configuração automática
```bash
node scripts/setup-db.js
```

Este script vai:
- ✅ Criar/verificar o arquivo `.env`
- ✅ Criar o banco de dados SQLite
- ✅ Executar todas as migrações (criar tabelas)
- ✅ Gerar o Prisma Client

### 3️⃣ Inicie o servidor backend
```bash
npm run dev
```

O servidor deve iniciar em: `http://localhost:3001`

---

## 🔍 Verificar se está funcionando

Após configurar, você pode verificar se o banco foi criado:

```bash
# Ver se o arquivo do banco existe
ls prisma/dev.db
```

Ou abrir o Prisma Studio para ver os dados:
```bash
npm run prisma:studio
```

---

## ❌ Se der erro

### Erro: "Cannot find module '@prisma/client'"
```bash
npm install
npm run prisma:generate
```

### Erro: "Migration failed"
```bash
# Deletar banco antigo (CUIDADO: apaga dados!)
rm prisma/dev.db

# Recriar
node scripts/setup-db.js
```

### Erro: "npx não é reconhecido"
Instale o Node.js: https://nodejs.org/

---

## 📝 Estrutura do Banco

O banco SQLite será criado em: `backend/prisma/dev.db`

**Tabelas criadas:**
- `Barbearia` - Dados das barbearias
- `UsuarioDono` - Usuários donos de barbearia
- `UsuarioAdmin` - Administradores do sistema
- `Cliente` - Clientes cadastrados
- `Agendamento` - Agendamentos
- `Servico` - Serviços oferecidos
- `Convite` - Convites de ativação
- `SolicitacaoCadastro` - Solicitações pendentes

---

## ✅ Pronto!

Após executar `node scripts/setup-db.js`, o banco estará configurado e você poderá:
- ✅ Cadastrar novos usuários
- ✅ Criar barbearias
- ✅ Fazer login
- ✅ Usar todas as funcionalidades do sistema

**Lembre-se:** O backend precisa estar rodando (`npm run dev`) para o frontend funcionar!
