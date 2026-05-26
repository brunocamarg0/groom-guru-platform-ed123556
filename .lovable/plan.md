# Mercado Pago Connect — Multi-tenant

Hoje existe **um único token** no sistema, então todo pagamento cai na sua conta. A solução correta é o **Mercado Pago Connect (OAuth)**: cada dono de barbearia autoriza o BarberMaestro a criar pagamentos em nome dele, e o dinheiro cai direto na conta MP do dono.

## Como vai funcionar (visão do usuário)

1. Dono entra no painel → aba **Configurações → Pagamentos**.
2. Clica em **"Conectar Mercado Pago"**.
3. É redirecionado para a tela oficial do MP, faz login, autoriza.
4. Volta para o painel já conectado (mostra "✅ Conta conectada: email@dono.com").
5. A partir daí, todo pagamento de cliente daquela barbearia cai direto na conta do dono.

Cliente paga normalmente — não precisa ter conta MP, pode pagar com PIX, cartão ou saldo.

## Arquitetura técnica

```text
Cliente paga na Barbearia A → Edge Function usa token_A (da Barbearia A) → MP credita Dono A
Cliente paga na Barbearia B → Edge Function usa token_B (da Barbearia B) → MP credita Dono B
```

## Etapas de implementação

### 1. Banco (migration)
Adicionar colunas em `barbearias`:
- `mercadopago_user_id` (text) — ID do usuário MP do dono
- `mercadopago_access_token` (text) — token OAuth do dono (criptografado/restrito)
- `mercadopago_refresh_token` (text) — para renovar quando expirar
- `mercadopago_token_expires_at` (timestamptz)
- `mercadopago_public_key` (text) — chave pública do dono (para o frontend renderizar checkout)
- `mercadopago_connected_at` (timestamptz)

Acesso aos tokens: **apenas service_role** (edge functions). RLS bloqueia leitura desses campos pelo cliente/owner via frontend. O dono só vê o flag "conectado" via uma função `get_mp_connection_status(barbearia_id)`.

### 2. Secrets novos no Lovable Cloud
- `MERCADOPAGO_CLIENT_ID` — App ID do BarberMaestro no painel MP Connect
- `MERCADOPAGO_CLIENT_SECRET` — App Secret

(O `MERCADOPAGO_ACCESS_TOKEN` atual continua só para a **assinatura** do dono pagar o BarberMaestro.)

### 3. Edge Functions novas
- `mercadopago-oauth-start` — gera URL de autorização e state CSRF
- `mercadopago-oauth-callback` — recebe `code`, troca por token, salva em `barbearias`
- `mercadopago-disconnect` — apaga tokens da barbearia
- `mercadopago-refresh-token` — helper usado pelas outras functions quando o token expira

### 4. Edge Functions existentes (refatorar)
- `mercadopago-preference` — buscar token da barbearia do agendamento (não usar mais env global), montar preferência com `marketplace_fee` opcional
- `mercadopago-pix` — idem
- `mercadopago-payment-status` — usar token da barbearia
- `mercadopago-webhook` — identificar barbearia pelo `external_reference` e usar o token dela para consultar o pagamento

### 5. UI no painel do dono
- Nova seção em `src/pages/dono/Configuracoes.tsx` (ou criar `ConfiguracoesPagamento.tsx`):
  - Estado "Não conectado" → botão "Conectar Mercado Pago"
  - Estado "Conectado" → mostra email/ID MP e botão "Desconectar"
- Componente em `src/components/pagamento/MercadoPagoConnectCard.tsx`

### 6. Configuração no painel MP (manual pelo usuário)
Você precisa, no [painel de desenvolvedores do MP](https://www.mercadopago.com.br/developers/panel/app):
1. Criar/abrir o app
2. Pegar o **Client ID** e **Client Secret**
3. Adicionar Redirect URI: `https://oyfgyoutpwmoqdtubveb.supabase.co/functions/v1/mercadopago-oauth-callback`

## Ordem de execução

1. Migration (banco)
2. Pedir secrets `MERCADOPAGO_CLIENT_ID` e `MERCADOPAGO_CLIENT_SECRET`
3. Edge functions OAuth (start + callback + disconnect)
4. UI no painel do dono
5. Refatorar edge functions de pagamento para usar token por barbearia
6. Atualizar webhook
7. Testar fluxo ponta-a-ponta com uma conta MP de teste

## Importante

- A **assinatura do dono pagando o BarberMaestro** continua usando seu token global (`MERCADOPAGO_ACCESS_TOKEN`) — isso não muda.
- Só os **pagamentos de clientes para barbearias** passam a usar o token OAuth do respectivo dono.
- Enquanto a barbearia não conectar o MP, o botão "pagar online" fica desabilitado no painel do cliente daquela barbearia (mostra mensagem "Esta barbearia ainda não aceita pagamento online — pague presencialmente").

Posso começar pela **etapa 1 (migration)**?
