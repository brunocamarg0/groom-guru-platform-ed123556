# ✅ Solução: Erro de CORS no Railway

## 🔴 Problema Identificado

O erro no console mostra:
```
Access to fetch at 'https://groom-guru-platform-production.up.railway.app/api/...' 
from origin 'https://groom-guru-platform.vercel.app' 
has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present
```

**Causa:** O backend não está permitindo requisições do frontend (CORS bloqueado).

---

## ✅ Correção Aplicada

### 1. Código Atualizado

Atualizei o `backend/src/app.ts` para:
- ✅ Permitir requisições do Vercel (`https://groom-guru-platform.vercel.app`)
- ✅ Tratar preflight requests (OPTIONS)
- ✅ Adicionar headers CORS necessários
- ✅ Permitir métodos HTTP necessários

### 2. Variável de Ambiente Necessária

No Railway, você precisa ter a variável:

**Name:** `FRONTEND_URL`  
**Value:** `https://groom-guru-platform.vercel.app`

---

## 📋 Passos para Aplicar a Correção

### Passo 1: Verificar Variável no Railway

1. No Railway, vá em **Variables**
2. Procure por `FRONTEND_URL`
3. Se não existir, adicione:
   - **Name:** `FRONTEND_URL`
   - **Value:** `https://groom-guru-platform.vercel.app`
4. Salve

### Passo 2: Aguardar Deploy Automático

O Railway vai detectar o novo commit e fazer deploy automaticamente (2-3 minutos).

### Passo 3: Verificar se Funcionou

1. Aguarde o deploy terminar
2. No Railway, veja os logs para confirmar que iniciou
3. Teste novamente o cadastro no frontend
4. O erro de CORS não deve mais aparecer

---

## 🧪 Teste Rápido

Após o deploy, teste no console do navegador (F12):

```javascript
fetch('https://groom-guru-platform-production.up.railway.app/api/health', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
})
  .then(r => r.json())
  .then(data => console.log('✅ CORS OK:', data))
  .catch(error => console.error('❌ Erro:', error));
```

**Se aparecer `✅ CORS OK`**, está funcionando!

---

## ✅ Checklist

- [ ] Código atualizado e commitado
- [ ] Variável `FRONTEND_URL` configurada no Railway
- [ ] Railway fez deploy automaticamente
- [ ] Teste no console funcionou
- [ ] Cadastro funcionando no frontend

---

## 🆘 Se Ainda Der Erro

### Erro: "CORS policy" ainda aparece

1. Verifique se `FRONTEND_URL` está configurada no Railway
2. Verifique se o deploy do Railway terminou
3. Limpe o cache do navegador (Ctrl+Shift+R)
4. Teste novamente

### Erro: "Backend offline"

1. Verifique se o serviço está "Active" no Railway
2. Veja os logs no Railway
3. Verifique se todas as variáveis estão configuradas

---

**Aguarde o deploy do Railway e teste novamente!** 🚀

