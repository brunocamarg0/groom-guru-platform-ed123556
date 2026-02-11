# Guia de Teste - Planos e Assinaturas de Clientes

Este guia explica como testar o sistema de planos e assinaturas de clientes com comissões para profissionais.

## 📋 Pré-requisitos

1. **Ter acesso ao painel do dono** (barbearia logada)
2. **Ter pelo menos um cliente cadastrado**
3. **Ter pelo menos um profissional cadastrado** (para testar comissões)

---

## 🧪 Passo a Passo para Testar

### **1. Criar um Plano de Cliente**

1. **Acesse o painel do dono:**
   - Faça login como dono da barbearia
   - URL: `/dono`

2. **Navegue para "Planos de Clientes":**
   - No menu lateral, clique em **"Planos de Clientes"**
   - Ou acesse diretamente: `/dono/planos-cliente`

3. **Criar um novo plano:**
   - Clique no botão **"Novo Plano"** (canto superior direito)
   - Preencha os campos:
     - **Nome do Plano**: Ex: "Plano Mensal Premium"
     - **Duração**: Selecione (Mensal, Trimestral, Semestral, Anual)
     - **Valor Mensal**: Ex: R$ 150,00
     - **Descrição** (opcional): Ex: "Plano com desconto de 20% em todos os serviços"
     - **Benefícios**: Adicione benefícios clicando em "Adicionar" após digitar cada um
       - Ex: "Desconto de 20% em todos os serviços"
       - Ex: "Corte grátis no aniversário"
   - Marque **"Plano Ativo"** como ativado
   - Clique em **"Criar Plano"**

4. **Verificar criação:**
   - O plano deve aparecer na tabela
   - Verifique se o valor total está correto (valor mensal × duração)

---

### **2. Configurar Comissão do Profissional**

1. **Acesse "Profissionais":**
   - No menu lateral, clique em **"Profissionais"**
   - Ou acesse: `/dono/profissionais`

2. **Editar um profissional:**
   - Clique no ícone de editar (lápis) de um profissional
   - Procure o campo **"Comissão por Assinatura"**
   - Defina um valor fixo, ex: R$ 30,00
   - Salve as alterações

> **Nota:** Este valor será pago ao profissional sempre que um cliente com assinatura fizer um pagamento.

---

### **3. Criar uma Assinatura para um Cliente**

#### **Opção A: Via Interface (se implementado)**
1. **Acesse "Assinaturas":**
   - No menu lateral, clique em **"Assinaturas"**
   - Ou acesse: `/dono/assinaturas-cliente`

2. **Criar nova assinatura:**
   - Clique em **"Nova Assinatura"**
   - Selecione:
     - **Cliente**: Escolha um cliente da lista
     - **Plano**: Selecione o plano criado anteriormente
     - **Profissional** (opcional): Selecione o profissional responsável
   - Clique em **"Criar Assinatura"**

#### **Opção B: Via API (Postman/Insomnia)**
Se a interface ainda não tiver o botão de criar, use a API diretamente:

**Endpoint:** `POST /api/dono/assinaturas-cliente`

**Headers:**
```
Authorization: Bearer {seu_token}
Content-Type: application/json
```

**Body:**
```json
{
  "clienteId": "id_do_cliente",
  "planoId": "id_do_plano",
  "profissionalId": "id_do_profissional" // opcional
}
```

**Exemplo de resposta:**
```json
{
  "id": "uuid",
  "cliente": { "nome": "João Silva", "email": "joao@email.com" },
  "plano": { "nome": "Plano Mensal Premium", "valor": 150 },
  "status": "ativa",
  "dataInicio": "2024-01-30T...",
  "dataVencimento": "2024-02-29T..."
}
```

---

### **4. Visualizar Assinatura no Painel do Cliente**

1. **Faça login como cliente:**
   - Use as credenciais do cliente que recebeu a assinatura
   - URL: `/cliente`

2. **Acesse "Minha Assinatura":**
   - No menu lateral, clique em **"Minha Assinatura"**
   - Ou acesse: `/cliente/assinatura`

3. **Verificar informações:**
   - Deve aparecer o plano ativo
   - Status da assinatura
   - Datas de início e vencimento
   - Benefícios do plano
   - Profissional responsável (se atribuído)
   - Histórico de pagamentos (na aba "Pagamentos")

---

### **5. Criar um Pagamento de Assinatura**

#### **Via API (Postman/Insomnia)**

**Endpoint:** `POST /api/dono/pagamentos-assinatura`

**Headers:**
```
Authorization: Bearer {seu_token}
Content-Type: application/json
```

**Body:**
```json
{
  "assinaturaId": "id_da_assinatura",
  "valor": 150.00,
  "dataVencimento": "2024-02-29T00:00:00.000Z"
}
```

