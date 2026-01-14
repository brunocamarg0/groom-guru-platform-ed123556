# 🎯 Guia Passo a Passo: Deixar Painel do Dono 100% Funcional

## 📋 Diagnóstico Inicial

Antes de começar, vamos verificar o que já está configurado:

### ✅ O que JÁ está implementado:
- ✅ Backend completo com todos os endpoints
- ✅ Frontend integrado com API real
- ✅ DonoContext carregando dados do banco
- ✅ Todas as rotas do painel do dono criadas
- ✅ Componentes de UI prontos

### 🔧 O que PRECISA ser configurado:
1. Banco de dados (Supabase ou PostgreSQL)
2. Variáveis de ambiente (.env)
3. Migrações do Prisma
4. Teste de todas as funcionalidades

---

## 🚀 PASSO 1: Verificar Configuração do Banco de Dados

### 1.1. Verificar se DATABASE_URL está configurado

**Arquivo:** `backend/.env`

O arquivo deve conter:
```env
DATABASE_URL="postgresql://usuario:senha@host:porta/banco"
```

**Pergunta para você:**
- ✅ Você já tem um banco de dados configurado? (Supabase, Railway, ou outro PostgreSQL)
- ✅ Se sim, qual é a URL de conexão?
- ✅ Se não, quer que eu te ajude a configurar?

---

## 🚀 PASSO 2: Verificar Configuração do Backend

### 2.1. Verificar arquivo `backend/.env`

O arquivo deve conter:
```env
# Banco de Dados
DATABASE_URL="postgresql://..."

# Servidor
PORT=3001
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:5173

# JWT Secret (gerar um token aleatório)
JWT_SECRET=seu_token_aqui

# Session Secret (gerar outro token)
SESSION_SECRET=seu_token_aqui
```

**Pergunta para você:**
- ✅ O arquivo `backend/.env` existe?
- ✅ As variáveis estão preenchidas?
- ✅ Precisa gerar novos tokens JWT_SECRET e SESSION_SECRET?

---

## 🚀 PASSO 3: Verificar Configuração do Frontend

### 3.1. Verificar arquivo `.env` na raiz

O arquivo deve conter:
```env
VITE_API_URL=http://localhost:3001/api
```

**Pergunta para você:**
- ✅ O arquivo `.env` na raiz existe?
- ✅ A variável `VITE_API_URL` está configurada?

---

## 🚀 PASSO 4: Instalar Dependências e Configurar Prisma

### 4.1. Instalar dependências do backend
```bash
cd backend
npm install
```

### 4.2. Gerar Prisma Client
```bash
npx prisma generate
```

### 4.3. Executar migrações (criar tabelas no banco)
```bash
npx prisma migrate dev --name init
```

**Pergunta para você:**
- ✅ As dependências estão instaladas?
- ✅ As migrações foram executadas com sucesso?

---

## 🚀 PASSO 5: Iniciar o Backend

### 5.1. Iniciar servidor backend
```bash
cd backend
npm run dev
```

**Verificar:**
- ✅ Servidor iniciou na porta 3001?
- ✅ Mensagem: "Server is running on http://localhost:3001"?
- ✅ Testar: http://localhost:3001/api/health

**Pergunta para você:**
- ✅ O backend está rodando?
- ✅ O endpoint `/api/health` responde?

---

## 🚀 PASSO 6: Iniciar o Frontend

### 6.1. Instalar dependências do frontend (se necessário)
```bash
npm install
```

### 6.2. Iniciar servidor frontend
```bash
npm run dev
```

**Verificar:**
- ✅ Servidor iniciou na porta 5173?
- ✅ Acessar: http://localhost:5173

**Pergunta para você:**
- ✅ O frontend está rodando?
- ✅ Consegue acessar a página de login?

---

## 🚀 PASSO 7: Testar Login e Autenticação

### 7.1. Fazer login no sistema
- Acesse: http://localhost:5173/login
- Faça login com uma conta de dono

**Verificar:**
- ✅ Login funcionou?
- ✅ Redirecionou para o painel do dono?
- ✅ Token foi salvo no localStorage?

**Pergunta para você:**
- ✅ Conseguiu fazer login?
- ✅ Se não, qual erro apareceu?

---

