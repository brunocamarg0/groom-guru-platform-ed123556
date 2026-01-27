# Como Alterar a Senha do Usuário Dono

Se você está sem acesso ao painel do dono, use este guia para recuperar o acesso alterando a senha.

## Opção 1: Script TypeScript (Recomendado)

Execute o script que lista todos os donos e permite alterar a senha:

```bash
cd backend
npm run alterar-senha-dono
```

Ou diretamente com tsx:

```bash
cd backend
npx tsx scripts/alterar-senha-dono.ts
```

### Uso do Script

O script pode ser usado de três formas:

#### 1. Listar todos os donos e escolher interativamente:
```bash
npm run alterar-senha-dono
```
O script irá:
- Listar todos os donos cadastrados
- Pedir para você escolher qual dono (por número ou email)
- Pedir a nova senha
- Alterar a senha

#### 2. Especificar email e senha diretamente:
```bash
npm run alterar-senha-dono [email] [nova-senha]
```

Exemplo:
```bash
npm run alterar-senha-dono dono@barbearia.com MinhaNovaSenha123
```

#### 3. Especificar apenas o email (senha será solicitada):
```bash
npm run alterar-senha-dono [email]
```

Exemplo:
```bash
npm run alterar-senha-dono dono@barbearia.com
```

## Opção 2: Via Prisma Studio (Interface Gráfica)

1. Abra o Prisma Studio:
```bash
cd backend
npm run prisma:studio
```

2. Navegue até a tabela `UsuarioDono`
3. Encontre o dono pelo email
4. **NÃO** edite a senha diretamente (ela precisa ser hasheada)
5. Use o script acima para alterar corretamente

## Opção 3: Via SQL Direto (Avançado)

⚠️ **ATENÇÃO**: Esta opção requer que você gere o hash da senha corretamente.

1. Execute o script para gerar o SQL:
```bash
cd backend
npx tsx scripts/gerar-sql-alterar-senha-dono.ts "NovaSenha123"
```

2. Copie o SQL gerado
3. Execute no seu banco de dados (Prisma Studio, pgAdmin, DBeaver, etc)

## Após alterar a senha

1. Acesse: `/login?tab=dono`
2. Faça login com:
   - Email: o email do dono que você alterou
   - Senha: a nova senha que você definiu

## Nota de Segurança

⚠️ **IMPORTANTE**: 
- Guarde a senha em local seguro
- Não compartilhe a senha por email ou mensagem não criptografada
- Considere alterar a senha após o primeiro login
- Se o dono usa apenas OAuth (Google), pode não ter senha cadastrada - o script criará uma senha para login tradicional

## Solução de Problemas

### Erro: "Dono não encontrado"
- Verifique se o email está correto
- Use o script sem parâmetros para listar todos os donos disponíveis

### Erro: "A senha deve ter pelo menos 6 caracteres"
- Use uma senha com no mínimo 6 caracteres

### Erro de conexão com banco de dados
- Verifique se o arquivo `.env` está configurado corretamente
- Verifique se a variável `DATABASE_URL` está definida
- Certifique-se de que o banco de dados está acessível
