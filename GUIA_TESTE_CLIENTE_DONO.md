# Guia de Teste: Painel Cliente ↔ Painel Dono

Este guia explica como testar a integração entre o painel do cliente e o painel do dono.

## 📋 Pré-requisitos

1. Backend rodando
2. Frontend rodando
3. Banco de dados configurado

## 🔧 Passo 1: Criar Usuário Cliente de Teste

Execute o script para criar um cliente de teste:

```bash
cd backend
npm run criar-cliente-teste
```

**Credenciais criadas:**
- 📧 Email: `cliente@teste.com`
- 🔑 Senha: `123456`

## 🏢 Passo 2: Verificar/Criar Barbearia

O script automaticamente:
- Busca uma barbearia existente (ativa ou em teste)
- Se não encontrar, cria uma barbearia de teste

**Se precisar criar um dono para a barbearia:**

```bash
cd backend
npm run criar-usuario-teste
```

**Credenciais do dono:**
- 📧 Email: `dono@teste.com`
- 🔑 Senha: `123456`
- 🏢 Barbearia: `Barbearia Teste`

## 🧪 Passo 3: Testar Fluxo Completo

### 3.1. Login como Cliente

1. Acesse: `http://localhost:5173/login` (ou sua URL de produção)
2. Faça login com:
   - Email: `cliente@teste.com`
   - Senha: `123456`
3. Selecione tipo de usuário: **Cliente**

### 3.2. Agendar Serviço no Painel do Cliente

1. No painel do cliente, clique em **"Agendar"**
2. Selecione uma barbearia (ex: "Barbearia Teste")
3. Escolha:
   - **Serviço** (ex: Corte, Barba, etc.)
   - **Data** (selecione uma data futura)
   - **Horário** (selecione um horário disponível)
   - **Profissional** (opcional)
4. Clique em **"Agendar"**
5. Complete o pagamento (se necessário)

### 3.3. Verificar no Painel do Dono

1. Faça logout do painel do cliente
2. Acesse: `http://localhost:5173/login`
3. Faça login com:
   - Email: `dono@teste.com`
   - Senha: `123456`
4. Selecione tipo de usuário: **Dono**
5. No painel do dono, vá para **"Agenda"**
6. **Verifique:**
   - ✅ O agendamento criado pelo cliente deve aparecer
   - ✅ Deve mostrar o nome do cliente
   - ✅ Deve mostrar o serviço selecionado
   - ✅ Deve mostrar a data e horário
   - ✅ Deve mostrar o status (pendente/confirmado)

## ✅ Checklist de Verificação

### No Painel do Cliente:
- [ ] Login funciona
- [ ] Lista de barbearias aparece
- [ ] Seleção de barbearia funciona
- [ ] Lista de serviços aparece
- [ ] Seleção de data/horário funciona
- [ ] Criação de agendamento funciona
- [ ] Agendamento aparece no histórico

### No Painel do Dono:
- [ ] Login funciona
- [ ] Agenda carrega corretamente
- [ ] Agendamento do cliente aparece na agenda
- [ ] Dados do agendamento estão corretos:
  - [ ] Nome do cliente
  - [ ] Serviço
  - [ ] Data e horário
  - [ ] Status
- [ ] É possível confirmar o agendamento
- [ ] É possível recusar o agendamento

## 🔍 Verificações Técnicas

### Backend - Rota de Agendamento Cliente:
```
POST /api/cliente/agendamentos
```

**Body:**
```json
{
  "barbeariaId": "uuid-da-barbearia",
  "servicoId": "uuid-do-servico",
  "data": "2024-01-20",
  "horario": "14:00",
  "observacoes": "Observações opcionais",
  "profissionalId": "uuid-do-profissional" // opcional
}
```

### Backend - Rota de Listagem Dono:
```
GET /api/dono/agendamentos
```

**Resposta esperada:**
```json
{
  "agendamentos": [
    {
      "id": "uuid",
      "cliente": "Nome do Cliente",
      "servico": {
        "nome": "Corte",
        "preco": 30.00
      },
      "data": "2024-01-20T00:00:00.000Z",
      "horario": "14:00",
      "status": "pendente"
    }
  ]
}
```

## 🐛 Troubleshooting

### Problema: Cliente não consegue agendar
**Solução:**
1. Verifique se a barbearia tem serviços cadastrados
2. Verifique se há profissionais cadastrados (se necessário)
3. Verifique os logs do backend para erros

### Problema: Agendamento não aparece no painel do dono
**Solução:**
1. Verifique se o `barbeariaId` está correto no agendamento
2. Verifique se o dono está logado na barbearia correta
3. Verifique os logs do backend
4. Verifique se o agendamento foi criado no banco de dados

### Problema: Erro de autenticação
**Solução:**
1. Verifique se o token está sendo enviado corretamente
2. Verifique se o token não expirou
3. Faça logout e login novamente

## 📝 Notas Importantes

1. **Agendamentos são vinculados à barbearia**: Um agendamento criado para uma barbearia só aparece no painel do dono dessa barbearia.

2. **Status do agendamento**:
   - `pendente`: Aguardando confirmação do dono
   - `confirmado`: Confirmado pelo dono
   - `cancelado`: Cancelado
   - `concluido`: Serviço realizado

3. **Modo de confirmação**: O dono pode configurar se os agendamentos são:
   - Automáticos: Confirmados automaticamente
   - Manuais: Precisam ser confirmados pelo dono
   - Híbridos: Confirmados automaticamente se dentro de 2 horas

## 🎯 Próximos Passos

Após testar o fluxo básico, você pode testar:
- [ ] Confirmação de agendamento pelo dono
- [ ] Recusa de agendamento pelo dono
- [ ] Pagamento do agendamento
- [ ] Reagendamento pelo cliente
- [ ] Cancelamento pelo cliente
- [ ] Notificações (WhatsApp/Email)
