# 🔐 Como os Admins Acessam o Painel

## 📋 Informações Importantes

A aba **Admin foi removida** da tela de login pública (`/login`) por questões de segurança, já que apenas 2 pessoas terão acesso.

## 👥 Usuários Admin Cadastrados

1. **Bernardo Strabelli**
   - Email: `bernardostrabelli@gmail.com`
   - Senha: `Squaredadmin`

2. **Bruno Camargo**
   - Email: `brunocamargocontato@hotmail.com`
   - Senha: `Squaredadmin`

## 🔑 Como Acessar o Painel Admin

### Opção 1: Acesso Direto (Recomendado)

Os admins podem acessar diretamente a URL:
```
https://seu-site.com/admin
```

O `AdminLayout` verificará automaticamente se há um token válido no `localStorage`. Se não houver, redirecionará para o login.

### Opção 2: Login via API Direta

Os admins podem fazer login diretamente via API:

```javascript
// No console do navegador (F12)
const response = await fetch('https://seu-backend.com/api/auth/admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'bernardostrabelli@gmail.com',
    senha: 'Squaredadmin'
  })
});

const data = await response.json();
if (data.token) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('userType', 'admin');
  window.location.href = '/admin';
}
```

### Opção 3: Criar Página de Login Admin Separada (Futuro)

Se necessário, pode ser criada uma página de login admin separada em `/admin/login` que não apareça na navegação pública.

## 🛠️ Como Criar/Atualizar os Admins no Banco

Execute o script:

```bash
cd backend
npx tsx scripts/criar-admins.ts
```

Este script:
- ✅ Cria os dois usuários admin se não existirem
- ✅ Atualiza a senha se já existirem
- ✅ Criptografa a senha automaticamente usando bcrypt
- ✅ Ativa os usuários

## 🔒 Segurança

- ✅ Senhas são armazenadas criptografadas (bcrypt)
- ✅ Apenas 2 usuários têm acesso
- ✅ Aba admin removida da tela de login pública
- ✅ Verificação de token no AdminLayout

## 📝 Notas

- Os admins devem manter suas credenciais seguras
- Se esquecerem a senha, podem usar o script para redefinir
- O acesso direto a `/admin` requer autenticação válida