**O que acontece:**
- Um pagamento é criado
- Uma comissão é automaticamente gerada para o profissional (se houver)
- O valor da comissão será o definido no campo `comissaoAssinatura` do profissional

---

### **6. Visualizar Comissões por Assinatura**

1. **Acesse "Comissões":**
   - No menu lateral do dono, clique em **"Comissões"**
   - Ou acesse: `/dono/comissoes`

2. **Acesse a aba "Comissões por Assinatura":**
   - Clique na aba **"Comissões por Assinatura"**

3. **Selecionar profissional:**
   - No dropdown, selecione o profissional que tem comissões
   - As comissões aparecerão na tabela

4. **Verificar informações:**
   - Cliente
   - Plano
   - Valor total do pagamento
   - Valor da comissão
   - Status (Pago/Pendente)

5. **Marcar comissão como paga:**
   - Clique em **"Marcar como Pago"** em uma comissão pendente
   - A comissão será marcada como paga

---

### **7. Gerenciar Assinaturas (Dono)**

1. **Acesse "Assinaturas":**
   - `/dono/assinaturas-cliente`

2. **Filtrar assinaturas:**
   - Use os filtros por **Status** (Ativa, Suspensa, Cancelada, Vencida)
   - Use o filtro por **Profissional**
   - Use a busca por nome do cliente ou plano

3. **Ver detalhes:**
   - Clique no ícone do olho (👁️) em uma assinatura
   - Veja informações completas:
     - Dados do cliente
     - Informações do plano
     - Datas importantes
     - Histórico de pagamentos
     - Comissões geradas

---

## 🔍 Checklist de Testes

### ✅ Funcionalidades Básicas
- [ ] Criar um plano de cliente
- [ ] Editar um plano existente
- [ ] Ativar/desativar um plano
- [ ] Criar uma assinatura para um cliente
- [ ] Visualizar assinatura no painel do cliente
- [ ] Criar um pagamento de assinatura
- [ ] Ver comissões por assinatura
- [ ] Marcar comissão como paga

### ✅ Validações
- [ ] Não permite criar assinatura duplicada para o mesmo cliente
- [ ] Calcula corretamente o valor total (valor × duração)
- [ ] Gera comissão automaticamente ao criar pagamento
- [ ] Filtros funcionam corretamente
- [ ] Busca funciona corretamente

### ✅ Interface
- [ ] Todas as páginas carregam sem erros
- [ ] Formatação de moeda está correta
- [ ] Formatação de datas está correta
- [ ] Modais abrem e fecham corretamente
- [ ] Mensagens de sucesso/erro aparecem

---

## 🐛 Problemas Comuns e Soluções

### **Erro: "Cliente já possui assinatura ativa"**
- **Solução:** Cancele a assinatura existente antes de criar uma nova, ou atualize a existente.

### **Erro: "Plano não encontrado"**
- **Solução:** Verifique se o plano está ativo e pertence à sua barbearia.

### **Comissão não aparece**
- **Solução:** 
  1. Verifique se o profissional tem `comissaoAssinatura` configurado
  2. Verifique se o pagamento foi criado corretamente
  3. Verifique se o profissional foi atribuído à assinatura

### **Assinatura não aparece no painel do cliente**
- **Solução:**
  1. Verifique se o cliente está logado com a conta correta
  2. Verifique se a assinatura está com status "ativa"
  3. Verifique se o clienteId está correto

---

## 📊 Dados de Teste Sugeridos

### **Plano 1: Mensal Básico**
- Nome: "Plano Mensal Básico"
- Duração: 1 mês
- Valor: R$ 100,00
- Benefícios: "Desconto de 10% em todos os serviços"

### **Plano 2: Trimestral Premium**
- Nome: "Plano Trimestral Premium"
- Duração: 3 meses
- Valor: R$ 120,00
- Benefícios: 
  - "Desconto de 20% em todos os serviços"
  - "Corte grátis no aniversário"
  - "Produtos com 15% de desconto"

### **Profissional**
- Comissão por Assinatura: R$ 25,00

---

## 🎯 Próximos Passos

Após testar todas as funcionalidades básicas, você pode:

1. **Testar integração com Mercado Pago** (quando implementado)
2. **Testar pagamentos recorrentes**
3. **Testar cancelamento de assinaturas**
4. **Testar relatórios e exportações**

---

## 📝 Notas Importantes

- As comissões são calculadas automaticamente quando um pagamento é criado
- Um cliente pode ter apenas uma assinatura ativa por vez
- Os planos são específicos de cada barbearia
- As comissões são pagas por pagamento, não por assinatura

---

**Boa sorte com os testes! 🚀**

