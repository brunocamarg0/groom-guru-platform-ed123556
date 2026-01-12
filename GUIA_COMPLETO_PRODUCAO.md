# 🚀 Guia Completo: Tornar o Painel do Dono Totalmente Funcional

## 📋 Checklist de Implementação

### ✅ O que JÁ está implementado:
- ✅ Backend com Express e Prisma
- ✅ Autenticação (JWT)
- ✅ Estrutura de banco de dados (Prisma Schema)
- ✅ Rotas de agendamentos básicas
- ✅ Rotas de barbearias
- ✅ Frontend React com TypeScript

### ❌ O que PRECISA ser implementado:

## 1. 🗄️ BANCO DE DADOS EM NUVEM (GRATUITO)

### Opção Recomendada: **Supabase** (PostgreSQL)

#### Passo 1: Criar conta e projeto
1. Acesse: https://supabase.com
2. Clique em "Start your project"
3. Faça login com GitHub/Google
4. Crie novo projeto:
   - Nome: `groom-guru-production`
   - Senha: (anote bem! você precisará)
   - Região: **South America (São Paulo)** para melhor performance no Brasil
   - Aguarde ~2 minutos para criação

#### Passo 2: Obter URL de conexão
1. No dashboard do Supabase → **Settings** → **Database**
2. Role até **Connection string**
3. Selecione **URI** (não Session mode)
4. Copie a string que começa com `postgresql://...`
5. **IMPORTANTE:** Substitua `[YOUR-PASSWORD]` pela senha que você criou

#### Passo 3: Atualizar Prisma Schema

Edite `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Mudar de "sqlite" para "postgresql"
  url      = env("DATABASE_URL")
}
```

#### Passo 4: Adicionar modelos faltantes

Adicione ao final do `schema.prisma` (antes do último `}`):

```prisma
// Profissional da barbearia
model Profissional {
  id          String        @id @default(uuid())
  nome        String
  email       String?
  telefone    String
  foto        String?
  especialidades String[]   @default([]) // Array de strings
  comissaoTipo String       @default("percentual") // percentual, fixo
  comissaoValor Float       @default(0)
  ativo       Boolean       @default(true)
  dataAdmissao DateTime     @default(now())
  
  // Relacionamentos
  barbearia   Barbearia     @relation(fields: [barbeariaId], references: [id], onDelete: Cascade)
  barbeariaId String
  agendamentos AgendamentoProfissional[]
  
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

// Relacionamento entre Agendamento e Profissional
model AgendamentoProfissional {
  id            String      @id @default(uuid())
  agendamento   Agendamento @relation(fields: [agendamentoId], references: [id], onDelete: Cascade)
  agendamentoId String
  profissional  Profissional @relation(fields: [profissionalId], references: [id], onDelete: Cascade)
  profissionalId String
  
  createdAt     DateTime    @default(now())
  
  @@unique([agendamentoId, profissionalId])
}

// Produto da barbearia
model Produto {
  id            String      @id @default(uuid())
  nome          String
  descricao     String?
  categoria     String      // pomada, oleo, kit, outro
  preco         Float
  estoque       Int         @default(0)
  estoqueMinimo Int         @default(0)
  ativo         Boolean     @default(true)
  foto          String?
  
  barbearia     Barbearia  @relation(fields: [barbeariaId], references: [id], onDelete: Cascade)
  barbeariaId   String
  
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

// Promoção da barbearia
model Promocao {
  id            String      @id @default(uuid())
  nome          String
  tipo          String      // desconto_percentual, desconto_fixo, cashback, pontos
  valor         Float
  validoDe      DateTime
  validoAte     DateTime
  ativo         Boolean     @default(true)
  aplicavelA   String      @default("todos") // todos, servico, horario, cliente_vip
  servicoId    String?
  horarioInicio String?
  horarioFim   String?
  
  barbearia     Barbearia  @relation(fields: [barbeariaId], references: [id], onDelete: Cascade)
  barbeariaId   String
  
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

// Avaliação de agendamento
model Avaliacao {
  id                String      @id @default(uuid())
  agendamento       Agendamento @relation(fields: [agendamentoId], references: [id], onDelete: Cascade)
  agendamentoId     String      @unique
  cliente           Cliente     @relation(fields: [clienteId], references: [id], onDelete: Cascade)
  clienteId         String
  notaProfissional  Int         // 1-5
  notaAtendimento   Int         // 1-5
  notaAmbiente      Int         // 1-5
  comentario        String?
  resposta          String?     // Resposta do dono
  respondidoEm      DateTime?
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}

// Notificação do sistema
model Notificacao {
  id          String      @id @default(uuid())
  tipo        String      // agendamento, pagamento, avaliacao, estoque, sistema
  titulo      String
  mensagem    String
  lida        Boolean     @default(false)
  data        DateTime    @default(now())
  urlAcao     String?
  labelAcao   String?
  
  // Relacionamento com barbearia (notificações do dono)
  barbearia   Barbearia?  @relation(fields: [barbeariaId], references: [id], onDelete: Cascade)
  barbeariaId String?
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

// Pagamento de agendamento
model Pagamento {
  id            String      @id @default(uuid())
  agendamento   Agendamento @relation(fields: [agendamentoId], references: [id], onDelete: Cascade)
  agendamentoId String      @unique
  valor         Float
  metodo        String      // pix, cartao_credito, cartao_debito, dinheiro
  status        String      @default("pendente") // pago, pendente, reembolsado
  taxaGateway   Float?      @default(0)
  dataPagamento DateTime?
  dataVencimento DateTime?
  
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}
```

