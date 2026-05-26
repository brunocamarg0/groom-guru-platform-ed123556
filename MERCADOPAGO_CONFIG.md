# Configuração do Mercado Pago — BarberPro

> ⚠️ Nunca commit tokens reais neste arquivo. Use apenas placeholders.
> Tokens reais ficam nos Secrets do Lovable Cloud (backend) — nunca em variáveis `VITE_*`.

## Secrets necessários (Lovable Cloud)

Configure no painel de Secrets:

- `MERCADOPAGO_ACCESS_TOKEN` — token de produção (`APP_USR-...`)
- `MERCADOPAGO_ACCESS_TOKEN_TEST` — token de teste (`TEST-...`)
- `MERCADOPAGO_WEBHOOK_SECRET` — segredo do webhook (painel MP → Webhooks → Sua chave secreta)

Formato dos tokens (somente para referência):

```
APP_USR-xxxxxxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxx
TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## Arquitetura

Todas as chamadas à API do Mercado Pago acontecem em Edge Functions (`supabase/functions/mercadopago-*`).
O frontend NUNCA possui o access token e NUNCA chama `api.mercadopago.com` diretamente.

## Webhook

1. Painel MP → Webhooks → criar URL apontando para a edge function `mercadopago-webhook`.
2. Copiar a "Chave secreta" gerada pelo MP e salvar como `MERCADOPAGO_WEBHOOK_SECRET`.
3. A edge function valida o header `x-signature` (HMAC-SHA256) antes de processar.

## Rotação

Se um token vazar, rotacione imediatamente em:
https://www.mercadopago.com.br/developers/panel/credentials
