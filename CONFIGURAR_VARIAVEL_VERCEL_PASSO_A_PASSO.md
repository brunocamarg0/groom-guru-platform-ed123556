# 🔧 Configurar Variável VITE_API_URL na Vercel - Passo a Passo

## ⚠️ Problema Atual

O frontend está tentando conectar ao `localhost:3001` porque a variável `VITE_API_URL` não está configurada na Vercel.

---

## 📋 Passo a Passo Completo

### Passo 1: Acessar Vercel Dashboard

1. Acesse: **https://vercel.com/brunos-projects-9672b208/groom-guru-platform**
2. Faça login se necessário

### Passo 2: Ir em Settings

1. No menu superior, clique em **"Settings"**
2. No menu lateral esquerdo, clique em **"Environment Variables"**

### Passo 3: Adicionar Nova Variável

1. Clique no botão **"+ Add New"** (canto superior direito)
2. Preencha os campos:

   **Name (Nome):**
   ```
   VITE_API_URL
   ```
   - ⚠️ **IMPORTANTE:** Deve ser exatamente `VITE_API_URL` (maiúsculas, com underscore)

   **Value (Valor):**
   ```
   https://groom-guru-platform-production.up.railway.app/api
   ```
   - ⚠️ **IMPORTANTE:** Adicione `/api` no final da URL
   - ⚠️ **IMPORTANTE:** Use `https://` (não `http://`)

   **Environments (Ambientes):**
   - ✅ Marque **Production**
   - ✅ Marque **Preview**
   - ✅ Marque **Development**

3. Clique em **"Save"** (Salvar)

### Passo 4: Verificar Variável Adicionada

Você deve ver a variável na lista:
- ✅ `VITE_API_URL` = `https://groom-guru-platform-production.up.railway.app/api`

### Passo 5: Fazer Redeploy (CRUCIAL!)

⚠️ **IMPORTANTE:** Variáveis de ambiente só funcionam após redeploy!

1. No menu superior, clique em **"Deployments"**
2. Encontre o último deploy (deve estar no topo)
3. Clique nos **3 pontinhos** (⋯) à direita do deploy
4. Clique em **"Redeploy"**
5. Confirme clicando em **"Redeploy"** novamente
6. Aguarde o deploy terminar (2-3 minutos)

### Passo 6: Verificar Deploy

1. Aguarde até o status ficar **"Ready"** (verde)
2. Clique no deploy para ver os logs
3. Procure por mensagens de sucesso

---

## ✅ Checklist

- [ ] Variável `VITE_API_URL` adicionada na Vercel
- [ ] Valor: `https://groom-guru-platform-production.up.railway.app/api`
- [ ] Marcações: Production, Preview, Development
- [ ] Redeploy feito após adicionar variável
- [ ] Deploy concluído com sucesso

---

## 🧪 Testar Após Configurar

1. Acesse: **https://groom-guru-platform.vercel.app**
2. Vá em **"Cadastro"** ou `/cadastro?tipo=dono`
3. Preencha o formulário
4. Clique em **"CADASTRAR"**
5. Deve funcionar! ✅

---

## 🆘 Se Ainda Não Funcionar

### Erro: "Failed to fetch"
- Verifique se a variável está com o nome correto: `VITE_API_URL`
- Verifique se o valor tem `/api` no final
- Verifique se fez **redeploy** após adicionar a variável

### Erro: "Cannot connect to server"
- Teste o backend diretamente: `https://groom-guru-platform-production.up.railway.app/api/health`
- Se não funcionar, verifique se o backend está "Active" no Railway

### Variável não aparece no código
- Variáveis do Vercel só funcionam após **redeploy**
- Certifique-se de ter feito redeploy após adicionar a variável

---

## 📸 Onde Encontrar no Vercel

### Settings → Environment Variables

```
┌─────────────────────────────────────┐
│  Environment Variables              │
├─────────────────────────────────────┤
│  + Add New                          │
│                                     │
│  Name: [VITE_API_URL          ]    │
│  Value: [https://...railway.../api] │
│                                     │
│  ☑ Production                       │
│  ☑ Preview                          │
│  ☑ Development                      │
│                                     │
│  [Cancel]  [Save]                   │
└─────────────────────────────────────┘
```

---

**Siga esses passos e o frontend vai conectar ao backend no Railway!** 🚀