E atualize os modelos existentes:

```prisma
model Barbearia {
  // ... campos existentes ...
  
  // Adicionar relacionamentos:
  profissionais Profissional[]
  produtos      Produto[]
  promocoes      Promocao[]
  notificacoes  Notificacao[]
}

model Agendamento {
  // ... campos existentes ...
  
  // Adicionar relacionamentos:
  profissionais AgendamentoProfissional[]
  avaliacao     Avaliacao?
  pagamento     Pagamento?
  
  // Adicionar campo de horário (string HH:mm)
  horario       String      // Ex: "14:00"
}
```

#### Passo 5: Criar arquivo .env no backend

Crie `backend/.env`:

```env
# Banco de Dados (Supabase)
DATABASE_URL="postgresql://postgres:[SUA_SENHA]@db.xxxxx.supabase.co:5432/postgres?schema=public"

# Servidor
PORT=3001
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:5173

# JWT Secret (gere um token aleatório)
JWT_SECRET=seu-token-super-secreto-aqui-mude-em-producao

# Session Secret
SESSION_SECRET=seu-session-secret-aqui

# Email (opcional - para notificações)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app

# WhatsApp (opcional - para notificações)
WHATSAPP_API_KEY=sua-chave-api
```

**⚠️ IMPORTANTE:** 
- Substitua `[SUA_SENHA]` pela senha do Supabase
- Gere um JWT_SECRET aleatório (pode usar: `openssl rand -base64 32`)
- NUNCA commite o arquivo `.env` no Git!

#### Passo 6: Executar migrações

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name add_profissionais_produtos_promocoes
```

---

## 2. 🔧 BACKEND - Endpoints Necessários para o Painel do Dono

### Endpoints que PRECISAM ser criados:

#### 2.1. Endpoints de Profissionais
- `GET /api/dono/profissionais` - Listar profissionais da barbearia
- `POST /api/dono/profissionais` - Criar profissional
- `PUT /api/dono/profissionais/:id` - Atualizar profissional
- `DELETE /api/dono/profissionais/:id` - Remover profissional
- `PUT /api/dono/profissionais/:id/toggle` - Ativar/desativar

#### 2.2. Endpoints de Clientes
- `GET /api/dono/clientes` - Listar clientes
- `POST /api/dono/clientes` - Criar cliente
- `PUT /api/dono/clientes/:id` - Atualizar cliente
- `GET /api/dono/clientes/:id` - Buscar cliente
- `PUT /api/dono/clientes/:id/vip` - Marcar como VIP

#### 2.3. Endpoints de Serviços
- `GET /api/dono/servicos` - Listar serviços
- `POST /api/dono/servicos` - Criar serviço
- `PUT /api/dono/servicos/:id` - Atualizar serviço
- `DELETE /api/dono/servicos/:id` - Remover serviço
- `PUT /api/dono/servicos/:id/toggle` - Ativar/desativar

#### 2.4. Endpoints de Agendamentos (melhorar)
- `GET /api/dono/agendamentos` - Listar agendamentos do dono (com filtros)
- `POST /api/dono/agendamentos` - Criar agendamento
- `PUT /api/dono/agendamentos/:id` - Atualizar agendamento
- `GET /api/dono/agendamentos/disponibilidade` - Verificar horários disponíveis

#### 2.5. Endpoints de Produtos
- `GET /api/dono/produtos` - Listar produtos
- `POST /api/dono/produtos` - Criar produto
- `PUT /api/dono/produtos/:id` - Atualizar produto
- `DELETE /api/dono/produtos/:id` - Remover produto
- `PUT /api/dono/produtos/:id/estoque` - Atualizar estoque

#### 2.6. Endpoints de Promoções
- `GET /api/dono/promocoes` - Listar promoções
- `POST /api/dono/promocoes` - Criar promoção
- `PUT /api/dono/promocoes/:id` - Atualizar promoção
- `DELETE /api/dono/promocoes/:id` - Remover promoção

#### 2.7. Endpoints de Dashboard/KPIs
- `GET /api/dono/dashboard/kpis` - Obter KPIs (faturamento, agendamentos, etc)
- `GET /api/dono/dashboard/relatorios` - Gerar relatórios

#### 2.8. Endpoints de Notificações
- `GET /api/dono/notificacoes` - Listar notificações
- `PUT /api/dono/notificacoes/:id/lida` - Marcar como lida

#### 2.9. Endpoints de Configurações
- `GET /api/dono/configuracoes` - Obter configurações
- `PUT /api/dono/configuracoes` - Atualizar configurações

---

## 3. 🔐 AUTENTICAÇÃO E AUTORIZAÇÃO

### Middleware de Autenticação

Criar `backend/src/middleware/auth.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export interface AuthRequest extends Request {
  userId?: string;
  userType?: 'dono' | 'admin' | 'cliente';
  barbeariaId?: string;
}

