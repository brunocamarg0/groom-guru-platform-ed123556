# Como Corrigir Usuários Admin

Este documento explica como corrigir os usuários admin que foram adicionados ao banco de dados mas não conseguem acessar o sistema.

## Problema

Os usuários admin foram adicionados ao banco de dados, mas não conseguem fazer login. Isso geralmente acontece porque:
1. A senha não foi hasheada corretamente (está em texto plano)
2. O campo `ativo` está como `false`
3. O campo `nome` está faltando ou vazio
4. O campo `role` não está definido

## Solução

Execute o script `corrigir-usuarios-admin.ts` que irá:
- Verificar se os usuários existem
- Criar ou atualizar os usuários com os dados corretos
- Garantir que a senha está hasheada
- Garantir que o campo `ativo` está como `true`
- Garantir que todos os campos obrigatórios estão preenchidos

## Como Executar

### Opção 1: Via API (mais fácil - recomendado)

Se o servidor estiver rodando, você pode usar o endpoint da API:

```bash
# Com senha padrão
curl -X POST http://localhost:3000/api/admin/corrigir-admin

# Com senha personalizada
curl -X POST http://localhost:3000/api/admin/corrigir-admin \
  -H "Content-Type: application/json" \
  -d '{"senha": "SuaSenhaSegura123!"}'
```

Ou acesse diretamente no navegador:
- `http://localhost:3000/api/admin/corrigir-admin` (GET)
- Ou use Postman/Insomnia para fazer POST com body JSON: `{"senha": "SuaSenhaSegura123!"}`

### Opção 2: Usando npm script

```bash
cd backend
npm run corrigir-admin
```

### Opção 3: Usando tsx diretamente

```bash
cd backend
npx tsx scripts/corrigir-usuarios-admin.ts
```

### Opção 4: Com senha personalizada

```bash
cd backend
npx tsx scripts/corrigir-usuarios-admin.ts "SuaSenhaSegura123!"
```

Se não fornecer uma senha, será usada a senha padrão temporária: `Admin123!@#`

> 💡 **Dica**: Os scripts TypeScript e a API geram o hash da senha automaticamente. Você não precisa fazer isso manualmente! Veja [EXPLICACAO_HASH_SENHA.md](./EXPLICACAO_HASH_SENHA.md) para entender o que é hash.

## Usuários que serão corrigidos/criados

1. **brunocamargocontato@hotmail.com**
   - Nome: Bruno Camargo

2. **bernardostrabelli@gmail.com**
   - Nome: Bernardo Trabelli

## Após executar o script

1. Anote a senha que foi usada (será exibida no final do script)
2. Acesse o sistema em: `/login?tab=admin`
3. Faça login com o email e a senha fornecida
4. Após fazer login, você pode alterar a senha nas configurações

## Verificação Manual (SQL)

> ⚠️ **Atenção**: Esta opção requer gerar o hash da senha manualmente. É mais trabalhoso. Prefira usar o Script TypeScript ou a API que fazem isso automaticamente!

Se preferir verificar/corrigir manualmente no banco de dados:

```sql
-- Verificar usuários admin
SELECT id, nome, email, role, ativo, "createdAt"
FROM "UsuarioAdmin"
WHERE email IN ('brunocamargocontato@hotmail.com', 'bernardostrabelli@gmail.com');

-- Verificar se a senha está hasheada (deve começar com $2a$ ou $2b$)
SELECT email, LEFT(senha, 7) as senha_prefix
FROM "UsuarioAdmin"
WHERE email IN ('brunocamargocontato@hotmail.com', 'bernardostrabelli@gmail.com');
```

## Troubleshooting

### Erro: "Email ou senha incorretos"
- Verifique se a senha foi hasheada corretamente
- Execute o script novamente para garantir que a senha está correta

### Erro: "Conta desativada"
- O campo `ativo` está como `false`
- Execute o script para ativar a conta

### Erro de conexão com banco
- Verifique se a variável `DATABASE_URL` está configurada no arquivo `.env`
- Verifique se o banco de dados está acessível

## Notas Importantes

⚠️ **SEGURANÇA**: 
- Guarde a senha em local seguro
- Altere a senha após o primeiro login
- Não compartilhe a senha por email ou mensagem não criptografada

✅ **Boa Prática**: 
- Use senhas fortes (mínimo 8 caracteres, com letras, números e símbolos)
- Ative autenticação de dois fatores se disponível
