# 💰 Solução Completa: Sistema de Cobrança para Donos de Barbearia

## 📋 Visão Geral

Este documento apresenta uma solução completa para implementar cobrança de assinaturas mensais dos donos de barbearia que usam a plataforma.

---

## 🎯 Objetivos

1. **Cobrar mensalmente** os donos de barbearia pelo uso da plataforma
2. **Gerenciar assinaturas** pelo painel admin
3. **Permitir que donos paguem** suas assinaturas
4. **Automatizar cobranças** recorrentes
5. **Controlar acesso** baseado em pagamento

---

## 🏗️ Arquitetura Proposta

### 1. **Modelos de Banco de Dados**

Adicionar ao `schema.prisma`:

```prisma
// Plano de assinatura
model Plano {
  id                String      @id @default(uuid())
  nome              String      // Básico, Premium, Enterprise
  descricao         String?
  valorMensal       Float
  limiteBarbeiros   Int         @default(1)
  limiteAgendamentos Int       @default(100)
  recursos          String[]    @default([]) // Array de recursos
  ativo             Boolean     @default(true)
  
  assinaturas       Assinatura[]
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}

// Assinatura da barbearia
model Assinatura {
  id                String      @id @default(uuid())
  barbearia         Barbearia   @relation(fields: [barbeariaId], references: [id], onDelete: Cascade)
  barbeariaId       String      @unique
  plano             Plano       @relation(fields: [planoId], references: [id])
  planoId           String
  
  status            String      @default("ativa") // ativa, suspensa, cancelada, vencida
  dataInicio        DateTime    @default(now())
  dataVencimento    DateTime
  proximoVencimento  DateTime
  
  // Pagamento recorrente
  pagamentoRecorrente Boolean   @default(false) // Se tem pagamento automático configurado
  mercadoPagoSubscriptionId String? // ID da assinatura no Mercado Pago
  
  faturas            Fatura[]
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}

// Fatura mensal
model Fatura {
  id                String      @id @default(uuid())
  assinatura        Assinatura  @relation(fields: [assinaturaId], references: [id], onDelete: Cascade)
  assinaturaId      String
  
  valor             Float
  dataVencimento    DateTime
  dataPagamento     DateTime?
  status            String      @default("pendente") // pendente, paga, vencida, cancelada
  
  // Integração com gateway
  metodoPagamento   String?     // pix, boleto, cartao_credito, cartao_debito
  mercadoPagoPreferenceId String? // ID da preferência no Mercado Pago
  mercadoPagoPaymentId    String? // ID do pagamento quando aprovado
  mercadoPagoStatus       String? // approved, pending, rejected
  
  // Dados do pagamento
  linkPagamento     String?     // Link para pagar a fatura
  qrCodePix         String?     // QR Code PIX (base64)
  codigoBoleto      String?     // Código de barras do boleto
  
  observacoes       String?
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  @@index([assinaturaId, status])
  @@index([dataVencimento])
}
```

**Atualizar modelo Barbearia:**
```prisma
model Barbearia {
  // ... campos existentes ...
  
  assinatura        Assinatura? // Relacionamento com assinatura
}
```

---

## 🔧 Implementação Backend

### 1. **Controllers**

#### `backend/src/controllers/assinaturasController.ts`

```typescript
// Listar assinaturas (admin)
export async function listarAssinaturas(req: Request, res: Response)

// Buscar assinatura por barbearia
export async function buscarAssinatura(req: Request, res: Response)

// Criar assinatura (admin)
export async function criarAssinatura(req: Request, res: Response)

// Atualizar assinatura
export async function atualizarAssinatura(req: Request, res: Response)

// Cancelar assinatura
export async function cancelarAssinatura(req: Request, res: Response)

// Gerar fatura mensal
export async function gerarFatura(req: Request, res: Response)

// Listar faturas
export async function listarFaturas(req: Request, res: Response)

// Criar link de pagamento
export async function criarLinkPagamento(req: Request, res: Response)

// Webhook de pagamento (Mercado Pago)
export async function webhookPagamento(req: Request, res: Response)
```

#### `backend/src/controllers/faturasController.ts`

```typescript
// Listar faturas do dono
export async function listarMinhasFaturas(req: AuthRequest, res: Response)

// Buscar fatura
export async function buscarFatura(req: AuthRequest, res: Response)

// Criar link de pagamento
export async function criarLinkPagamento(req: AuthRequest, res: Response)

// Verificar status do pagamento
export async function verificarStatusPagamento(req: AuthRequest, res: Response)
```

