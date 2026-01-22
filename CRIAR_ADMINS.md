# 🔐 Como Criar Usuários Admin

Este guia explica como criar os 2 usuários admin no sistema.

## 📋 Usuários a Criar

1. **Bruno Camargo**
   - Email: `brunocamargocontato@hotmail.com`
   - Senha: `Squaredadmin`

2. **Bernardo Strabelli**
   - Email: `bernardostrabelli@gmail.com`
   - Senha: `Squaredadmin`

---

## 🚀 Opção 1: Via API (Recomendado)

### Se o backend estiver rodando:

1. **Acesse a rota:**
   ```
   GET https://seu-backend.railway.app/api/admin/corrigir-admin?senha=Squaredadmin
   ```
   
   Ou via POST:
   ```bash
   curl -X POST https://seu-backend.railway.app/api/admin/corrigir-admin \
     -H "Content-Type: application/json" \
     -d '{"senha": "Squaredadmin"}'
   ```

2. **A resposta será:**
   ```json
   {
     "sucesso": true,
     "mensagem": "Usuários admin corrigidos/criados com sucesso!",
     "usuarios": [
       {
         "email": "brunocamargocontato@hotmail.com",
         "nome": "Bruno Camargo",
         "acao": "criado",
         "id": "..."
       },
       {
         "email": "bernardostrabelli@gmail.com",
         "nome": "Bernardo Trabelli",
         "acao": "criado",
         "id": "..."
       }
     ],
     "credenciais": {
       "senha": "Squaredadmin",
       "nota": "Guarde esta senha em local seguro. Você pode alterá-la após fazer login."
     }
   }
   ```

---

## 🛠️ Opção 2: Via Script TypeScript

### Localmente (com banco configurado):

1. **Navegue até a pasta backend:**
   ```bash
   cd backend
   ```

2. **Execute o script:**
   ```bash
   npx tsx scripts/criar-admins.ts
   ```

3. **O script irá:**
   - Criar os 2 usuários admin se não existirem
   - Atualizar a senha se já existirem
   - Mostrar confirmação de sucesso

---

## 🗄️ Opção 3: Via Railway CLI

### Se estiver usando Railway:

1. **Conecte ao projeto:**
   ```bash
   railway link
   ```

2. **Execute o script:**
   ```bash
   railway run npx tsx scripts/criar-admins.ts
   ```

---

## ✅ Verificar se Funcionou

Após criar os admins, você pode verificar:

1. **Fazer login no sistema:**
   - Acesse: `/login`
   - Selecione a aba "Admin"
   - Use um dos emails e senha `Squaredadmin`

2. **Ou verificar no banco de dados:**
   ```sql
   SELECT id, nome, email, role, ativo, "createdAt"
   FROM "UsuarioAdmin"
   WHERE email IN ('brunocamargocontato@hotmail.com', 'bernardostrabelli@gmail.com');
   ```

---

## 🔒 Segurança

- ⚠️ **IMPORTANTE:** A senha padrão é `Squaredadmin`
- ✅ Após fazer login, **altere a senha** para uma mais segura
- ✅ Os usuários são criados com `role: 'admin'` e `ativo: true`
- ✅ Se um usuário já existir, apenas a senha será atualizada

---

## 🆘 Troubleshooting

### Erro: "Cannot connect to database"
- Verifique se a `DATABASE_URL` está configurada corretamente
- Verifique se o banco de dados está acessível

### Erro: "Email already exists"
- Isso é normal! O script atualiza a senha do usuário existente
- Verifique se o usuário foi atualizado corretamente

### Script não executa
- Certifique-se de estar na pasta `backend`
- Verifique se todas as dependências estão instaladas: `npm install`
- Tente usar a rota API em vez do script

---

## 📝 Notas

- Os usuários são criados com `role: 'admin'` (não `super_admin`)
- Se precisar de permissões especiais, altere manualmente no banco
- A senha é hasheada usando bcrypt antes de ser armazenada
- O script é idempotente: pode ser executado múltiplas vezes sem problemas

---

**Pronto!** Os usuários admin foram criados! 🎉

