# 🚀 Como Criar Admins via API no Railway

Este guia mostra passo a passo como criar os usuários admin usando a API do Railway.

---

## 📋 Passo 1: Encontrar a URL do Backend no Railway

1. **Acesse:** https://railway.app
2. **Faça login** na sua conta
3. **Abra seu projeto** do backend
4. **Clique no serviço** do backend (geralmente aparece como "backend" ou "api")
5. **Vá na aba "Settings"** ou "Deployments"
6. **Procure por "Public Domain"** ou "Custom Domain"
7. **Copie a URL** (exemplo: `https://groom-guru-platform-production.up.railway.app`)

---

## 🔗 Passo 2: Montar a URL da API

A rota completa será:
```
https://SEU-BACKEND.railway.app/api/admin/corrigir-admin?senha=Squaredadmin
```

**Exemplo real:**
```
https://groom-guru-platform-production.up.railway.app/api/admin/corrigir-admin?senha=Squaredadmin
```

---

## 🌐 Opção A: Via Navegador (Mais Fácil)

1. **Abra seu navegador** (Chrome, Firefox, Edge, etc.)
2. **Cole a URL completa:**
   ```
   https://SEU-BACKEND.railway.app/api/admin/corrigir-admin?senha=Squaredadmin
   ```
3. **Pressione Enter**
4. **Você verá uma resposta JSON** como esta:

```json
{
  "sucesso": true,
  "mensagem": "Usuários admin corrigidos/criados com sucesso!",
  "usuarios": [
    {
      "email": "brunocamargocontato@hotmail.com",
      "nome": "Bruno Camargo",
      "acao": "criado",
      "id": "uuid-aqui"
    },
    {
      "email": "bernardostrabelli@gmail.com",
      "nome": "Bernardo Trabelli",
      "acao": "criado",
      "id": "uuid-aqui"
    }
  ],
  "credenciais": {
    "senha": "Squaredadmin",
    "nota": "Guarde esta senha em local seguro. Você pode alterá-la após fazer login."
  }
}
```

✅ **Se você ver essa resposta, os admins foram criados com sucesso!**

---

## 💻 Opção B: Via Terminal (curl)

### Windows (PowerShell):

```powershell
curl "https://SEU-BACKEND.railway.app/api/admin/corrigir-admin?senha=Squaredadmin"
```

### Windows (CMD):

```cmd
curl "https://SEU-BACKEND.railway.app/api/admin/corrigir-admin?senha=Squaredadmin"
```

### Linux/Mac:

```bash
curl "https://SEU-BACKEND.railway.app/api/admin/corrigir-admin?senha=Squaredadmin"
```

---

## 📮 Opção C: Via POST (Alternativa)

Se preferir usar POST em vez de GET:

### Windows (PowerShell):

```powershell
curl -X POST "https://SEU-BACKEND.railway.app/api/admin/corrigir-admin" `
  -H "Content-Type: application/json" `
  -d '{\"senha\": \"Squaredadmin\"}'
```

### Linux/Mac:

```bash
curl -X POST "https://SEU-BACKEND.railway.app/api/admin/corrigir-admin" \
  -H "Content-Type: application/json" \
  -d '{"senha": "Squaredadmin"}'
```

---

## 🧪 Opção D: Via Postman

1. **Abra o Postman**
2. **Crie uma nova requisição:**
   - **Método:** GET (ou POST)
   - **URL:** `https://SEU-BACKEND.railway.app/api/admin/corrigir-admin`
3. **Se usar GET:**
   - Vá em **Params**
   - Adicione:
     - **Key:** `senha`
     - **Value:** `Squaredadmin`
4. **Se usar POST:**
   - Vá em **Body**
   - Selecione **raw** e **JSON**
   - Cole:
     ```json
     {
       "senha": "Squaredadmin"
     }
     ```
5. **Clique em "Send"**
6. **Verifique a resposta**

---

## ✅ Verificar se Funcionou

### 1. Testar Login no Sistema

1. **Acesse:** `https://seu-frontend.vercel.app/login` (ou sua URL do frontend)
2. **Selecione a aba "Admin"**
3. **Tente fazer login:**
   - Email: `brunocamargocontato@hotmail.com`
   - Senha: `Squaredadmin`
4. **Ou:**
   - Email: `bernardostrabelli@gmail.com`
   - Senha: `Squaredadmin`

### 2. Verificar Logs no Railway

1. **No Railway**, vá no serviço do backend
2. **Clique em "Deployments"** ou "Logs"
3. **Procure por mensagens como:**
   ```
   🔐 Iniciando correção de usuários admin via API...
   ✅ Admin criado: brunocamargocontato@hotmail.com
   ✅ Admin criado: bernardostrabelli@gmail.com
   ```

---

## 🐛 Troubleshooting

### Erro: "Cannot GET /api/admin/corrigir-admin"
- ✅ Verifique se a URL está correta
- ✅ Certifique-se de que o backend está rodando no Railway
- ✅ Verifique os logs do Railway para erros

### Erro: "Connection refused" ou timeout
- ✅ Verifique se o serviço está "Running" no Railway
- ✅ Aguarde alguns segundos e tente novamente
- ✅ Verifique se há algum problema de deploy

### Resposta vazia ou erro 500
- ✅ Verifique os logs do Railway
- ✅ Certifique-se de que o banco de dados está conectado
- ✅ Verifique se a `DATABASE_URL` está configurada

### Erro: "Email already exists"
- ✅ Isso é **normal**! Significa que o usuário já existe
- ✅ O sistema atualizará a senha do usuário existente
- ✅ Verifique se a senha foi atualizada corretamente

---

## 📝 Exemplo Completo

**URL do seu backend:** `https://groom-guru-platform-production.up.railway.app`

**URL completa da API:**
```
https://groom-guru-platform-production.up.railway.app/api/admin/corrigir-admin?senha=Squaredadmin
```

**Cole no navegador e pressione Enter!**

---

## 🔒 Segurança

⚠️ **IMPORTANTE:**
- Esta rota é **pública** (não requer autenticação)
- Use apenas para criar os admins iniciais
- Após criar, considere remover ou proteger esta rota
- Altere as senhas após o primeiro login

---

**Pronto!** Agora você sabe como criar os admins via API no Railway! 🎉