### 2. **Rotas**

#### `backend/src/routes/admin/assinaturas.ts`

```typescript
router.get('/', assinaturasController.listarAssinaturas);
router.get('/:id', assinaturasController.buscarAssinatura);
router.post('/', assinaturasController.criarAssinatura);
router.put('/:id', assinaturasController.atualizarAssinatura);
router.delete('/:id', assinaturasController.cancelarAssinatura);
router.post('/:id/gerar-fatura', assinaturasController.gerarFatura);
router.get('/:id/faturas', assinaturasController.listarFaturas);
```

#### `backend/src/routes/dono/assinatura.ts`

```typescript
router.use(autenticarDono);

router.get('/', faturasController.listarMinhasFaturas);
router.get('/faturas/:id', faturasController.buscarFatura);
router.post('/faturas/:id/pagar', faturasController.criarLinkPagamento);
router.get('/faturas/:id/status', faturasController.verificarStatusPagamento);
```

### 3. **Serviço de Integração com Mercado Pago**

#### `backend/src/services/assinaturaMercadoPago.ts`

```typescript
// Criar assinatura recorrente no Mercado Pago
export async function criarAssinaturaRecorrente(dados: {
  barbeariaId: string;
  valor: number;
  email: string;
  nome: string;
}): Promise<string> // Retorna subscription_id

// Criar link de pagamento único (PIX/Boleto)
export async function criarLinkPagamentoUnico(dados: {
  faturaId: string;
  valor: number;
  email: string;
  nome: string;
  dataVencimento: Date;
}): Promise<{
  linkPagamento: string;
  qrCodePix?: string;
  codigoBoleto?: string;
}>

// Verificar status do pagamento
export async function verificarStatusPagamento(paymentId: string)

// Processar webhook
export async function processarWebhook(dados: any)
```

### 4. **Job Automático (Cron)**

#### `backend/src/jobs/gerarFaturas.ts`

```typescript
// Executar diariamente às 00:00
// Gerar faturas para assinaturas que estão vencendo em 7 dias
export async function gerarFaturasMensais()

// Executar diariamente às 08:00
// Verificar faturas vencidas e suspender barbearias
export async function verificarFaturasVencidas()

// Executar diariamente às 10:00
// Enviar lembretes de pagamento
export async function enviarLembretesPagamento()
```

---

## 🎨 Implementação Frontend

### 1. **Página no Painel Admin**

#### `src/pages/admin/Assinaturas.tsx` (Atualizar)

- ✅ Listar todas as assinaturas
- ✅ Ver status de cada assinatura
- ✅ Gerar fatura manualmente
- ✅ Ver histórico de pagamentos
- ✅ Suspender/Ativar assinatura
- ✅ Cancelar assinatura

### 2. **Página no Painel do Dono**

#### `src/pages/dono/MinhaAssinatura.tsx` (Nova)

- ✅ Ver plano atual
- ✅ Ver próxima fatura
- ✅ Histórico de faturas
- ✅ Pagar fatura pendente
- ✅ Ver status do pagamento
- ✅ Baixar comprovante

### 3. **Componente de Pagamento**

#### `src/components/assinatura/PagamentoFatura.tsx` (Nova)

- ✅ Seleção de método de pagamento
- ✅ PIX (QR Code)
- ✅ Boleto
- ✅ Cartão de Crédito (recorrente)
- ✅ Status do pagamento

---

## 💳 Opções de Gateway de Pagamento

### **Opção 1: Mercado Pago (Recomendado - Já Integrado)**

**Vantagens:**
- ✅ Já está integrado no sistema
- ✅ Suporta PIX, Boleto, Cartão
- ✅ Suporta assinaturas recorrentes
- ✅ Webhooks confiáveis
- ✅ Taxas competitivas

**Taxas:**
- PIX: ~1.99% + R$ 0,60
- Boleto: ~1.99% + R$ 0,60
- Cartão: ~4.99% + R$ 0,60

**Implementação:**
- Usar Mercado Pago Subscriptions API para pagamentos recorrentes
- Usar Preferências API para pagamentos únicos (PIX/Boleto)

### **Opção 2: Asaas**

**Vantagens:**
- ✅ Focado em cobrança recorrente
- ✅ Taxas menores
- ✅ API simples
- ✅ Suporte a PIX, Boleto, Cartão

**Taxas:**
- PIX: ~1.99% + R$ 0,60
- Boleto: ~2.99% + R$ 0,60
- Cartão: ~4.99% + R$ 0,60