export async function autenticarDono(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Buscar usuário dono
    const dono = await prisma.usuarioDono.findUnique({
      where: { id: decoded.userId },
      include: { barbearia: true },
    });

    if (!dono || !dono.ativo) {
      return res.status(401).json({ error: 'Usuário inválido ou inativo' });
    }

    req.userId = dono.id;
    req.userType = 'dono';
    req.barbeariaId = dono.barbeariaId;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}
```

---

## 4. 📦 DEPENDÊNCIAS NECESSÁRIAS

### Backend (`backend/package.json`):

```json
{
  "dependencies": {
    "@prisma/client": "^5.20.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.21.1",
    "dotenv": "^16.4.5",
    "jsonwebtoken": "^9.0.2",
    "node-cron": "^3.0.3"
  }
}
```

### Instalar dependências:

```bash
cd backend
npm install
```

---

## 5. 🔄 INTEGRAÇÃO FRONTEND-BACKEND

### Atualizar Context do Dono

O `DonoContext` precisa fazer chamadas reais à API em vez de usar dados mockados.

### Criar serviço de API

Criar `src/services/api.ts`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro na requisição');
  }

  return response.json();
}
```

---

## 6. 📝 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Setup Básico (1-2 horas)
- [ ] Criar conta no Supabase
- [ ] Configurar DATABASE_URL
- [ ] Atualizar Prisma schema
- [ ] Executar migrações
- [ ] Testar conexão com banco

### Fase 2: Backend - Endpoints Essenciais (4-6 horas)
- [ ] Criar middleware de autenticação
- [ ] Implementar endpoints de profissionais
- [ ] Implementar endpoints de clientes
- [ ] Implementar endpoints de serviços
- [ ] Melhorar endpoints de agendamentos
- [ ] Implementar verificação de disponibilidade

### Fase 3: Backend - Funcionalidades Extras (2-3 horas)
- [ ] Endpoints de produtos
- [ ] Endpoints de promoções
- [ ] Endpoints de dashboard/KPIs
- [ ] Endpoints de notificações
- [ ] Endpoints de configurações

### Fase 4: Integração Frontend (3-4 horas)
- [ ] Atualizar DonoContext para usar API real
- [ ] Criar serviços de API
- [ ] Substituir dados mockados por chamadas reais
- [ ] Implementar tratamento de erros
- [ ] Adicionar loading states

### Fase 5: Testes e Ajustes (2-3 horas)
- [ ] Testar todas as funcionalidades
- [ ] Corrigir bugs
- [ ] Otimizar performance
- [ ] Documentar APIs

---

## 7. 🚀 DEPLOY EM PRODUÇÃO

### Opções Gratuitas:

1. **Vercel** (Frontend + Backend Serverless)
   - Frontend: Deploy automático do React
   - Backend: Serverless Functions
   - Grátis até certo limite

2. **Railway** (Backend completo)
   - Deploy do backend Node.js
   - $5 créditos grátis/mês
   - Fácil de usar

3. **Render** (Backend completo)
   - Plano gratuito disponível
   - Auto-deploy do GitHub

---

## 8. 📋 PRÓXIMOS PASSOS IMEDIATOS

1. **AGORA:** Configurar Supabase e atualizar Prisma
2. **DEPOIS:** Implementar endpoints de profissionais e clientes
3. **DEPOIS:** Integrar frontend com backend real
4. **DEPOIS:** Testar tudo funcionando
5. **FINAL:** Deploy em produção

---

## 🆘 Precisa de Ajuda?

Se tiver dúvidas em qualquer etapa, me avise que eu ajudo a implementar!
