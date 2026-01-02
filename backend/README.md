# 🚀 Groom Guru - Backend API

Backend da plataforma Groom Guru com sistema de convites para ativação de contas de donos de barbearias.

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL
- npm ou yarn

## 🛠️ Instalação

1. Instale as dependências:
```bash
cd backend
npm install
```

2. Configure o banco de dados:
   - Crie um arquivo `.env` baseado no `.env.example`
   - Configure a `DATABASE_URL` com suas credenciais do PostgreSQL

3. Execute as migrações do Prisma:
```bash
npm run prisma:migrate
```

4. Gere o Prisma Client:
```bash
npm run prisma:generate
```

## 🚀 Executar

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

## 📚 Rotas da API

### Health Check
- `GET /api/health` - Verifica se a API está rodando

### Admin - Barbearias
- `GET /api/admin/barbearias` - Listar todas as barbearias
- `GET /api/admin/barbearias/:id` - Buscar barbearia por ID
- `POST /api/admin/barbearias` - Criar nova barbearia
- `PUT /api/admin/barbearias/:id` - Atualizar barbearia
- `PATCH /api/admin/barbearias/:id/status` - Alterar status
- `DELETE /api/admin/barbearias/:id` - Deletar barbearia

### Admin - Convites
- `POST /api/admin/barbearias/:barbeariaId/convite` - Gerar convite
- `GET /api/admin/barbearias/:barbeariaId/convites` - Listar convites

### Ativação de Conta (Público)
- `GET /api/validar-token?token=xxx` - Validar token de convite
- `POST /api/ativar-conta` - Ativar conta do dono

## 🔐 Fluxo de Convite

1. **Admin cria barbearia** → `POST /api/admin/barbearias`
2. **Admin gera convite** → `POST /api/admin/barbearias/:id/convite`
3. **Sistema retorna link** → `https://app.com/ativar-conta?token=xxx`
4. **Dono acessa link** → Valida token
5. **Dono cria conta** → `POST /api/ativar-conta`
6. **Conta ativada** → Dono pode fazer login

## 📝 Exemplo de Uso

### Criar Barbearia
```bash
POST /api/admin/barbearias
{
  "nome": "Barbearia do João",
  "cnpjCpf": "12.345.678/0001-90",
  "responsavel": "João Silva",
  "plano": "premium",
  "email": "contato@barbearia.com",
  "telefone": "(11) 99999-9999"
}
```

### Gerar Convite
```bash
POST /api/admin/barbearias/:barbeariaId/convite
{
  "email": "dono@barbearia.com",
  "diasValidade": 7
}
```

### Ativar Conta
```bash
POST /api/ativar-conta
{
  "token": "abc123...",
  "nome": "João Silva",
  "email": "dono@barbearia.com",
  "senha": "senhaSegura123"
}
```

## 🗄️ Banco de Dados

Use o Prisma Studio para visualizar os dados:
```bash
npm run prisma:studio
```

## 📦 Estrutura do Projeto

```
backend/
├── prisma/
│   └── schema.prisma          # Schema do banco de dados
├── src/
│   ├── controllers/           # Controllers das rotas
│   ├── routes/                # Definição das rotas
│   ├── lib/                   # Bibliotecas (Prisma, etc)
│   ├── utils/                 # Utilitários
│   └── app.ts                 # Aplicação principal
└── package.json
```