### **Opção 3: Stripe**

**Vantagens:**
- ✅ Internacional
- ✅ Muito confiável
- ✅ Excelente documentação
- ✅ Suporte a múltiplas moedas

**Desvantagens:**
- ⚠️ Taxas mais altas
- ⚠️ Menos popular no Brasil

---

## 📊 Fluxo de Cobrança

### **Fluxo 1: Primeira Assinatura (Admin cria)**

```
1. Admin cria barbearia → Define plano
2. Sistema cria Assinatura
3. Sistema gera primeira Fatura
4. Admin envia link de pagamento para dono
5. Dono paga → Sistema ativa barbearia
```

### **Fluxo 2: Cobrança Mensal Automática**

```
1. Job diário verifica assinaturas vencendo em 7 dias
2. Sistema gera Fatura automaticamente
3. Sistema envia email/SMS para dono
4. Dono recebe link de pagamento
5. Dono paga → Sistema renova assinatura
6. Se não pagar até vencimento → Sistema suspende barbearia
```

### **Fluxo 3: Pagamento Recorrente (Cartão)**

```
1. Dono cadastra cartão de crédito
2. Sistema cria assinatura recorrente no Mercado Pago
3. Mercado Pago cobra automaticamente todo mês
4. Webhook confirma pagamento
5. Sistema renova assinatura automaticamente
```

---

## 🔐 Controle de Acesso

### **Suspender Barbearia por Inadimplência**

```typescript
// Quando fatura vence sem pagamento
if (fatura.status === 'vencida' && diasVencida > 7) {
  // Suspender barbearia
  await prisma.barbearia.update({
    where: { id: barbeariaId },
    data: { 
      status: 'bloqueada',
      // Adicionar motivo
    }
  });
  
  // Bloquear acesso do dono
  // Enviar notificação
}
```

### **Reativar após Pagamento**

```typescript
// Quando fatura é paga
if (fatura.status === 'paga') {
  // Reativar barbearia
  await prisma.barbearia.update({
    where: { id: barbeariaId },
    data: { status: 'ativa' }
  });
  
  // Renovar assinatura
  await prisma.assinatura.update({
    where: { id: assinaturaId },
    data: {
      dataVencimento: proximoMes,
      proximoVencimento: proximoMes,
    }
  });
}
```

---

## 📝 Recomendações de Implementação

### **Fase 1: Estrutura Básica (Semana 1)**
1. ✅ Adicionar modelos ao Prisma
2. ✅ Criar migrations
3. ✅ Criar controllers básicos
4. ✅ Criar rotas

### **Fase 2: Integração com Gateway (Semana 2)**
1. ✅ Integrar Mercado Pago Subscriptions
2. ✅ Criar links de pagamento
3. ✅ Implementar webhooks
4. ✅ Testar fluxo completo

### **Fase 3: Interface Admin (Semana 3)**
1. ✅ Atualizar página de Assinaturas
2. ✅ Adicionar geração manual de fatura
3. ✅ Adicionar controle de status

### **Fase 4: Interface Dono (Semana 4)**
1. ✅ Criar página Minha Assinatura
2. ✅ Componente de pagamento
3. ✅ Histórico de faturas

### **Fase 5: Automação (Semana 5)**
1. ✅ Jobs automáticos
2. ✅ Envio de lembretes
3. ✅ Suspensão automática

---

## 💡 Dicas e Boas Práticas

1. **Período de Teste Gratuito:**
   - Oferecer 7-14 dias grátis para novas barbearias
   - Apenas após período começar a cobrar

2. **Notificações:**
   - 7 dias antes do vencimento
   - 3 dias antes do vencimento
   - No dia do vencimento
   - Após vencimento (diariamente até pagar)

3. **Flexibilidade:**
   - Permitir pagamento manual (PIX/Boleto)
   - Oferecer desconto para pagamento anual
   - Permitir upgrade/downgrade de plano

4. **Transparência:**
   - Mostrar claramente o que está incluído no plano
   - Mostrar histórico completo de pagamentos
   - Enviar comprovantes por email

---

## 🚀 Próximos Passos

1. **Decidir gateway de pagamento** (Recomendo Mercado Pago)
2. **Criar modelos no Prisma**
3. **Implementar backend**
4. **Criar interfaces frontend**
5. **Testar fluxo completo**
6. **Implementar automações**

---

**Precisa de ajuda para implementar alguma parte específica?** Posso começar pela parte que você considerar mais prioritária!

