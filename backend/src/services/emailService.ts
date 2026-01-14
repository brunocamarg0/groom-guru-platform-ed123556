import nodemailer from 'nodemailer';

// Cache para transporter
let transporterCache: nodemailer.Transporter | null = null;

// Configuração do transporter de email
// Para desenvolvimento, pode usar Ethereal Email (fake SMTP) ou configurar SMTP real
const createTransporter = async (): Promise<nodemailer.Transporter> => {
  // Se já tem cache, retorna
  if (transporterCache) {
    return transporterCache;
  }

  // Se tiver variáveis de ambiente configuradas, usa SMTP real
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    console.log('📧 [EMAIL] Configurando SMTP real para produção');
    console.log('📧 [EMAIL] Host:', process.env.SMTP_HOST);
    console.log('📧 [EMAIL] Port:', process.env.SMTP_PORT || '587');
    console.log('📧 [EMAIL] Secure:', process.env.SMTP_SECURE === 'true');
    
    const smtpConfig: any = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Configurações adicionais para evitar timeout
      connectionTimeout: 10000, // 10 segundos (reduzido para falhar mais rápido)
      greetingTimeout: 5000, // 5 segundos
      socketTimeout: 10000, // 10 segundos
      // Para Outlook/Hotmail, configurações específicas
      requireTLS: false, // Não forçar TLS inicialmente
      tls: {
        // Não rejeitar certificados não autorizados
        rejectUnauthorized: false,
        // Ciphers mais compatíveis
        ciphers: 'SSLv3'
      },
      // Pool de conexões
      pool: true,
      maxConnections: 1,
      maxMessages: 3
    };
    
    // Configurações específicas para Outlook
    if (process.env.SMTP_HOST.includes('outlook') || process.env.SMTP_HOST.includes('hotmail')) {
      smtpConfig.requireTLS = true;
      smtpConfig.tls = {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      };
    }
    
    transporterCache = nodemailer.createTransport(smtpConfig);
    
    // Testar conexão
    try {
      await transporterCache.verify();
      console.log('✅ [EMAIL] SMTP real configurado e verificado com sucesso');
    } catch (verifyError) {
      console.error('⚠️ [EMAIL] Erro ao verificar conexão SMTP:', verifyError);
      console.warn('⚠️ [EMAIL] Continuando mesmo assim - tentará enviar quando necessário');
    }
    
    return transporterCache;
  }

  // Para desenvolvimento: Ethereal Email (fake SMTP que funciona sem configuração)
  // ⚠️ ATENÇÃO: Ethereal Email NÃO envia emails reais, apenas para testes!
  console.warn('⚠️ [EMAIL] SMTP não configurado - usando Ethereal Email (NÃO envia emails reais!)');
  console.warn('⚠️ [EMAIL] Para produção, configure as variáveis: SMTP_HOST, SMTP_USER, SMTP_PASS');
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporterCache = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 [EMAIL] Ethereal Email configurado (apenas para testes)');
    console.log(`📧 [EMAIL] User: ${testAccount.user}`);
    console.log(`📧 [EMAIL] Pass: ${testAccount.pass}`);
    console.warn('⚠️ [EMAIL] Emails enviados via Ethereal NÃO chegam na caixa de entrada real!');
    console.warn('⚠️ [EMAIL] Acesse https://ethereal.email para ver os emails de teste');
    return transporterCache;
  } catch (error) {
    console.error('❌ [EMAIL] Erro ao criar conta Ethereal:', error);
    throw new Error('Não foi possível configurar o serviço de email');
  }
};

interface EnviarConviteParams {
  email: string;
  nomeBarbearia: string;
  nomeResponsavel: string;
  linkAtivacao: string;
  expiraEm: Date;
}

/**
 * Envia email com link de convite para ativação de conta
 */
export async function enviarEmailConvite(params: EnviarConviteParams) {
  const { email, nomeBarbearia, nomeResponsavel, linkAtivacao, expiraEm } = params;

  const transporter = await createTransporter();

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          padding: 15px 30px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Bem-vindo ao Groom Guru!</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${nomeResponsavel}</strong>,</p>
          
          <p>Sua barbearia <strong>${nomeBarbearia}</strong> foi cadastrada com sucesso em nossa plataforma!</p>
          
          <p>Para começar a usar o sistema, você precisa criar sua conta de acesso. Clique no botão abaixo para ativar sua conta:</p>
          
          <div style="text-align: center;">
            <a href="${linkAtivacao}" class="button">Ativar Minha Conta</a>
          </div>
          
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px; font-size: 12px;">
            ${linkAtivacao}
          </p>
          
          <p><strong>⚠️ Importante:</strong> Este link expira em ${expiraEm.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}.</p>
          
          <p>Se você não solicitou este cadastro, pode ignorar este email.</p>
        </div>
        <div class="footer">
          <p>Este é um email automático, por favor não responda.</p>
          <p>© ${new Date().getFullYear()} Groom Guru Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textTemplate = `
    Bem-vindo ao Groom Guru!
    
    Olá ${nomeResponsavel},
    
    Sua barbearia ${nomeBarbearia} foi cadastrada com sucesso em nossa plataforma!
    
    Para começar a usar o sistema, você precisa criar sua conta de acesso. Acesse o link abaixo:
    
    ${linkAtivacao}
    
    ⚠️ Importante: Este link expira em ${expiraEm.toLocaleDateString('pt-BR')}.
    
    Se você não solicitou este cadastro, pode ignorar este email.
    
    © ${new Date().getFullYear()} Groom Guru Platform
  `;

  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Groom Guru" <noreply@groomguru.com>',
      to: email,
      subject: `Ative sua conta - ${nomeBarbearia}`,
      text: textTemplate,
      html: htmlTemplate,
    });

    console.log('✅ Email enviado:', info.messageId);
    
    // Se usar Ethereal, mostra o link de preview
    if (info.messageId) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('📧 Preview do email:', previewUrl);
        console.log('   Acesse este link para ver o email enviado');
      }
    }

    return {
      sucesso: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null,
    };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw new Error('Erro ao enviar email de convite');
  }
}

