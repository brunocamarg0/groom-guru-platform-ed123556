# 🔧 Como Configurar Token no Vercel - Passo a Passo

## ❌ Diagnóstico Atual

O teste confirmou que as variáveis **NÃO estão configuradas** no Vercel:
- `MERCADOPAGO_ACCESS_TOKEN`: ❌ Não configurado
- `VITE_MERCADOPAGO_ACCESS_TOKEN`: ❌ Não configurado

## ✅ Solução: Configurar Variáveis no Vercel

### Passo 1: Acessar o Vercel

1. Acesse: https://vercel.com/brunos-projects-9672b208/groom-guru-platform
2. Faça login (se necessário)
3. Você verá o dashboard do projeto

### Passo 2: Ir para Settings (Configurações)

1. No menu superior, clique em **Settings** (ou "Configurações")
2. No menu lateral esquerdo, clique em **Environment Variables** (Variáveis de Ambiente)

### Passo 3: Adicionar Variável 1

1. Clique no botão **"Add New"** (ou "Adicionar Nova")
2. Preencha os campos:

   **Name (Nome):**
   ```
   MERCADOPAGO_ACCESS_TOKEN
   ```
   ⚠️ **Copie exatamente assim!** (maiúsculas, com underscore)

   **Value (Valor):**
   ```
   TEST-d450f022-fc2f-4ae2-8629-e5f723e5cf86
   ```
   ⚠️ **Copie exatamente assim!** (sem espaços antes ou depois)

   **Environments (Ambientes):**
   - ✅ Marque **Production** (Produção)
   - ✅ Marque **Preview** (Preview)
   - ✅ Marque **Development** (Desenvolvimento)

3. Clique em **Save** (Salvar)

### Passo 4: Adicionar Variável 2

1. Clique em **"Add New"** novamente
2. Preencha os campos:

   **Name (Nome):**
   ```
   VITE_MERCADOPAGO_ACCESS_TOKEN
   ```
   ⚠️ **Copie exatamente assim!** (maiúsculas, com underscore, começando com VITE_)

   **Value (Valor):**
   ```
   TEST-d450f022-fc2f-4ae2-8629-e5f723e5cf86
   ```
   ⚠️ **Mesmo valor da variável 1**

   **Environments (Ambientes):**
   - ✅ Marque **Production**
   - ✅ Marque **Preview**
   - ✅ Marque **Development**

3. Clique em **Save** (Salvar)

### Passo 5: Verificar se Foi Salvo

Você deve ver uma lista com **2 variáveis**:

```
MERCADOPAGO_ACCESS_TOKEN        [Production, Preview, Development]
VITE_MERCADOPAGO_ACCESS_TOKEN   [Production, Preview, Development]
```

✅ Se aparecer assim, está correto!

### Passo 6: Fazer Novo Deploy ⚠️ CRUCIAL!

**IMPORTANTE:** Variáveis só ficam disponíveis em **novos deploys**!

#### Opção A: Redeploy Manual (Mais Rápido)

1. No menu superior, clique em **Deployments** (Deploys)
2. Você verá uma lista de deploys
3. Encontre o deployment mais recente (o primeiro da lista)
4. Clique nos **3 pontinhos** (⋯) no lado direito desse deployment
5. Selecione **Redeploy**
6. Confirme clicando em **Redeploy** novamente
7. Aguarde o deploy terminar (2-3 minutos)
8. Você verá o status mudar de "Building" → "Ready" ✅

#### Opção B: Deploy via Git (Automático)

1. Faça um pequeno commit (pode ser um comentário):
   ```bash
   git commit --allow-empty -m "trigger deploy"
   git push origin main
   ```
2. O Vercel fará deploy automático
3. Aguarde o deploy terminar (2-3 minutos)

### Passo 7: Verificar se Funcionou

**Aguardar 2-3 minutos após o deploy terminar**, depois:

1. Acesse no navegador:
   ```
   https://groom-guru-platform.vercel.app/api/pagamentos/test-token
   ```

