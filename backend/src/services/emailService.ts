import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Cache para transporter
let transporterCache: nodemailer.Transporter | null = null;

// Configuração do Resend (solução mais simples e confiável)
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

// Verifica se Resend está configurado
const isResendConfigured = (): boolean => {
  return !!RESEND_API_KEY;
};

// Inicializar Resend se estiver configurado
let resendClient: Resend | null = null;
console.log('🔍 [EMAIL SERVICE] Verificando Resend na inicialização...');
console.log('   RESEND_API_KEY presente:', !!RESEND_API_KEY);
console.log('   RESEND_API_KEY valor:', RESEND_API_KEY ? `${RESEND_API_KEY.substring(0, 10)}...` : 'NÃO CONFIGURADO');

if (isResendConfigured()) {
  try {
    resendClient = new Resend(RESEND_API_KEY);
    console.log('✅ [EMAIL] Resend configurado e pronto para uso');
    console.log(`   API Key: ${RESEND_API_KEY.substring(0, 10)}...`);
  } catch (error) {
    console.error('❌ [EMAIL] Erro ao inicializar Resend:', error);
    resendClient = null;
  }
} else {
  console.log('⚠️ [EMAIL] Resend não configurado');
  console.log('   Para usar Resend, configure a variável:');
  console.log('   - RESEND_API_KEY');
  console.log('   Veja: IMPLEMENTAR_RESEND.md');
  console.log('   O sistema usará nodemailer (SMTP) como fallback');
}

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
      // Configurações adicionais para evitar timeout - OTIMIZADO PARA VELOCIDADE
      connectionTimeout: 5000, // 5 segundos (reduzido para falhar mais rápido)
      greetingTimeout: 3000, // 3 segundos
      socketTimeout: 5000, // 5 segundos
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
          <h1>🎉 Bem-vindo ao Barber Master!</h1>
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
          <p>© ${new Date().getFullYear()} Barber Master</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textTemplate = `
    Bem-vindo ao Barber Master!
    
    Olá ${nomeResponsavel},
    
    Sua barbearia ${nomeBarbearia} foi cadastrada com sucesso em nossa plataforma!
    
    Para começar a usar o sistema, você precisa criar sua conta de acesso. Acesse o link abaixo:
    
    ${linkAtivacao}
    
    ⚠️ Importante: Este link expira em ${expiraEm.toLocaleDateString('pt-BR')}.
    
    Se você não solicitou este cadastro, pode ignorar este email.
    
    © ${new Date().getFullYear()} Barber Master
  `;

  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Barber Master" <noreply@barbermaster.com>',
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
          <p>© ${new Date().getFullYear()} Barber Master</p>
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
    
    © ${new Date().getFullYear()} Barber Master
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Barber Master" <noreply@barbermaster.com>',
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

/**
 * Envia email usando Resend (solução mais simples e confiável)
 */
