# 📱 Configuração de Notificações WhatsApp

Este guia explica como configurar as notificações automáticas via WhatsApp para o Groom Guru Platform.

## 🎯 Funcionalidades

- ✅ Notificação de confirmação de agendamento
- ❌ Notificação de recusa de agendamento
- ⏰ Lembrete automático 24 horas antes do agendamento

## 🔧 Provedores Suportados

O sistema suporta três provedores de WhatsApp:

### 1. Evolution API (Recomendado - Self-hosted)

**Vantagens:**
- Gratuito (self-hosted)
- Sem limites de mensagens
- Controle total

**Desvantagens:**
- Requer servidor próprio
- Configuração mais complexa

**Setup:**
1. Instale o Evolution API seguindo a [documentação oficial](https://doc.evolution-api.com/)
2. Configure as variáveis de ambiente:

```env
WHATSAPP_PROVIDER=evolution
WHATSAPP_EVOLUTION_URL=http://localhost:8080
WHATSAPP_EVOLUTION_API_KEY=sua-api-key
WHATSAPP_EVOLUTION_INSTANCE=nome-da-instancia
```

### 2. Twilio WhatsApp API

**Vantagens:**
- Fácil configuração
- Confiável e estável
- Suporte oficial

**Desvantagens:**
- Pago (mas tem plano trial)
- Limites de mensagens no plano gratuito

**Setup:**
1. Crie uma conta no [Twilio](https://www.twilio.com/)
2. Configure o WhatsApp Sandbox ou use um número verificado
3. Configure as variáveis de ambiente:

```env
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=seu-account-sid
TWILIO_AUTH_TOKEN=seu-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 3. Z-API

**Vantagens:**
- Popular no Brasil
- Fácil integração
- Planos acessíveis

**Desvantagens:**
- Serviço pago
- Requer instância configurada

**Setup:**
1. Crie uma conta no [Z-API](https://developer.z-api.io/)
2. Configure uma instância
3. Configure as variáveis de ambiente:

```env
WHATSAPP_PROVIDER=zapi
ZAPI_URL=https://api.z-api.io
ZAPI_TOKEN=seu-token
ZAPI_INSTANCE=id-da-instancia
```

## 📝 Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Provedor WhatsApp (evolution, twilio, zapi)
WHATSAPP_PROVIDER=evolution

# Evolution API
WHATSAPP_EVOLUTION_URL=http://localhost:8080
WHATSAPP_EVOLUTION_API_KEY=sua-api-key
WHATSAPP_EVOLUTION_INSTANCE=nome-da-instancia

# Twilio (alternativa)
# TWILIO_ACCOUNT_SID=seu-account-sid
# TWILIO_AUTH_TOKEN=seu-auth-token
# TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Z-API (alternativa)
# ZAPI_URL=https://api.z-api.io
# ZAPI_TOKEN=seu-token
# ZAPI_INSTANCE=id-da-instancia
```

## 🚀 Como Funciona

### Notificações Imediatas

Quando um agendamento é:
- **Confirmado**: Cliente recebe mensagem de confirmação
- **Recusado**: Cliente recebe mensagem de recusa com motivo (se fornecido)

### Lembretes Automáticos

O sistema executa um job a cada hora que:
1. Busca agendamentos confirmados que acontecerão em 23-25 horas
2. Envia lembrete via WhatsApp para cada cliente

**Horário de execução:** A cada hora (minuto 0)

## 📱 Formato das Mensagens

### Confirmação de Agendamento

```
✅ Agendamento Confirmado!

Olá [Nome do Cliente]!

Seu agendamento na [Nome da Barbearia] foi confirmado:

📅 Data: [Data formatada]
🕐 Horário: [Horário]
✂️ Serviço: [Nome do Serviço]
👤 Profissional: [Nome] (se disponível)

Estamos ansiosos para atendê-lo!
```

### Recusa de Agendamento

```
❌ Agendamento Recusado

Olá [Nome do Cliente],

Infelizmente, não foi possível confirmar seu agendamento na [Nome da Barbearia]:

📅 Data: [Data formatada]
🕐 Horário: [Horário]
✂️ Serviço: [Nome do Serviço]

Motivo: [Motivo fornecido]

Por favor, entre em contato conosco para reagendar em outro horário.
```

### Lembrete 24h Antes

```
⏰ Lembrete de Agendamento

Olá [Nome do Cliente]!

Este é um lembrete do seu agendamento na [Nome da Barbearia]:

📅 Data: [Data formatada]
🕐 Horário: [Horário]
✂️ Serviço: [Nome do Serviço]
👤 Profissional: [Nome] (se disponível)
📍 Endereço: [Endereço] (se disponível)

Nos vemos amanhã! 🎉
```

## 🧪 Testando

### Teste Manual

Você pode testar o envio de mensagens criando um endpoint de teste ou usando o console:

```typescript
import { enviarWhatsApp } from './services/whatsappService';

// Teste simples
await enviarWhatsApp({
  telefone: '11999999999', // Seu número de teste
  mensagem: 'Teste de notificação WhatsApp!',
});
```

### Verificar Logs

Os logs do sistema mostrarão:
- ✅ Mensagens enviadas com sucesso
- ❌ Erros ao enviar
- 🔔 Execução dos jobs de lembrete

## ⚠️ Importante

1. **Formato de Telefone**: O sistema formata automaticamente para o formato internacional (55 + DDD + número)
2. **Falhas Silenciosas**: Se uma notificação falhar, o sistema não interrompe a operação principal (confirmação/recusa)
3. **Rate Limits**: Respeite os limites do seu provedor para evitar bloqueios
4. **Privacidade**: Nunca exponha tokens ou chaves de API

## 🔒 Segurança

- Mantenha todas as chaves e tokens no arquivo `.env`
- Não commite o `.env` no Git
- Use variáveis de ambiente em produção
- Revise as permissões de acesso regularmente

## 📚 Recursos

- [Evolution API Docs](https://doc.evolution-api.com/)
- [Twilio WhatsApp Docs](https://www.twilio.com/docs/whatsapp)
- [Z-API Docs](https://developer.z-api.io/)

## 🆘 Troubleshooting

### Mensagens não estão sendo enviadas

1. Verifique se as variáveis de ambiente estão configuradas
2. Teste a conexão com o provedor
3. Verifique os logs do servidor
4. Confirme que o número está no formato correto

### Lembretes não estão sendo enviados

1. Verifique se o job está rodando (logs a cada hora)
2. Confirme que há agendamentos confirmados nas próximas 24h
3. Verifique se os telefones estão cadastrados corretamente

### Erro de autenticação

1. Verifique se as chaves/tokens estão corretos
2. Confirme que a instância está ativa (Evolution/Z-API)
3. Verifique se a conta Twilio está ativa
