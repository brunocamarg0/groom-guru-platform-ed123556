# 🧪 Teste do Formulário de Login

## Execute no Console do Navegador (F12) - NA PÁGINA DE LOGIN

### 1. Verificar se o formulário existe
```javascript
console.log('=== TESTE 1: Verificar formulário ===');
const form = document.querySelector('form');
console.log('Formulário encontrado:', !!form);
console.log('Formulário:', form);
```

### 2. Verificar se o botão existe
```javascript
console.log('\n=== TESTE 2: Verificar botão ===');
const button = document.querySelector('button[type="submit"]');
console.log('Botão encontrado:', !!button);
console.log('Botão:', button);
console.log('Botão disabled:', button?.disabled);
```

### 3. Simular clique no botão
```javascript
console.log('\n=== TESTE 3: Simular clique no botão ===');
const button = document.querySelector('button[type="submit"]');
if (button) {
  console.log('Clicando no botão...');
  button.click();
  console.log('Clique executado!');
} else {
  console.error('Botão não encontrado!');
}
```

### 4. Simular submit do formulário
```javascript
console.log('\n=== TESTE 4: Simular submit do formulário ===');
const form = document.querySelector('form');
if (form) {
  console.log('Submetendo formulário...');
  const event = new Event('submit', { bubbles: true, cancelable: true });
  form.dispatchEvent(event);
  console.log('Submit executado!');
} else {
  console.error('Formulário não encontrado!');
}
```

### 5. Verificar se há erros JavaScript
```javascript
console.log('\n=== TESTE 5: Verificar erros JavaScript ===');
window.addEventListener('error', (event) => {
  console.error('❌ Erro JavaScript capturado:', event.error);
  console.error('   Mensagem:', event.message);
  console.error('   Arquivo:', event.filename);
  console.error('   Linha:', event.lineno);
});
console.log('Listener de erros ativado. Tente fazer login e observe os erros.');
```

## Resultado Esperado

Se o formulário estiver funcionando:
- ✅ Teste 1 deve encontrar o formulário
- ✅ Teste 2 deve encontrar o botão
- ✅ Teste 3 deve disparar o evento de clique
- ✅ Teste 4 deve disparar o evento de submit

Se houver problemas:
- ❌ Teste 5 mostrará erros JavaScript