## 🚀 PASSO 8: Testar Carregamento de Dados

### 8.1. Verificar Dashboard
- Acesse: http://localhost:5173/dono
- Verifique se os KPIs aparecem

**Verificar:**
- ✅ KPIs carregaram? (Faturamento, Agendamentos, etc)
- ✅ Agendamentos de hoje aparecem?
- ✅ Console do navegador mostra erros?

**Pergunta para você:**
- ✅ Os dados estão aparecendo?
- ✅ Se não, qual erro aparece no console?

---

## 🚀 PASSO 9: Testar Funcionalidades CRUD

### 9.1. Testar Gestão de Profissionais
- Acesse: Gestão de Profissionais
- Clique em "Adicionar Profissional"
- Preencha o formulário e salve

**Verificar:**
- ✅ Profissional foi criado?
- ✅ Aparece na lista?
- ✅ Pode editar?
- ✅ Pode remover?

### 9.2. Testar Gestão de Clientes
- Acesse: Gestão de Clientes
- Clique em "Novo Cliente"
- Preencha o formulário e salve

**Verificar:**
- ✅ Cliente foi criado?
- ✅ Aparece na lista?

### 9.3. Testar Gestão de Serviços
- Acesse: Gestão de Serviços
- Clique em "Adicionar Serviço"
- Preencha o formulário e salve

**Verificar:**
- ✅ Serviço foi criado?
- ✅ Aparece na lista?

**Pergunta para você:**
- ✅ Qual funcionalidade está funcionando?
- ✅ Qual está com problema?

---

## 🚀 PASSO 10: Testar Funcionalidades de Agendamento

### 10.1. Criar Agendamento
- Acesse: Agenda Inteligente
- Clique em "Novo Agendamento"
- Preencha os dados e salve

**Verificar:**
- ✅ Agendamento foi criado?
- ✅ Aparece na agenda?

### 10.2. Confirmar Agendamento
- Encontre um agendamento pendente
- Clique em "Confirmar"

**Verificar:**
- ✅ Status mudou para "confirmado"?

### 10.3. Recusar Agendamento
- Encontre um agendamento pendente
- Clique em "Recusar"
- Informe o motivo

**Verificar:**
- ✅ Status mudou para "recusado"?

**Pergunta para você:**
- ✅ As funcionalidades de agendamento estão funcionando?

---

## 🆘 Problemas Comuns e Soluções

### Erro: "Can't reach database server"
**Solução:**
1. Verificar se `DATABASE_URL` está correto no `backend/.env`
2. Verificar se a senha está correta
3. Verificar se o banco está acessível

### Erro: "Token inválido"
**Solução:**
1. Verificar se `JWT_SECRET` está configurado
2. Fazer logout e login novamente
3. Verificar se o token está sendo enviado nas requisições

### Erro: "Failed to fetch" ou "Network error"
**Solução:**
1. Verificar se o backend está rodando (porta 3001)
2. Verificar se `VITE_API_URL` está correto no `.env` da raiz
3. Verificar CORS no backend

### Erro: "Migration failed"
**Solução:**
1. Verificar conexão com banco
2. Verificar se o banco está vazio ou se precisa resetar
3. Executar: `npx prisma migrate reset` (CUIDADO: apaga dados!)

---

## 📝 Checklist Final

Marque conforme completa:

### Configuração:
- [ ] Banco de dados configurado
- [ ] `backend/.env` configurado
- [ ] `.env` na raiz configurado
- [ ] Dependências instaladas
- [ ] Migrações executadas

### Servidores:
- [ ] Backend rodando (porta 3001)
- [ ] Frontend rodando (porta 5173)
- [ ] `/api/health` respondendo

### Funcionalidades:
- [ ] Login funcionando
- [ ] Dashboard carregando dados
- [ ] Criar profissional funcionando
- [ ] Criar cliente funcionando
- [ ] Criar serviço funcionando
- [ ] Criar agendamento funcionando
- [ ] Confirmar agendamento funcionando
- [ ] Recusar agendamento funcionando

---

## 🎯 Próximos Passos

Após completar todos os passos acima, o painel do dono estará 100% funcional!

Se encontrar algum problema em qualquer passo, me avise qual passo e qual erro apareceu que eu te ajudo a resolver! 🚀
