# Configuração do Email de Boas-Vindas

## 📧 Funcionalidade

O sistema agora envia automaticamente um email de boas-vindas para todos os donos de barbearia que realizam o primeiro cadastro no sistema.

## ✅ Onde o email é enviado

O email de boas-vindas é enviado automaticamente nos seguintes casos:

1. **Cadastro Direto de Dono** (`/api/auth/cadastro-direto-dono`)
   - Quando um dono cria sua conta e barbearia simultaneamente

2. **Registro de Dono** (`/api/auth/registrar-dono`)
   - Quando um dono se registra vinculando-se a uma barbearia já criada

3. **Criação de Usuário Dono pelo Admin** (`/api/admin/usuarios`)
   - Quando um admin cria um usuário dono para uma barbearia

## 🔧 Configuração

### Variável de Ambiente: Link do Formulário

Para configurar o link do formulário de conhecimento da barbearia, adicione a seguinte variável de ambiente:

```env
FORMULARIO_BARBEARIA_LINK=https://forms.gle/seu-formulario-aqui
```

**Onde configurar:**
- **Railway**: Settings → Variables → Add Variable
- **Nome**: `FORMULARIO_BARBEARIA_LINK`
- **Valor**: URL completa do formulário (ex: `https://forms.gle/abc123xyz`)

**Nota:** Se a variável não for configurada, o sistema usará um link padrão. Certifique-se de configurar o link correto antes de colocar em produção.

## 📝 Conteúdo do Email

O email contém:

- **Assunto**: "Bem-vindo ao Barber Maestro – A nova era da sua barbearia"
- **Remetente**: Bernardo Strabelli (fundador do Barber Maestro)
- **Conteúdo**:
  - Mensagem de boas-vindas personalizada com o nome da barbearia
  - Informações sobre o sistema
  - Lista de funcionalidades disponíveis
  - Link para o formulário de conhecimento da barbearia
  - Informações sobre o treinamento inicial

## 🎨 Personalização

O email é personalizado automaticamente com:
- **Nome da Barbearia**: Substitui `XXX` no texto pelo nome real da barbearia
- **Link do Formulário**: Usa a variável `FORMULARIO_BARBEARIA_LINK` ou link padrão

## ⚠️ Importante

- O envio de email **não bloqueia** o cadastro se falhar
- Se houver erro no envio, será apenas logado no console
- O cadastro será concluído normalmente mesmo se o email não for enviado
- Isso garante que problemas com o serviço de email não impeçam novos cadastros

## 🔍 Verificação

Para verificar se o email está sendo enviado:

1. **Logs do Backend**: Procure por `[EMAIL BOAS-VINDAS]` nos logs
2. **Resend Dashboard**: Se estiver usando Resend, verifique o dashboard
3. **Ethereal Email**: Se estiver em desenvolvimento, acesse https://ethereal.email

## 📋 Checklist de Configuração

- [ ] Variável `FORMULARIO_BARBEARIA_LINK` configurada no Railway
- [ ] Serviço de email configurado (Resend ou SMTP)
- [ ] Testar cadastro de dono e verificar recebimento do email
- [ ] Verificar se o link do formulário está correto no email

## 🚀 Próximos Passos

Após configurar:

1. Teste o cadastro de um dono
2. Verifique se o email foi recebido
3. Confirme que o link do formulário está funcionando
4. Ajuste o conteúdo do email se necessário (em `backend/src/services/emailService.ts`)

