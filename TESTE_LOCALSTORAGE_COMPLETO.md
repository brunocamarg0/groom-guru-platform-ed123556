# 🧪 Teste Completo de localStorage

## Execute no Console do Navegador (F12)

### 1. Teste Básico de localStorage
```javascript
console.log('=== TESTE 1: localStorage básico ===');
localStorage.setItem('teste', '123');
const teste = localStorage.getItem('teste');
console.log('Teste salvo:', teste);
console.log('Resultado:', teste === '123' ? '✅ Funciona' : '❌ Não funciona');
```

### 2. Verificar Estado Atual
```javascript
console.log('\n=== TESTE 2: Estado atual do localStorage ===');
console.log('Token:', localStorage.getItem('token'));
console.log('UserType:', localStorage.getItem('userType'));
console.log('User:', localStorage.getItem('user'));
console.log('Barbearia:', localStorage.getItem('barbearia'));
```

### 3. Tentar Salvar Token Manualmente
```javascript
console.log('\n=== TESTE 3: Salvar token manualmente ===');
const tokenTeste = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QiLCJlbWFpbCI6InRlc3RlQGV4YW1wbGUuY29tIiwidGlwbyI6ImRvbm8iLCJiYXJiZWFyaWFJZCI6IjFkNTZjODk4LTE5ZTQtNDkyNC05Y2MzLWJhMjM4NzJhNDZjNyIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.teste';
localStorage.setItem('token', tokenTeste);
localStorage.setItem('userType', 'dono');
console.log('Token salvo:', localStorage.getItem('token'));
console.log('UserType salvo:', localStorage.getItem('userType'));
```

### 4. Verificar se Foi Salvo
```javascript
console.log('\n=== TESTE 4: Verificação ===');
const tokenVerificado = localStorage.getItem('token');
const userTypeVerificado = localStorage.getItem('userType');
console.log('Token presente:', !!tokenVerificado);
console.log('UserType presente:', !!userTypeVerificado);
console.log('Resultado:', (tokenVerificado && userTypeVerificado) ? '✅ Salvo com sucesso' : '❌ Não foi salvo');
```

### 5. Verificar se Há Algo Interferindo
```javascript
console.log('\n=== TESTE 5: Verificar interferências ===');
const originalSetItem = Storage.prototype.setItem;
const originalRemoveItem = Storage.prototype.removeItem;
const originalClear = Storage.prototype.clear;

let setItemCount = 0;
let removeItemCount = 0;
let clearCount = 0;

Storage.prototype.setItem = function(key, value) {
  setItemCount++;
  if (key === 'token' || key === 'userType') {
    console.log(`🔔 setItem chamado: ${key} = ${key === 'token' ? value.substring(0, 30) + '...' : value}`);
  }
  return originalSetItem.apply(this, [key, value]);
};

Storage.prototype.removeItem = function(key) {
  removeItemCount++;
  if (key === 'token' || key === 'userType') {
    console.error(`❌ removeItem chamado: ${key}`);
  }
  return originalRemoveItem.apply(this, [key]);
};

Storage.prototype.clear = function() {
  clearCount++;
  console.error('❌ clear() chamado!');
  return originalClear.apply(this);
};

console.log('Interceptação ativada. Agora tente fazer login e observe os logs.');
console.log('Contadores: setItem=' + setItemCount + ', removeItem=' + removeItemCount + ', clear=' + clearCount);
```

### 6. Limpar Teste
```javascript
console.log('\n=== TESTE 6: Limpar teste ===');
localStorage.removeItem('teste');
console.log('Limpeza concluída');
```

## Resultado Esperado

Se o localStorage estiver funcionando:
- ✅ Teste 1 deve retornar "Funciona"
- ✅ Teste 3 deve salvar o token
- ✅ Teste 4 deve confirmar que foi salvo

Se houver interferência:
- ❌ Teste 5 mostrará quando `removeItem` ou `clear` são chamados