async function enviarEmailViaResend(params: EnviarRecuperacaoSenhaParams): Promise<boolean> {
  if (!isResendConfigured() || !resendClient) {
    return false;
  }

  // Extrair email antes do try para garantir que esteja no escopo do catch
  const { email, nome, senhaNova, tipo, nomeBarbearia } = params;

  try {
    console.log('📧 [EMAIL] Tentando enviar via Resend...');
    
    console.log('📧 [EMAIL] Enviando para:', email);
    console.log('📧 [EMAIL] Nome:', nome);
    console.log('📧 [EMAIL] Tipo:', tipo);
    
    const titulo = tipo === 'dono' 
      ? `Recuperação de Senha - ${nomeBarbearia || 'Barber Master'}`
      : 'Recuperação de Senha - Barber Master';

    // HTML do email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .senha-box {
            background: #f8f9fa;
            border: 2px dashed #667eea;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
            border-radius: 5px;
          }
          .senha {
            font-size: 28px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 3px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
          }
          .info {
            background: #e7f3ff;
            border-left: 4px solid #2196F3;
            padding: 15px;
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
            
            <p>Use seu email (<strong>${email}</strong>) e a senha acima para fazer login.</p>
            
            <p><strong>⚠️ Importante:</strong> Se você não solicitou esta recuperação de senha, entre em contato conosco imediatamente.</p>
          </div>
          <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
            <p>© ${new Date().getFullYear()} Barber Master</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Texto simples (fallback)
    const textContent = `
Recuperação de Senha

Olá ${nome},

Recebemos uma solicitação de recuperação de senha para sua conta${tipo === 'dono' && nomeBarbearia ? ` na barbearia ${nomeBarbearia}` : ''}.

Sua nova senha foi gerada automaticamente: ${senhaNova}

ℹ️ Informação: Esta senha é sua nova senha oficial. Você pode mantê-la ou alterá-la nas configurações da sua conta quando desejar.

Acesse: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/${tipo === 'dono' ? 'dono' : 'cliente'}/login

⚠️ Importante: Se você não solicitou esta recuperação de senha, entre em contato conosco imediatamente.

© ${new Date().getFullYear()} Barber Master
    `;

        // Enviar via Resend
        // IMPORTANTE: Resend requer domínio verificado. Use o domínio padrão do Resend para emails de teste
        // Para produção, você precisa verificar seu domínio em https://resend.com/domains
        // IMPORTANTE: No plano gratuito do Resend, você DEVE usar 'onboarding@resend.dev'
        // Se EMAIL_FROM estiver configurado com domínio não verificado, forçar uso do domínio padrão
        let emailFrom = process.env.EMAIL_FROM || 'Barber Master <onboarding@resend.dev>';
        
        // Se EMAIL_FROM não contém 'onboarding@resend.dev' ou 'resend.dev', usar o padrão
        // Isso garante que sempre use um domínio válido no plano gratuito
        if (!emailFrom.includes('resend.dev')) {
          console.warn('⚠️ [EMAIL] EMAIL_FROM configurado com domínio não verificado:', emailFrom);
          console.warn('⚠️ [EMAIL] Usando domínio padrão do Resend (onboarding@resend.dev)');
          emailFrom = 'Barber Master <onboarding@resend.dev>';
        }
        
        console.log('📧 [EMAIL] Enviando de:', emailFrom);
        console.log('📧 [EMAIL] Enviando para:', email);
        console.log('📧 [EMAIL] Assunto:', titulo);
        console.log('📧 [EMAIL] Tamanho do HTML:', htmlContent.length, 'bytes');
        console.log('📧 [EMAIL] Iniciando envio via Resend...');
        
        // Enviar com timeout de 10 segundos (aumentado de 5 para 10)
        const sendPromise = resendClient.emails.send({
          from: emailFrom,
          to: email,
          subject: titulo,
          html: htmlContent,
          text: textContent,
        }).then((result) => {
          console.log('📧 [EMAIL] Resend retornou resultado:', JSON.stringify(result, null, 2));
          return result;
        }).catch((err) => {
          console.error('📧 [EMAIL] Erro na promise do Resend:', err);
          throw err;
        });

        // Timeout de 10 segundos para Resend (aumentado de 5 para 10)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            console.error('📧 [EMAIL] TIMEOUT: Resend demorou mais de 10 segundos');
            reject(new Error('Timeout: Resend demorou mais de 10 segundos'));
          }, 10000);
        });

        console.log('📧 [EMAIL] Aguardando resposta do Resend (timeout: 10s)...');
        const resultado = await Promise.race([sendPromise, timeoutPromise]) as any;
        console.log('📧 [EMAIL] Resultado recebido do Resend:', JSON.stringify(resultado, null, 2));
        
        const { data, error } = resultado || {};

    // Verificar se houve erro OU se data é null (indica falha no Resend)
    if (error || !data || data === null) {
      // Se não há erro explícito mas data é null, criar um erro genérico
      if (!error && (!data || data === null)) {
        console.error('❌ [EMAIL] Resend retornou data: null - email não foi enviado');
        console.error('❌ [EMAIL] Possíveis causas:');
        console.error('   - Domínio não verificado no Resend');
        console.error('   - Email de destino bloqueado ou inválido');
        console.error('   - Limite de envio excedido');
        console.error('   - API Key inválida ou expirada');
      }
      console.error('');
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌ [EMAIL] ERRO AO ENVIAR VIA RESEND');
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌ [EMAIL] Erro completo:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.error('❌ [EMAIL] Status Code:', error?.statusCode);
      console.error('❌ [EMAIL] Mensagem:', error?.message);
      console.error('❌ [EMAIL] Nome do erro:', error?.name);
      console.error('❌ [EMAIL] Stack:', error?.stack);
      console.error('❌ [EMAIL] Email de destino:', email);
      console.error('❌ [EMAIL] Tentando fallback para nodemailer (SMTP)...');
      console.error('');
      
      // Se o erro for de domínio não verificado ou plano de teste
      if (error?.statusCode === 403) {
        if (error?.message?.includes('domain is not verified')) {
          console.error('⚠️ [EMAIL] Domínio não verificado no Resend!');
          console.error('⚠️ [EMAIL] Solução: Verifique seu domínio em: https://resend.com/domains');
          console.error('⚠️ [EMAIL] Ou use o email cadastrado no Resend para testes');
        } else if (error?.message?.includes('only send testing emails to your own email address')) {
          console.error('');
          console.error('⚠️ [EMAIL] ⚠️ RESEND PLANO GRATUITO - LIMITAÇÃO DETECTADA ⚠️');
          console.error('⚠️ [EMAIL] O plano gratuito do Resend só permite enviar para o email cadastrado');
          console.error('⚠️ [EMAIL] Email cadastrado no Resend: brunocamargocontato@hotmail.com');
          console.error('⚠️ [EMAIL] Email de destino tentado: ' + email);
          console.error('');
          console.error('✅ [EMAIL] SOLUÇÕES:');
          console.error('   1. Para TESTES: Use o email cadastrado (brunocamargocontato@hotmail.com)');
          console.error('   2. Para PRODUÇÃO: Verifique um domínio em https://resend.com/domains');
          console.error('   3. Alternativa: Configure SendGrid ou Mailgun no Railway');
          console.error('');
          console.error('📖 [EMAIL] Guia completo: VERIFICAR_DOMINIO_RESEND.md');
          console.error('');
        }
      }
      
      // Se o erro for de email inválido ou bloqueado, ainda tentar fallback
      // O Resend pode bloquear alguns domínios, mas o SMTP pode funcionar
      if (error?.statusCode === 422 || error?.statusCode === 400) {
        console.error('⚠️ [EMAIL] Email pode estar bloqueado no Resend, tentando SMTP...');
      }
      
      return false;
    }

    // Verificar se data.id existe (indica sucesso)
    if (!data?.id) {
      console.error('');
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌ [EMAIL] RESEND RETORNOU SEM ID DE EMAIL');
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌ [EMAIL] Data recebida:', JSON.stringify(data, null, 2));
      console.error('❌ [EMAIL] Email não foi enviado - tentando fallback SMTP...');
      console.error('');
      return false;
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ [EMAIL] EMAIL ENVIADO VIA RESEND COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ [EMAIL] Email ID:', data.id);
    console.log('✅ [EMAIL] Email de destino:', email);
    console.log('✅ [EMAIL] Assunto:', titulo);
    console.log('✅ [EMAIL] Verifique a caixa de entrada e spam do email:', email);
    console.log('');
    
    return true;
  } catch (error: any) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════');
    console.error('❌ [EMAIL] EXCEÇÃO AO ENVIAR VIA RESEND');
    console.error('═══════════════════════════════════════════════════════');
    console.error('❌ [EMAIL] Tipo do erro:', error?.constructor?.name);
    console.error('❌ [EMAIL] Mensagem:', error?.message);
    console.error('❌ [EMAIL] Stack:', error?.stack);
    console.error('❌ [EMAIL] Erro completo:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('❌ [EMAIL] Email de destino:', email);
    console.error('❌ [EMAIL] Tentando fallback para nodemailer...');
    console.error('');
    return false;
  }
}

