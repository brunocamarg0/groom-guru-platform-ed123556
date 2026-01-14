# 🚀 Iniciar Teste Rápido - Painel do Dono

## ✅ Backend Iniciando...

O backend está sendo iniciado em background. Aguarde alguns segundos...

---

## 📋 Próximos Passos Imediatos

### 1. Verificar se Backend Iniciou

**Aguardar ~10-15 segundos** e então testar:

**Opção A: Navegador**
- Abra: `http://localhost:3001/api/health`
- Deve retornar JSON: `{"status": "API is running", ...}`

**Opção B: Terminal**
```bash
curl http://localhost:3001/api/health
```

**✅ Se funcionar:** Backend está rodando!
**❌ Se não funcionar:** Verificar logs do terminal

---

### 2. Iniciar Frontend (em outro terminal)

**Abrir um NOVO terminal** (deixe o backend rodando no primeiro):

```bash
# Na raiz do projeto
npm run dev
```

**Aguardar mensagem:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

---

### 3. Testar o Sistema

#### 3.1. Acessar Frontend
- Abra: `http://localhost:5173`
- Deve carregar a página inicial

#### 3.2. Fazer Login
- Clique em "Login" ou acesse: `http://localhost:5173/login`
- Use credenciais de um dono cadastrado
- Clique em "ENTRAR"

**Verificar:**
- ✅ Login funcionou?
- ✅ Redirecionou para `/dono`?
- ✅ Token no localStorage? (F12 → Application → Local Storage → token)

#### 3.3. Verificar Dashboard
- Acesse: `http://localhost:5173/dono`
- Abra o Console (F12 → Console)
- Verifique se aparecem logs:
  - `🔄 Carregando dados do banco para barbeariaId: ...`
  - `📥 Iniciando carregamento de dados do banco de dados...`
  - `✅ Dados carregados do banco:`

**Verificar se aparecem:**
- ✅ KPIs (Faturamento, Agendamentos, etc)
- ✅ Agendamentos de hoje
- ✅ Sem erros no console

---

## 🔍 Verificar Logs do Backend

**Se algo não funcionar, verificar logs:**

Os logs do backend estão sendo salvos em:
```
C:\Users\terceiro_rcc02\.cursor\projects\...\terminals\940512.txt
```

**Ou verificar no terminal onde o backend está rodando.**

**Logs importantes para verificar:**
- ✅ `Server is running on http://localhost:3001`
- ✅ `API Health: http://localhost:3001/api/health`
- ❌ Erros de conexão com banco
- ❌ Erros de autenticação

---

## 🆘 Problemas Comuns

### Backend não inicia

**Possíveis causas:**
1. Porta 3001 já está em uso
2. Erro no `.env` (DATABASE_URL, JWT_SECRET, etc)
3. Dependências não instaladas

**Solução:**
```bash
cd backend
npm install
npm run dev
```

---

### Frontend não conecta com backend

**Verificar:**
1. Backend está rodando? (`http://localhost:3001/api/health`)
2. `.env` na raiz tem `VITE_API_URL=http://localhost:3001/api`?
3. Reiniciar frontend após mudar `.env`

---

### Erro 401 (Token inválido)

**Solução:**
1. Verificar `JWT_SECRET` no `backend/.env`
2. Fazer logout e login novamente
3. Limpar localStorage (F12 → Application → Local Storage → Clear)

---

## 📝 Checklist Rápido

Marque conforme completa:

- [ ] Backend iniciou (`/api/health` responde)
- [ ] Frontend iniciou (porta 5173)
- [ ] Conseguiu fazer login
- [ ] Dashboard carrega
- [ ] KPIs aparecem (mesmo que zeros)
- [ ] Sem erros no console

---

## 🎯 Após Verificar o Básico

**Se tudo estiver funcionando:**
1. Testar criar um profissional
2. Testar criar um cliente
3. Testar criar um serviço
4. Testar criar um agendamento

**Se algo não funcionar:**
- Me avise qual funcionalidade
- Me envie o erro do console
- Me envie os logs do backend

---

## 💡 Dica

**Para ver logs em tempo real:**
- Abra o terminal onde o backend está rodando
- Veja as mensagens aparecendo
- Procure por erros (linhas com ❌ ou "Error")

**Para ver requisições no frontend:**
- Abra F12 → Network
- Veja as requisições sendo feitas
- Verifique status (200 = sucesso, 401 = não autorizado, 500 = erro servidor)

---

**Agora é só testar! Me avise o que aconteceu! 🚀**
