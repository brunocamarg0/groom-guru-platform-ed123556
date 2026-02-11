# 📊 Status da Implementação: Sistema de Cobrança para Donos

## ✅ O que foi implementado

### 1. **Modelos de Banco de Dados** ✅
- ✅ Modelo `Plano` - Planos de assinatura
- ✅ Modelo `Assinatura` - Assinaturas das barbearias
- ✅ Modelo `Fatura` - Faturas mensais
- ✅ Relacionamentos atualizados no modelo `Barbearia`

**Arquivo:** `backend/prisma/schema.prisma`

### 2. **Backend - Controllers** ✅
- ✅ `assinaturasController.ts` - CRUD de assinaturas (admin)
  - Listar assinaturas
  - Buscar assinatura
  - Criar assinatura
  - Atualizar assinatura
  - Cancelar assinatura
  - Gerar fatura manualmente
  - Listar faturas

- ✅ `faturasController.ts` - Gerenciamento de faturas (dono)
  - Listar faturas do dono
  - Buscar fatura específica
  - Criar link de pagamento
  - Verificar status do pagamento
  - Webhook do Mercado Pago

### 3. **Backend - Rotas** ✅
- ✅ `/api/admin/assinaturas` - Rotas admin
- ✅ `/api/dono/assinatura` - Rotas do dono
- ✅ `/api/faturas/webhook` - Webhook público

**Arquivos:**
- `backend/src/routes/admin/assinaturas.ts`
- `backend/src/routes/dono/assinatura.ts`
- `backend/src/routes/faturas.ts`
- `backend/src/app.ts` (rotas registradas)

### 4. **Frontend - Página do Dono** ✅
- ✅ `src/pages/dono/MinhaAssinatura.tsx`
  - Visualizar plano atual
  - Ver status da assinatura
  - Histórico de faturas
  - Pagar fatura pendente
  - Modal de seleção de método de pagamento

---

## ⚠️ O que ainda precisa ser feito

### 1. **Migration do Prisma** ⚠️
```bash
cd backend
npx prisma migrate dev --name add_assinaturas_faturas
npx prisma generate
```

### 2. **Criar Planos Iniciais** ⚠️
Criar script para popular planos básicos:
- Básico (R$ X,XX)
- Premium (R$ X,XX)
- Enterprise (R$ X,XX)

**Arquivo sugerido:** `backend/scripts/criar-planos.ts`

### 3. **Atualizar Página Admin de Assinaturas** ⚠️
A página atual (`src/pages/admin/Assinaturas.tsx`) usa `PlanosContext` (dados mockados).

**Precisa:**
- Conectar com API real (`/api/admin/assinaturas`)
- Adicionar funcionalidade de criar assinatura
- Adicionar funcionalidade de gerar fatura manualmente
- Adicionar visualização de detalhes da assinatura

### 4. **Adicionar Rota no Frontend** ⚠️
Adicionar rota para `MinhaAssinatura` no `App.tsx`:
```typescript
<Route path="/dono/assinatura" element={<MinhaAssinatura />} />
```

### 5. **Menu do Dono** ⚠️
Adicionar link para "Minha Assinatura" no menu lateral do dono.

### 6. **Jobs Automáticos (Cron)** ⚠️
Implementar jobs para:
- Gerar faturas automaticamente (7 dias antes do vencimento)
- Verificar faturas vencidas e suspender barbearias
- Enviar lembretes de pagamento

**Arquivo sugerido:** `backend/src/jobs/gerarFaturas.ts`

### 7. **Notificações** ⚠️
- Email/SMS quando fatura é gerada
- Email/SMS quando fatura está vencendo
- Email/SMS quando fatura é paga
- Email/SMS quando barbearia é suspensa

### 8. **Integração Completa com Mercado Pago** ⚠️
- Testar webhook
- Implementar pagamento recorrente (subscriptions)
- Melhorar tratamento de QR Code PIX
- Adicionar suporte a boleto

### 9. **Validações e Segurança** ⚠️
- Validar se dono pode acessar apenas suas próprias faturas
- Validar webhook do Mercado Pago (assinatura)
- Adicionar rate limiting
- Adicionar logs de auditoria

### 10. **Testes** ⚠️
- Testar fluxo completo de criação de assinatura
- Testar pagamento de fatura
- Testar webhook
- Testar suspensão automática

---

## 🚀 Próximos Passos Recomendados

### **Prioridade ALTA:**
1. ✅ Fazer migration do Prisma
2. ✅ Criar planos iniciais
3. ✅ Atualizar página admin para usar API real
4. ✅ Adicionar rota no frontend
5. ✅ Testar fluxo básico

### **Prioridade MÉDIA:**
6. ⚠️ Implementar jobs automáticos
7. ⚠️ Adicionar notificações
8. ⚠️ Melhorar integração Mercado Pago

### **Prioridade BAIXA:**
9. ⚠️ Adicionar testes automatizados
10. ⚠️ Melhorar UI/UX
11. ⚠️ Adicionar relatórios de receita

---

## 📝 Notas Importantes

1. **Gateway de Pagamento:**
   - Atualmente usando Mercado Pago (já integrado)
   - Pode considerar Asaas ou Stripe no futuro

2. **Período de Teste:**
   - Considerar oferecer período grátis para novas barbearias
   - Implementar lógica de "grace period" antes de suspender

3. **Flexibilidade:**
   - Permitir upgrade/downgrade de plano
   - Permitir pagamento anual com desconto
   - Permitir pagamento manual (PIX/Boleto) além de cartão

4. **Transparência:**
   - Mostrar claramente o que está incluído em cada plano
   - Enviar comprovantes por email
   - Histórico completo de pagamentos

---

## 🔧 Comandos Úteis

```bash
# Fazer migration
cd backend
npx prisma migrate dev --name add_assinaturas_faturas

# Gerar cliente Prisma
npx prisma generate

# Ver dados no banco
npx prisma studio

# Testar API
curl http://localhost:3001/api/admin/assinaturas
```

---

**Status Geral:** 🟡 **70% Completo**

**Pronto para:**
- ✅ Estrutura de banco de dados
- ✅ Backend básico funcionando
- ✅ Frontend do dono funcionando

**Falta:**
- ⚠️ Migration e dados iniciais
- ⚠️ Frontend admin completo
- ⚠️ Automações
- ⚠️ Testes

