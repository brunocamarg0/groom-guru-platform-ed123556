# Próximos Passos Após Executar o Script SQL

## ✅ Passo 1: Verificar se os usuários foram criados/atualizados

Execute esta query no seu banco de dados para verificar:

```sql
SELECT id, nome, email, role, ativo, "createdAt"
FROM "UsuarioAdmin"
WHERE email IN ('brunocamargocontato@hotmail.com', 'bernardostrabelli@gmail.com');
```

**O que verificar:**
- ✅ Os dois usuários aparecem na lista
- ✅ O campo `ativo` está como `true`
- ✅ O campo `role` está como `'admin'`
- ✅ O campo `nome` está preenchido

## ✅ Passo 2: Verificar se a senha está hasheada corretamente

Execute esta query:

```sql
SELECT 
  email, 
  LEFT(senha, 7) as senha_prefix,
  LENGTH(senha) as tamanho_hash
FROM "UsuarioAdmin"
WHERE email IN ('brunocamargocontato@hotmail.com', 'bernardostrabelli@gmail.com');
```

**O que verificar:**
- ✅ O `senha_prefix` deve começar com `$2a$10` ou `$2b$10` (não pode ser `$2a$10$H` - isso indica que o placeholder não foi substituído)
- ✅ O `tamanho_hash` deve ser aproximadamente 60 caracteres

### ⚠️ Se o hash não foi substituído:

Se você vê `$2a$10$HASH_DA_SENHA_AQUI` ou algo similar, significa que o placeholder não foi substituído. Nesse caso:

**Opção A: Use o Script TypeScript (MAIS FÁCIL)**
```bash
cd backend
npx tsx scripts/corrigir-usuarios-admin.ts "SuaSenhaAqui"
```

**Opção B: Use a API**
```
http://localhost:3000/api/admin/corrigir-admin
```

**Opção C: Gere o hash manualmente e atualize**
1. Acesse: https://bcrypt-generator.com/
2. Digite sua senha
3. Clique em "Generate"
4. Copie o hash gerado
5. Execute este SQL (substitua `HASH_GERADO` pelo hash que você copiou):

```sql
UPDATE "UsuarioAdmin"
SET senha = 'HASH_GERADO', "updatedAt" = NOW()
WHERE email IN ('brunocamargocontato@hotmail.com', 'bernardostrabelli@gmail.com');
```

## ✅ Passo 3: Testar o Login

1. Acesse o sistema: `/login?tab=admin`
2. Tente fazer login com:
   - Email: `brunocamargocontato@hotmail.com` ou `bernardostrabelli@gmail.com`
   - Senha: A senha que você usou para gerar o hash (ou `Admin123!@#` se usou a padrão)

### Se o login funcionar:
🎉 **Sucesso!** Você pode acessar o sistema normalmente.

### Se o login não funcionar:

**Erro: "Email ou senha incorretos"**
- Verifique se o hash foi gerado corretamente
- Execute o script TypeScript ou a API para garantir que está tudo correto

**Erro: "Conta desativada"**
- Execute este SQL para ativar:
```sql
UPDATE "UsuarioAdmin"
SET ativo = true, "updatedAt" = NOW()
WHERE email IN ('brunocamargocontato@hotmail.com', 'bernardostrabelli@gmail.com');
```

## 🔧 Solução Rápida (Recomendada)

Se tiver qualquer problema, use o script TypeScript que faz tudo automaticamente:

```bash
cd backend
npx tsx scripts/corrigir-usuarios-admin.ts "SuaSenhaSegura123!"
```

Este script:
- ✅ Gera o hash automaticamente
- ✅ Cria/atualiza os usuários
- ✅ Garante que tudo está correto
- ✅ Mostra um resumo completo

## 📋 Checklist Final

- [ ] Usuários existem no banco de dados
- [ ] Campo `ativo` está como `true`
- [ ] Campo `role` está como `'admin'`
- [ ] Senha está hasheada (começa com `$2a$10` ou `$2b$10`)
- [ ] Login funciona corretamente

Se todos os itens estiverem marcados, você está pronto! 🎉
