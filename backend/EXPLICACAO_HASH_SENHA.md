# O que é "Substituir o Hash da Senha"?

## O que é um Hash?

Um **hash** é uma versão criptografada da sua senha. Por segurança, as senhas **nunca** são armazenadas em texto plano no banco de dados.

### Exemplo:

```
Senha original:  "Admin123!@#"
Hash gerado:     "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
```

Quando você faz login, o sistema:
1. Pega a senha que você digitou
2. Gera um hash dela
3. Compara com o hash armazenado no banco
4. Se forem iguais, você faz login com sucesso

## Por que preciso substituir no SQL?

No script SQL (`corrigir-usuarios-admin.sql`), há uma linha que diz:

```sql
'$2a$10$HASH_DA_SENHA_AQUI', -- SUBSTITUA pelo hash bcrypt da senha
```

Isso significa que você precisa:
1. Escolher uma senha (ex: "MinhaSenha123!")
2. Gerar o hash dessa senha
3. Substituir `HASH_DA_SENHA_AQUI` pelo hash gerado

## Mas eu não preciso fazer isso manualmente!

### ✅ Opção 1: Use o Script TypeScript (MAIS FÁCIL)

O script TypeScript faz tudo automaticamente:

```bash
cd backend
npx tsx scripts/corrigir-usuarios-admin.ts "MinhaSenha123!"
```

O script:
- ✅ Gera o hash automaticamente
- ✅ Cria/atualiza os usuários
- ✅ Configura tudo corretamente

**Você não precisa mexer em hash manualmente!**

### ✅ Opção 2: Use a API (AINDA MAIS FÁCIL)

Se o servidor estiver rodando:

```bash
# Acesse no navegador:
http://localhost:3000/api/admin/corrigir-admin

# Ou com senha personalizada via POST:
curl -X POST http://localhost:3000/api/admin/corrigir-admin \
  -H "Content-Type: application/json" \
  -d '{"senha": "MinhaSenha123!"}'
```

A API também faz tudo automaticamente!

### ⚠️ Opção 3: Script SQL (Só se realmente precisar)

**Use esta opção APENAS se:**
- Não conseguir executar o script TypeScript
- Não conseguir usar a API
- Precisar fazer manualmente no banco de dados

**Passos:**

1. **Gere o hash da senha:**
   - Acesse: https://bcrypt-generator.com/
   - Digite sua senha (ex: "MinhaSenha123!")
   - Clique em "Generate"
   - Copie o hash gerado (começa com `$2a$` ou `$2b$`)

2. **Exemplo de hash gerado:**
   ```
   $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
   ```

3. **Substitua no SQL:**
   ```sql
   -- ANTES (não funciona):
   '$2a$10$HASH_DA_SENHA_AQUI',
   
   -- DEPOIS (funciona):
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   ```

4. **Execute o script SQL no banco de dados**

## Resumo

| Método | Precisa gerar hash manualmente? | Dificuldade |
|--------|--------------------------------|-------------|
| Script TypeScript | ❌ Não | ⭐ Fácil |
| API | ❌ Não | ⭐⭐ Muito Fácil |
| Script SQL | ✅ Sim | ⭐⭐⭐ Mais trabalhoso |

## Recomendação

**Use o Script TypeScript ou a API!** Eles fazem tudo automaticamente e você não precisa se preocupar com hash.

Se tiver dúvidas, execute:

```bash
cd backend
npx tsx scripts/corrigir-usuarios-admin.ts "SuaSenhaAqui"
```

Pronto! Tudo configurado automaticamente. 🎉
