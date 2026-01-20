# 📋 Como Verificar Barbearias Cadastradas

## Método 1: Via Console do Backend (Railway)

Quando um cliente buscar barbearias no painel, os logs do Railway mostrarão todas as barbearias cadastradas:

1. Acesse o Railway: https://railway.app
2. Vá no serviço do backend
3. Clique em **"View Logs"** (Ver Logs)
4. No painel do cliente, acesse **"Buscar Barbearias"**
5. Os logs mostrarão:
   ```
   📋 [BARBEARIAS] BARBEARIAS CADASTRADAS NO SISTEMA:
   ════════════════════════════════════════════════════════════════════
   
   1. Nome da Barbearia
      ID: xxx
      Status: ativa/em_teste/bloqueada
      Email: email@exemplo.com
      ...
   ```

## Método 2: Via API Admin (Requer Autenticação)

Se você tiver acesso como admin:

1. Faça login como admin no sistema
2. Acesse: `/api/admin/barbearias`
3. Você verá todas as barbearias cadastradas

## Método 3: Via Prisma Studio

1. No terminal, execute:
   ```bash
   cd backend
   npx prisma studio
   ```
2. Abra o navegador em: http://localhost:5555
3. Clique na tabela **Barbearia**
4. Veja todas as barbearias cadastradas

## Método 4: Script Node.js Local

Criei um script que lista todas as barbearias. Para usar:

1. Certifique-se de ter as variáveis de ambiente configuradas
2. Execute:
   ```bash
   cd backend
   npm run listar-barbearias
   ```

## Informações Mostradas

Para cada barbearia, você verá:
- ✅ Nome
- ✅ ID
- ✅ Status (ativa, em_teste, bloqueada, cancelada)
- ✅ Email e telefone
- ✅ Cidade e bairro
- ✅ Quantidade de serviços ativos
- ✅ Quantidade de profissionais ativos
- ✅ Total de agendamentos
- ✅ Dados do dono vinculado (se houver)

## Observações

- **Status `em_teste`**: Barbearias com status padrão ao criar (não aparecem se filtrar por `ativa`)
- **Status `ativa`**: Barbearias ativas e visíveis
- **Sem filtro de status**: A rota pública agora mostra TODAS as barbearias, independente do status
