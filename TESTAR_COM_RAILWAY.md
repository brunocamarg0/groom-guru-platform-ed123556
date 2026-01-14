# 🚀 Testar Painel do Dono com Backend Railway

## 📊 Configuração Atual

- **Backend:** Railway (`https://groom-guru-platform-production.up.railway.app`)
- **Frontend:** Vercel (`https://groom-guru-platform.vercel.app`) ou Local
- **API URL padrão:** `https://groom-guru-platform-production.up.railway.app/api`

---

## ✅ PASSO 1: Verificar se Backend Railway está Online

### 1.1. Testar Health Check

**Abra no navegador:**
```
https://groom-guru-platform-production.up.railway.app/api/health
```

**Resultado esperado:**
```json
{
  "status": "API is running",
  "timestamp": "...",
  "environment": "production"
}
```

**✅ Se funcionar:** Backend está online!
**❌ Se não funcionar:** Backend pode estar offline ou com problemas

---

### 1.2. Verificar Status no Railway

1. Acesse o Railway: https://railway.app
2. Vá para o projeto
3. Verifique se o serviço está **"Active"** (verde)

**Se estiver "Crashed" ou "Failed":**
- Veja os logs
- Procure por erros
- Verifique variáveis de ambiente

---

## ✅ PASSO 2: Verificar Configuração do Frontend

### 2.1. Verificar Variável VITE_API_URL

**Se estiver testando LOCALMENTE:**

**Arquivo:** `.env` (na raiz do projeto)

**Deve conter:**
```env
VITE_API_URL=https://groom-guru-platform-production.up.railway.app/api
```

**OU deixar vazio** (o código já tem fallback para Railway)

---

**Se estiver testando em PRODUÇÃO (Vercel):**

1. Acesse: https://vercel.com
2. Vá em **Settings** → **Environment Variables**
3. Verifique se existe: `VITE_API_URL`
4. Valor deve ser: `https://groom-guru-platform-production.up.railway.app/api`
5. Marque: ✅ Production, ✅ Preview, ✅ Development

**Se não existir ou estiver errado:**
- Adicione a variável
- Faça redeploy do frontend

---

## ✅ PASSO 3: Testar Login e Autenticação

### 3.1. Acessar Frontend

**Opção A: Produção (Vercel)**
```
https://groom-guru-platform.vercel.app
```

**Opção B: Local**
```bash
npm run dev
# Acesse: http://localhost:5173
```

---

### 3.2. Fazer Login

1. Acesse a página de login
2. Use credenciais de um dono cadastrado
3. Clique em "ENTRAR"

**Verificar:**
- ✅ Login funcionou?
- ✅ Redirecionou para `/dono`?
- ✅ Token foi salvo? (F12 → Application → Local Storage → token)

**Se der erro:**
- Verificar console (F12)
- Verificar se backend está online
- Verificar CORS (se erro de CORS, verificar `FRONTEND_URL` no Railway)

---

## ✅ PASSO 4: Testar Dashboard do Dono

### 4.1. Acessar Dashboard

1. Após login, acesse: `/dono` ou clique no menu
2. Abra o Console (F12 → Console)

**Verificar logs:**
- ✅ `🔄 Carregando dados do banco para barbeariaId: ...`
- ✅ `📥 Iniciando carregamento de dados do banco de dados...`
- ✅ `✅ Dados carregados do banco:`

**Verificar requisições (F12 → Network):**
- ✅ Requisição para `/api/dono/dashboard/kpis`?
- ✅ Status 200 (sucesso)?
- ✅ Dados retornando?

---

### 4.2. Verificar KPIs

**Deve aparecer:**
- ✅ Faturamento Hoje
- ✅ Agendamentos Hoje
- ✅ Cancelamentos
- ✅ Nota Média
- ✅ Faturamento Semana
- ✅ Faturamento Mês
- ✅ Clientes Recorrentes

**Se aparecerem zeros:**
- Normal se não houver dados no banco
- Criar dados de teste (profissionais, clientes, serviços, agendamentos)

---

## ✅ PASSO 5: Testar Funcionalidades CRUD

### 5.1. Testar Criar Profissional

1. Acesse: **Gestão de Profissionais**
2. Clique em **"Adicionar Profissional"**
3. Preencha o formulário:
   - Nome: "João Barbeiro"
   - Telefone: "(11) 99999-9999"
   - Email: "joao@teste.com"
   - Especialidades: ["Corte", "Barba"]
   - Comissão: 40%
4. Clique em **"Salvar"**

**Verificar:**
- ✅ Profissional foi criado?
- ✅ Aparece na lista?
- ✅ Console mostra sucesso?
- ✅ Requisição POST para `/api/dono/profissionais` com status 200?

**Se der erro:**
- Verificar console (F12)
- Verificar se token está sendo enviado
- Verificar se barbeariaId está correto

---

### 5.2. Testar Criar Cliente

1. Acesse: **Gestão de Clientes**
2. Clique em **"Novo Cliente"**
3. Preencha:
   - Nome: "Pedro Silva"
   - Telefone: "(11) 88888-8888"
   - Email: "pedro@teste.com"
4. Clique em **"Salvar"**