/**
 * Envia email com senha temporária para o dono da barbearia
 */
interface EnviarSenhaParams {
  email: string;
  nome: string;
  nomeBarbearia: string;
  senha: string;
}

export async function enviarEmailSenha(params: EnviarSenhaParams) {
  const { email, nome, nomeBarbearia, senha } = params;

  const transporter = await createTransporter();

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .senha-box {
          background: #fff;
          border: 2px dashed #667eea;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
          border-radius: 5px;
        }
        .senha {
          font-size: 24px;
          font-weight: bold;
          color: #667eea;
          letter-spacing: 2px;
          font-family: monospace;
        }
        .button {
          display: inline-block;
          padding: 15px 30px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #666;
          font-size: 12px;
        }
        .warning {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Sua conta foi aprovada!</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${nome}</strong>,</p>
          
          <p>Sua solicitação de cadastro para a barbearia <strong>${nomeBarbearia}</strong> foi aprovada!</p>
          
          <p>Agora você pode acessar o sistema usando as credenciais abaixo:</p>
          
          <div class="senha-box">
            <p style="margin: 0 0 10px 0; color: #666;">Sua senha temporária:</p>
            <div class="senha">${senha}</div>
          </div>
          
          <div class="warning">
            <strong>⚠️ Importante:</strong> Por segurança, altere sua senha assim que fizer o primeiro login nas configurações da sua conta.
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Acessar Sistema</a>
          </div>
          
          <p>Use seu email (<strong>${email}</strong>) e a senha acima para fazer login.</p>
          
          <p>Se você não solicitou este cadastro, entre em contato conosco imediatamente.</p>
        </div>
        <div class="footer">
          <p>Este é um email automático, por favor não responda.</p>
          <p>© ${new Date().getFullYear()} Groom Guru Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textTemplate = `
    Sua conta foi aprovada!
    
    Olá ${nome},
    
    Sua solicitação de cadastro para a barbearia ${nomeBarbearia} foi aprovada!
    
    Agora você pode acessar o sistema usando as credenciais abaixo:
    
    Email: ${email}
    Senha temporária: ${senha}
    
    ⚠️ Importante: Por segurança, altere sua senha assim que fizer o primeiro login nas configurações da sua conta.
    
    Acesse: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/login
    
    Se você não solicitou este cadastro, entre em contato conosco imediatamente.
    
    © ${new Date().getFullYear()} Groom Guru Platform
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Groom Guru" <noreply@groomguru.com>',
      to: email,
      subject: `Acesso aprovado - ${nomeBarbearia}`,
      text: textTemplate,
      html: htmlTemplate,
    });

    console.log('✅ Email com senha enviado:', info.messageId);
    
    if (info.messageId) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('📧 Preview do email:', previewUrl);
      }
    }

    return {
      sucesso: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null,
    };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw new Error('Erro ao enviar email com senha');
  }
}

/**
 * Envia email de recuperação de senha
 */
interface EnviarRecuperacaoSenhaParams {
  email: string;
  nome: string;
  senhaNova: string;
  tipo: 'dono' | 'cliente';
  nomeBarbearia?: string;
}

export async function enviarEmailRecuperacaoSenha(params: EnviarRecuperacaoSenhaParams) {
  const { email, nome, senhaNova, tipo, nomeBarbearia } = params;

  const transporter = await createTransporter();

  const titulo = tipo === 'dono' 
    ? `Recuperação de Senha - ${nomeBarbearia || 'Groom Guru'}`
    : 'Recuperação de Senha - Groom Guru';

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .senha-box {
          background: #fff;
          border: 2px dashed #667eea;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
          border-radius: 5px;
        }
        .senha {
          font-size: 24px;
          font-weight: bold;
          color: #667eea;
          letter-spacing: 2px;
          font-family: monospace;
        }
        .button {
          display: inline-block;
          padding: 15px 30px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #666;
          font-size: 12px;
        }
        .info {
          background: #e7f3ff;
          border-left: 4px solid #2196F3;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Recuperação de Senha</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${nome}</strong>,</p>
          
          <p>Recebemos uma solicitação de recuperação de senha para sua conta${tipo === 'dono' && nomeBarbearia ? ` na barbearia <strong>${nomeBarbearia}</strong>` : ''}.</p>
          
          <p>Sua nova senha foi gerada automaticamente. Use as credenciais abaixo para fazer login:</p>
          
          <div class="senha-box">
            <p style="margin: 0 0 10px 0; color: #666;">Sua nova senha:</p>
            <div class="senha">${senhaNova}</div>
          </div>
          
          <div class="info">
            <strong>ℹ️ Informação:</strong> Esta senha é sua nova senha oficial. Você pode mantê-la ou alterá-la nas configurações da sua conta quando desejar.
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/${tipo === 'dono' ? 'dono' : 'cliente'}/login" class="button">Fazer Login</a>
          </div>
          
          <p>Use seu email (<strong>${email}</strong>) e a senha acima para fazer login.</p>
          
          <p><strong>⚠️ Importante:</strong> Se você não solicitou esta recuperação de senha, entre em contato conosco imediatamente.</p>
        </div>
        <div class="footer">
          <p>Este é um email automático, por favor não responda.</p>
          <p>© ${new Date().getFullYear()} Groom Guru Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textTemplate = `
    Recuperação de Senha
    
    Olá ${nome},
    
    Recebemos uma solicitação de recuperação de senha para sua conta${tipo === 'dono' && nomeBarbearia ? ` na barbearia ${nomeBarbearia}` : ''}.
    
    Sua nova senha foi gerada automaticamente. Use as credenciais abaixo para fazer login:
    
    Email: ${email}
    Nova senha: ${senhaNova}
    
    ℹ️ Informação: Esta senha é sua nova senha oficial. Você pode mantê-la ou alterá-la nas configurações da sua conta quando desejar.
    
    Acesse: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/${tipo === 'dono' ? 'dono' : 'cliente'}/login
    
    ⚠️ Importante: Se você não solicitou esta recuperação de senha, entre em contato conosco imediatamente.
    
    © ${new Date().getFullYear()} Groom Guru Platform
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Groom Guru" <noreply@groomguru.com>',
      to: email,
      subject: titulo,
      text: textTemplate,
      html: htmlTemplate,
    });

    console.log('✅ [EMAIL] Email de recuperação de senha enviado:', info.messageId);
    
    // Se usar Ethereal (teste), mostrar link de preview
    if (info.messageId) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.warn('⚠️ [EMAIL] Email enviado via Ethereal (TESTE) - NÃO chega na caixa de entrada real!');
        console.warn('⚠️ [EMAIL] Preview do email:', previewUrl);
        console.warn('⚠️ [EMAIL] Acesse o link acima para ver o email de teste');
        console.warn('⚠️ [EMAIL] Para enviar emails reais, configure SMTP_HOST, SMTP_USER e SMTP_PASS no Railway');
      } else {
        console.log('✅ [EMAIL] Email enviado via SMTP real - deve chegar na caixa de entrada');
      }
    }

    return {
      sucesso: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null,
    };
  } catch (error: any) {
    console.error('❌ [EMAIL] Erro ao enviar email de recuperação:', error);
    console.error('❌ [EMAIL] Código do erro:', error.code);
    console.error('❌ [EMAIL] Mensagem:', error.message);
    
    // Mensagens de erro mais específicas
    if (error.code === 'ETIMEDOUT') {
      console.error('❌ [EMAIL] Timeout ao conectar ao servidor SMTP');
      console.error('❌ [EMAIL] Possíveis causas:');
      console.error('   - Railway pode estar bloqueando conexões SMTP de saída');
      console.error('   - Servidor SMTP pode estar indisponível');
      console.error('   - Credenciais podem estar incorretas');
      console.error('   - Porta pode estar bloqueada');
      console.error('❌ [EMAIL] Recomendação: Use SendGrid ou Mailgun para produção');
      throw new Error('Timeout ao conectar ao servidor de email. Tente usar SendGrid ou Mailgun.');
    } else if (error.code === 'EAUTH') {
      console.error('❌ [EMAIL] Erro de autenticação SMTP');
      throw new Error('Erro de autenticação no servidor de email. Verifique SMTP_USER e SMTP_PASS.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ [EMAIL] Conexão recusada pelo servidor SMTP');
      throw new Error('Conexão recusada pelo servidor de email. Verifique SMTP_HOST e SMTP_PORT.');
    }
    
    throw new Error(`Erro ao enviar email de recuperação de senha: ${error.message || 'Erro desconhecido'}`);
  }
}

/**
 * Gera credenciais Ethereal para desenvolvimento
 */
export async function gerarCredenciaisEthereal() {
  const testAccount = await nodemailer.createTestAccount();
  return {
    user: testAccount.user,
    pass: testAccount.pass,
    smtp: {
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
    },
    preview: 'https://ethereal.email',
  };
}
