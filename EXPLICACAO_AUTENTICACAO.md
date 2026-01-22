# 🔐 Explicação do Fluxo de Autenticação

## O que o middleware `autenticarDono` verifica:

### **Etapa 1: Verificar se o token foi enviado**
```typescript
const authHeader = req.headers.authorization;
if (!token) {
  return res.status(401).json({ error: 'Token não fornecido' });
}
```
**O que verifica:** Se o header `Authorization` está presente na requisição.

---

### **Etapa 2: Extrair o token do header**
```typescript
const token = authHeader?.replace('Bearer ', '').trim();
```
**O que verifica:** Remove o prefixo "Bearer " e extrai apenas o token JWT.

**Formato esperado:** `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

### **Etapa 3: Verificar formato do token**
```typescript
const tokenParts = token.split('.');
if (tokenParts.length !== 3) {
  return res.status(401).json({ error: 'Token inválido: formato incorreto' });
}
```
**O que verifica:** Se o token tem o formato correto de JWT (3 partes separadas por ponto).

**Formato JWT:** `header.payload.signature`
- Exemplo: `eyJhbGciOiJIUzI1NiIs.eyJpZCI6IjEyMyJ9.signature`

---

### **Etapa 4: Verificar assinatura do token (CRÍTICO)**
```typescript
const jwtSecret = obterJWTSecret(); // Pega JWT_SECRET do ambiente
const decoded = jwt.verify(token, jwtSecret);
```
**O que verifica:**
1. **Assinatura:** Se o token foi assinado com o mesmo `JWT_SECRET` usado para gerá-lo
2. **Expiração:** Se o token ainda está válido (não expirou)
3. **Formato:** Se o token é um JWT válido

**Possíveis erros:**
- `JsonWebTokenError`: Token foi assinado com um secret diferente
- `TokenExpiredError`: Token expirou (válido por 7 dias)
- `NotBeforeError`: Token ainda não é válido

**⚠️ PROBLEMA ATUAL:** Esta etapa está falhando para `/dono/financeiro/pagamentos`, mas funciona para outras rotas.

---

### **Etapa 5: Extrair dados do token**
```typescript
const userId = decoded.id || decoded.userId;
if (!userId) {
  return res.status(401).json({ error: 'Token inválido: ID do usuário não encontrado' });
}
```
**O que verifica:** Se o token contém o ID do usuário.

**Dados esperados no token:**
```json
{
  "id": "0f735f52-8124-440d-abf6-3b158e921ebe",
  "email": "dono@exemplo.com",
  "tipo": "dono",
  "barbeariaId": "2c43d93b-fd36-4ed3-b723-2f68e681a1ce"
}
```

---

### **Etapa 6: Verificar se o usuário existe no banco**
```typescript
const dono = await prisma.usuarioDono.findUnique({
  where: { id: userId },
  include: { barbearia: true },
});

if (!dono) {
  return res.status(401).json({ error: 'Usuário não encontrado' });
}
```
**O que verifica:** Se o usuário dono existe no banco de dados.

---

### **Etapa 7: Verificar se o usuário está ativo**
```typescript
if (!dono.ativo) {
  return res.status(401).json({ error: 'Usuário inativo' });
}
```
**O que verifica:** Se o usuário está ativo (não foi desativado).

---

### **Etapa 8: Adicionar dados ao request**
```typescript
req.userId = dono.id;
req.userType = 'dono';
req.barbeariaId = dono.barbeariaId;
next(); // Continua para a próxima rota
```
**O que faz:** Adiciona os dados do usuário autenticado ao objeto `req` para uso nas rotas.

---

## 🔍 Por que está falhando?

Pelos logs que você compartilhou, vejo que:
- ✅ Token está presente
- ✅ JWT_SECRET está configurado
- ✅ Está buscando o dono no banco

**Mas os logs estão cortados**, então não sabemos se:
- ❓ A verificação JWT (`jwt.verify`) está passando ou falhando
- ❓ O dono está sendo encontrado no banco
- ❓ O dono está ativo

## 📊 Fluxo Visual

```
Requisição → Verificar Token Presente
              ↓
         Extrair Token
              ↓
         Verificar Formato (3 partes)
              ↓
    ⚠️ VERIFICAR ASSINATURA JWT ⚠️ ← AQUI ESTÁ FALHANDO
              ↓
         Extrair userId do token
              ↓
         Buscar dono no banco
              ↓
         Verificar se está ativo
              ↓
         ✅ Autenticação OK
              ↓
         Continuar para a rota
```

## 🎯 Próximos Passos

Com os logs detalhados que adicionei, vamos conseguir ver exatamente em qual etapa está falhando:

1. **Se falhar na Etapa 4 (jwt.verify):**
   - Veremos o tipo de erro (`JsonWebTokenError`, `TokenExpiredError`, etc.)
   - Veremos o JWT_SECRET usado
   - Isso indicará se o problema é secret diferente ou token expirado

2. **Se falhar na Etapa 6 (buscar dono):**
   - Veremos "Dono não encontrado no banco"
   - Isso indicará problema no banco de dados

3. **Se falhar na Etapa 7 (usuário inativo):**
   - Veremos "Dono inativo"
   - Isso indicará que o usuário foi desativado