**Verificar:**
- ✅ Cliente foi criado?
- ✅ Aparece na lista?

---

### 5.3. Testar Criar Serviço

1. Acesse: **Gestão de Serviços**
2. Clique em **"Adicionar Serviço"**
3. Preencha:
   - Nome: "Corte Masculino"
   - Preço: R$ 30,00
   - Duração: 40 minutos
4. Clique em **"Salvar"**

**Verificar:**
- ✅ Serviço foi criado?
- ✅ Aparece na lista?

---

## ✅ PASSO 6: Testar Funcionalidades de Agendamento

### 6.1. Criar Agendamento

1. Acesse: **Agenda Inteligente**
2. Clique em **"Novo Agendamento"**
3. Preencha:
   - Cliente: Selecione um cliente
   - Profissional: Selecione um profissional
   - Serviço: Selecione um serviço
   - Data: Hoje
   - Horário: 14:00
4. Clique em **"Salvar"**

**Verificar:**
- ✅ Agendamento foi criado?
- ✅ Aparece na agenda?
- ✅ Status é "pendente"?

---

### 6.2. Confirmar Agendamento

1. Encontre um agendamento com status "pendente"
2. Clique em **"Confirmar"**

**Verificar:**
- ✅ Status mudou para "confirmado"?
- ✅ Atualizou na tela?
- ✅ Requisição PUT para `/api/agendamentos/{id}/confirmar` com status 200?

---

### 6.3. Recusar Agendamento

1. Encontre um agendamento com status "pendente"
2. Clique em **"Recusar"**
3. Informe motivo (opcional)
4. Clique em **"Confirmar"**

**Verificar:**
- ✅ Status mudou para "recusado"?
- ✅ Atualizou na tela?

---

## 🆘 Problemas Comuns e Soluções

### Problema: "Failed to fetch" ou "Network error"

**Causas possíveis:**
1. Backend Railway está offline
2. CORS bloqueando
3. URL da API está errada

**Solução:**
1. Verificar se backend está online: `https://groom-guru-platform-production.up.railway.app/api/health`
2. Verificar `FRONTEND_URL` no Railway (deve ser `https://groom-guru-platform.vercel.app`)
3. Verificar `VITE_API_URL` no frontend

---

### Problema: "Token inválido" ou 401

**Causas possíveis:**
1. JWT_SECRET diferente entre Railway e local
2. Token expirado
3. Token não está sendo enviado

**Solução:**
1. Verificar `JWT_SECRET` no Railway
2. Fazer logout e login novamente
3. Verificar se token está no localStorage
4. Verificar se Authorization header está sendo enviado (F12 → Network → Headers)

---

### Problema: "CORS error"

**Causa:**
- `FRONTEND_URL` não está configurado no Railway ou está errado

**Solução:**
1. No Railway, vá em **Variables**
2. Verifique se existe `FRONTEND_URL`
3. Valor deve ser: `https://groom-guru-platform.vercel.app`
4. Se estiver testando localmente, adicione também: `http://localhost:5173`

---

### Problema: KPIs aparecem como zero

**Causa:**
- Normal se não houver dados no banco

**Solução:**
- Criar dados de teste:
  1. Criar alguns profissionais
  2. Criar alguns clientes
  3. Criar alguns serviços
  4. Criar alguns agendamentos
  5. Confirmar alguns agendamentos
  6. Recarregar dashboard

---

## 📋 Checklist de Testes

Marque conforme testa:

### Configuração:
- [ ] Backend Railway está online (`/api/health` responde)
- [ ] Frontend acessível (Vercel ou local)
- [ ] `VITE_API_URL` configurado (ou usando fallback)
- [ ] `FRONTEND_URL` configurado no Railway

### Funcionalidades:
- [ ] Login funcionando
- [ ] Dashboard carregando
- [ ] KPIs aparecendo (mesmo que zeros)
- [ ] Criar profissional funcionando
- [ ] Criar cliente funcionando
- [ ] Criar serviço funcionando
- [ ] Criar agendamento funcionando
- [ ] Confirmar agendamento funcionando
- [ ] Recusar agendamento funcionando

---

## 🎯 Próximos Passos

**Se tudo estiver funcionando:**
1. ✅ Testar outras funcionalidades (editar, remover, etc)
2. ✅ Adicionar dados de teste
3. ✅ Verificar se KPIs atualizam com dados reais

**Se algo não funcionar:**
- Me avise qual funcionalidade
- Me envie o erro do console (F12)
- Me envie a requisição que falhou (F12 → Network)
- Me envie os logs do Railway (se possível)

---

## 💡 Dicas

**Para ver requisições em tempo real:**
- Abra F12 → Network
- Filtre por "XHR" ou "Fetch"
- Veja todas as requisições sendo feitas
- Clique em uma requisição para ver:
  - Headers (verificar Authorization)
  - Payload (dados enviados)
  - Response (resposta do servidor)

**Para ver logs do backend:**
- Acesse Railway → Logs
- Veja os logs em tempo real
- Procure por erros (linhas com "Error" ou "❌")

---

**Agora é só testar! Me avise o que aconteceu! 🚀**
