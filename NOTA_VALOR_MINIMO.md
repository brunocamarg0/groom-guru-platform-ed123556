# ⚠️ Nota Importante: Valor Mínimo para Testes

## 💰 Valores Configurados

Todos os serviços foram configurados com **R$ 0,01** (1 centavo) para facilitar testes de pagamento.

## ⚠️ Limitação do Mercado Pago

**IMPORTANTE:** O Mercado Pago pode **não aceitar** valores menores que **R$ 1,00** para alguns métodos de pagamento.

### Valores Mínimos por Método:

- **Cartão de Crédito/Débito:** Geralmente aceita de R$ 0,01 a R$ 1,00
- **PIX:** Pode exigir mínimo de R$ 1,00
- **Boleto:** Geralmente mínimo de R$ 5,00

## 🔧 Se o Pagamento Falhar

Se você receber erro ao tentar pagar com R$ 0,01, ajuste os preços dos serviços para:

**Mínimo recomendado para testes: R$ 1,00**

### Como Ajustar:

1. Abra: `src/context/ClienteContext.tsx`
2. Procure por: `preco: 0.01`
3. Altere para: `preco: 1.0`

**Ou** envie um comando e eu faço a alteração automaticamente.

## ✅ Valores Atuais

Todos os serviços estão configurados com:
- Corte Masculino: R$ 0,01
- Barba Completa: R$ 0,01
- Corte + Barba: R$ 0,01
- Sobrancelha: R$ 0,01
- Relaxamento Capilar: R$ 0,01

## 🧪 Testando

1. Tente fazer um pagamento com R$ 0,01
2. Se funcionar: ✅ Perfeito! Continue testando
3. Se der erro: ⚠️ Ajuste para R$ 1,00

## 💡 Recomendação

Para evitar problemas, recomendo usar **R$ 1,00** como valor mínimo para testes, pois:
- ✅ Funciona com todos os métodos de pagamento
- ✅ Ainda é um valor baixo para testes
- ✅ Evita erros do Mercado Pago
- ✅ Simula melhor um pagamento real

---

**Quer que eu ajuste para R$ 1,00 agora?** É só me avisar! 😊