2. Você deve ver:
   ```json
   {
     "success": true,
     "diagnostic": {
       "MERCADOPAGO_ACCESS_TOKEN": "✅ Configurado",
       "VITE_MERCADOPAGO_ACCESS_TOKEN": "✅ Configurado",
       ...
     },
     "message": "Token encontrado! ✅"
   }
   ```

✅ **Se aparecer isso, está funcionando!**

### Passo 8: Testar Pagamento

1. Acesse: https://groom-guru-platform.vercel.app
2. Faça login como cliente
3. Crie um agendamento
4. Vá para checkout
5. Selecione "Cartão de Crédito"
6. Clique em "Finalizar Pagamento"
7. Deve funcionar! ✅

---

## ⚠️ Problemas Comuns

### Problema 1: "Variável aparece mas teste ainda mostra ❌"

**Causa:** Deploy não foi feito após adicionar variáveis

**Solução:**
1. Verifique se fez o **Passo 6 (Fazer Novo Deploy)**
2. Aguarde o deploy terminar completamente (status "Ready")
3. Aguarde mais 2-3 minutos (pode ter delay)
4. Teste novamente

### Problema 2: "Nome da variável está diferente"

**Causa:** Nome digitado errado

**Solução:**
1. Verifique se o nome está **exatamente** assim:
   - `MERCADOPAGO_ACCESS_TOKEN` (não `mercadopago_access_token`)
   - `VITE_MERCADOPAGO_ACCESS_TOKEN` (não `vite_mercadopago_access_token`)
2. Variáveis são **case-sensitive** (maiúsculas/minúsculas importam)
3. Edite a variável e corrija o nome

### Problema 3: "Valor da variável está errado"

**Causa:** Token copiado errado ou com espaços

**Solução:**
1. Copie o token novamente:
   ```
   TEST-d450f022-fc2f-4ae2-8629-e5f723e5cf86
   ```
2. Verifique se não há espaços antes ou depois
3. Edite a variável e cole o valor novamente

### Problema 4: "Ambientes não marcados"

**Causa:** Variável não foi marcada para Production

**Solução:**
1. Edite a variável
2. Marque **TODOS** os ambientes:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
3. Salve

---

## 📋 Checklist Final

Antes de considerar resolvido, verifique:

- [ ] Variável `MERCADOPAGO_ACCESS_TOKEN` adicionada no Vercel
- [ ] Variável `VITE_MERCADOPAGO_ACCESS_TOKEN` adicionada no Vercel
- [ ] Ambas com o valor: `TEST-d450f022-fc2f-4ae2-8629-e5f723e5cf86`
- [ ] Ambas marcadas para: ✅ Production, ✅ Preview, ✅ Development
- [ ] Variáveis foram **salvas** (aparecem na lista)
- [ ] **Novo deploy foi feito APÓS adicionar variáveis** ⚠️
- [ ] Deploy terminou completamente (status "Ready")
- [ ] Aguardou 2-3 minutos após deploy terminar
- [ ] Teste em `/api/pagamentos/test-token` retorna "✅ Configurado"
- [ ] Pagamento funciona sem erro

---

## 🆘 Se Ainda Não Funcionar

1. Verifique se está no projeto correto:
   - URL deve ser: `https://vercel.com/brunos-projects-9672b208/groom-guru-platform`
   - Não deve ser outro projeto

2. Verifique se fez login na conta certa do Vercel

3. Tente remover e adicionar as variáveis novamente:
   - Delete as variáveis existentes
   - Adicione novamente seguindo os passos
   - Faça novo deploy

4. Verifique os logs no Vercel:
   - Functions → `/api/pagamentos/preference` → Logs
   - Veja se há algum erro diferente

5. Me envie:
   - Print da tela do Vercel mostrando as variáveis
   - Resultado do teste em `/api/pagamentos/test-token`
   - Logs do Vercel

---

## ✅ Pronto!

Após seguir **TODOS** os passos, especialmente o **Passo 6 (Fazer Novo Deploy)**, o token deve estar funcionando!

**Lembre-se:** Variáveis só ficam disponíveis em **novos deploys**! 🚀