export async function enviarEmailRecuperacaoSenha(params: EnviarRecuperacaoSenhaParams) {
  const { email, nome, senhaNova, tipo, nomeBarbearia } = params;

  console.log('═══════════════════════════════════════════════════════');
  console.log('📧 [EMAIL] INICIANDO ENVIO DE EMAIL DE RECUPERAÇÃO DE SENHA');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📧 [EMAIL] Email de destino:', email);
  console.log('📧 [EMAIL] Nome:', nome);
  console.log('📧 [EMAIL] Tipo de conta:', tipo);
  console.log('📧 [EMAIL] Domínio do email:', email.split('@')[1] || 'desconhecido');
  console.log('');

  // Tentar Resend primeiro (mais rápido e confiável)
  // IMPORTANTE: Resend deve responder em menos de 2 segundos
  console.log('📧 [EMAIL] ETAPA 1: Tentando enviar via Resend (timeout: 5s)...');
  console.log('   RESEND_API_KEY presente:', !!process.env.RESEND_API_KEY);
  console.log('   resendClient presente:', !!resendClient);
  console.log('   isResendConfigured():', isResendConfigured());
  
  const inicioResend = Date.now();
  const resendEnviado = await enviarEmailViaResend(params);
  const tempoResend = Date.now() - inicioResend;
  
  if (resendEnviado) {
    console.log(`✅ [EMAIL] Email enviado com sucesso via Resend em ${tempoResend}ms!`);
    console.log('═══════════════════════════════════════════════════════');
    return {
      sucesso: true,
      messageId: 'resend',
      previewUrl: null,
      metodo: 'resend',
    };
  }
  
  console.log('');
  console.log(`⚠️ [EMAIL] Resend não funcionou após ${tempoResend}ms, tentando SMTP como fallback...`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('📧 [EMAIL] ETAPA 2: Usando nodemailer (SMTP) como fallback (timeout: 10s)...');
  console.log('📧 [EMAIL] Verificando configuração SMTP...');
  console.log('   SMTP_HOST:', process.env.SMTP_HOST || 'NÃO CONFIGURADO');
  console.log('   SMTP_PORT:', process.env.SMTP_PORT || '587 (padrão)');
  console.log('   SMTP_USER:', process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 5)}...` : 'NÃO CONFIGURADO');
  console.log('   SMTP_PASS:', process.env.SMTP_PASS ? '***CONFIGURADO***' : 'NÃO CONFIGURADO');
  console.log('');
  
  // IMPORTANTE: Sempre tentar SMTP, mesmo que não esteja configurado
  // O createTransporter criará Ethereal se SMTP não estiver configurado
  // Mas vamos garantir que funcione para TODOS os domínios
  let transporter: nodemailer.Transporter;
  try {
    transporter = await createTransporter();
  } catch (transporterError: any) {
    console.error('❌ [EMAIL] Erro ao criar transporter:', transporterError);
    console.error('❌ [EMAIL] Tentando criar transporter novamente...');
    // Tentar novamente
    transporter = await createTransporter();
  }

  const titulo = tipo === 'dono' 
    ? `Recuperação de Senha - ${nomeBarbearia || 'Barber Master'}`
    : 'Recuperação de Senha - Barber Master';

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
          <p>© ${new Date().getFullYear()} Barber Master</p>
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
    
    © ${new Date().getFullYear()} Barber Master
  `;

  try {
    const inicioSMTP = Date.now();
    
    // Enviar com timeout de 10 segundos para SMTP
    const sendPromise = transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Barber Master" <noreply@barbermaster.com>',
      to: email,
      subject: titulo,
      text: textTemplate,
      html: htmlTemplate,
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: SMTP demorou mais de 10 segundos')), 10000);
    });

    const info = await Promise.race([sendPromise, timeoutPromise]) as any;
    const tempoSMTP = Date.now() - inicioSMTP;
    
    console.log(`✅ [EMAIL] Email enviado via SMTP em ${tempoSMTP}ms!`);

    console.log('✅ [EMAIL] Email de recuperação de senha enviado via SMTP!');
    console.log('✅ [EMAIL] Message ID:', info.messageId);
    console.log('✅ [EMAIL] Email de destino:', email);
    console.log('✅ [EMAIL] Domínio:', email.split('@')[1] || 'desconhecido');
    
    // Se usar Ethereal (teste), mostrar link de preview
    if (info.messageId) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.warn('');
        console.warn('⚠️ [EMAIL] ⚠️ ATENÇÃO: Email enviado via Ethereal (TESTE) ⚠️');
        console.warn('⚠️ [EMAIL] Este email NÃO chega na caixa de entrada real!');
        console.warn('⚠️ [EMAIL] Preview do email:', previewUrl);
        console.warn('⚠️ [EMAIL] Acesse o link acima para ver o email de teste');
        console.warn('⚠️ [EMAIL] Para enviar emails reais, configure SMTP_HOST, SMTP_USER e SMTP_PASS no Railway');
        console.warn('');
      } else {
        console.log('✅ [EMAIL] Email enviado via SMTP real - deve chegar na caixa de entrada');
        console.log('✅ [EMAIL] Verifique a caixa de entrada e spam do email:', email);
      }
    }
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ [EMAIL] ENVIO CONCLUÍDO COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════');

    return {
      sucesso: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null,
      metodo: 'nodemailer',
    };
  } catch (error: any) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════');
    console.error('❌ [EMAIL] ERRO AO ENVIAR EMAIL DE RECUPERAÇÃO DE SENHA');
    console.error('═══════════════════════════════════════════════════════');
    console.error('❌ [EMAIL] Email de destino:', email);
    console.error('❌ [EMAIL] Domínio:', email.split('@')[1] || 'desconhecido');
    console.error('❌ [EMAIL] Tipo de conta:', tipo);
    console.error('❌ [EMAIL] Código do erro:', error.code);
    console.error('❌ [EMAIL] Mensagem:', error.message);
    console.error('❌ [EMAIL] Stack:', error.stack);
    console.error('');
    
    // Mensagens de erro mais específicas
    if (error.code === 'ETIMEDOUT') {
      console.error('❌ [EMAIL] Timeout ao conectar ao servidor SMTP');
      console.error('❌ [EMAIL] Possíveis causas:');
      console.error('   - Railway pode estar bloqueando conexões SMTP de saída');
      console.error('   - Servidor SMTP pode estar indisponível');
      console.error('   - Credenciais podem estar incorretas');
      console.error('   - Porta pode estar bloqueada');
      console.error('   - Firewall pode estar bloqueando');
      console.error('');
      console.error('✅ [EMAIL] SOLUÇÕES:');
      console.error('   1. Configure SMTP_HOST, SMTP_USER e SMTP_PASS no Railway');
      console.error('   2. Use SendGrid ou Mailgun para produção (recomendado)');
      console.error('   3. Verifique se o servidor SMTP está acessível');
      console.error('');
      throw new Error(`Timeout ao conectar ao servidor de email para ${email}. Configure SMTP no Railway ou use SendGrid/Mailgun.`);
    } else if (error.code === 'EAUTH') {
      console.error('❌ [EMAIL] Erro de autenticação SMTP');
      console.error('✅ [EMAIL] SOLUÇÃO: Verifique SMTP_USER e SMTP_PASS no Railway');
      console.error('');
      throw new Error(`Erro de autenticação no servidor de email para ${email}. Verifique SMTP_USER e SMTP_PASS.`);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ [EMAIL] Conexão recusada pelo servidor SMTP');
      console.error('✅ [EMAIL] SOLUÇÃO: Verifique SMTP_HOST e SMTP_PORT no Railway');
      console.error('');
      throw new Error(`Conexão recusada pelo servidor de email para ${email}. Verifique SMTP_HOST e SMTP_PORT.`);
    }
    
    console.error('❌ [EMAIL] Erro desconhecido - verifique os logs acima');
    console.error('═══════════════════════════════════════════════════════');
    console.error('');
    throw new Error(`Erro ao enviar email de recuperação de senha para ${email}: ${error.message || 'Erro desconhecido'}`);
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
