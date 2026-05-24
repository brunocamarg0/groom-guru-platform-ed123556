import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente PRIMEIRO (antes de qualquer import que use process.env)
dotenv.config();

import session from 'express-session';
import passport from 'passport';
import adminBarbeariasRoutes from './routes/admin/barbearias';
import adminConvitesRoutes from './routes/admin/convites';
import adminUsuariosRoutes from './routes/admin/usuarios';
import ativacaoRoutes from './routes/ativacao';
import authRoutes from './routes/auth';
import googleAuthRoutes from './routes/googleAuth';
import facebookAuthRoutes from './routes/facebookAuth';
import appleAuthRoutes from './routes/appleAuth';
import solicitacoesRoutes from './routes/solicitacoes';
import agendamentosRoutes from './routes/agendamentos';
import donoProfissionaisRoutes from './routes/dono/profissionais';
import donoClientesRoutes from './routes/dono/clientes';
import donoServicosRoutes from './routes/dono/servicos';
import donoDashboardRoutes from './routes/dono/dashboard';
import donoFinanceiroRoutes from './routes/dono/financeiro';
import donoPromocoesRoutes from './routes/dono/promocoes';
import donoAvaliacoesRoutes from './routes/dono/avaliacoes';
import donoProdutosRoutes from './routes/dono/produtos';
import donoNotificacoesRoutes from './routes/dono/notificacoes';
import donoRelatoriosRoutes from './routes/dono/relatorios';
import donoConfiguracaoRoutes from './routes/dono/configuracao';
import donoComissoesRoutes from './routes/dono/comissoes';
import donoAssinaturaRoutes from './routes/dono/assinatura';
import donoPlanosClienteRoutes from './routes/dono/planosCliente';
import donoClientesProfissionaisRoutes from './routes/dono/clientesProfissionais';
import clientePanelRoutes from './routes/cliente/panel';
import adminAssinaturasRoutes from './routes/admin/assinaturas';
import faturasRoutes from './routes/faturas';
import clienteSuporteRoutes from './routes/cliente/suporte';
import adminSuporteRoutes from './routes/admin/suporte';
import barbeariasPublicasRoutes from './routes/barbeariasPublicas';

import pagamentosRoutes from './routes/pagamentos';
import testEmailRoutes from './routes/test-email';
// Carregar configuração do Passport (pode falhar se OAuth não estiver configurado)
try {
  require('./config/passport');
  console.log('✅ Passport configurado');
} catch (error) {
  console.error('⚠️  Erro ao carregar Passport (OAuth pode não estar configurado):', error);
  // Continuar mesmo se Passport falhar
}


import * as cron from 'node-cron';
import { enviarLembretesAgendamento } from './jobs/lembretesAgendamento';
// Importar emailService para inicializar logs do Resend/EmailJS
import './services/emailService';

// Log de inicialização
console.log('🔧 Inicializando aplicação...');
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 PORT:', process.env.PORT);
console.log('🔧 VERCEL:', process.env.VERCEL);
console.log('🔧 VERCEL_ENV:', process.env.VERCEL_ENV);

// Verificar configuração do Resend
console.log('🔍 [EMAIL] Verificando configuração do Resend...');
console.log('   RESEND_API_KEY presente:', !!process.env.RESEND_API_KEY);
console.log('   RESEND_API_KEY valor:', process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` : 'NÃO CONFIGURADO');

const resendConfigurado = !!process.env.RESEND_API_KEY;
if (resendConfigurado) {
  console.log('✅ [EMAIL] Resend configurado e pronto para uso');
  console.log('   - API Key:', process.env.RESEND_API_KEY?.substring(0, 15) + '...');
  console.log('   📧 Resend será usado como método principal de envio de emails');
} else {
  console.warn('⚠️ [EMAIL] Resend não configurado - usando nodemailer como fallback');
  console.warn('   Para configurar Resend, adicione no Railway:');
  console.warn('   - RESEND_API_KEY=re_xxxxx');
  console.warn('   Veja: IMPLEMENTAR_RESEND.md para instruções completas');
}

// Verificar configuração de SMTP
const smtpConfigurado = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);
if (smtpConfigurado) {
  console.log('✅ [EMAIL] SMTP configurado como fallback');
  console.log('   - Host:', process.env.SMTP_HOST);
} else {
  console.warn('⚠️ [EMAIL] SMTP não configurado - usando Ethereal Email (apenas testes)');
}

export const app = express();

// Middleware CORS
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'https://groom-guru-platform.vercel.app']
  : ['http://localhost:5173', 'http://localhost:8080', 'https://groom-guru-platform.vercel.app'];

console.log('🔧 CORS - allowedOrigins:', allowedOrigins);
console.log('🔧 CORS - FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('🔧 CORS - NODE_ENV:', process.env.NODE_ENV);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin) {
      console.log('🔧 CORS - Requisição sem origin, permitindo');
      return callback(null, true);
    }

    console.log('🔧 CORS - Origin recebida:', origin);

    // Permitir origens específicas ou todas em desenvolvimento
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('🔧 CORS - Origin permitida (na lista)');
      callback(null, true);
    } else {
      // Em produção, permitir apenas origens conhecidas
      // Em desenvolvimento, permitir todas
      if (process.env.NODE_ENV === 'production') {
        // Permitir Vercel mesmo se não estiver na lista
        if (origin.includes('vercel.app') || origin.includes('groom-guru-platform')) {
          console.log('🔧 CORS - Origin permitida (Vercel/groom-guru-platform)');
          callback(null, true);
        } else {
          console.log('🔧 CORS - Origin permitida (debug mode)');
          callback(null, true); // Por enquanto permitir todas para debug
        }
      } else {
        console.log('🔧 CORS - Origin permitida (desenvolvimento)');
        callback(null, true);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
}));

// Tratar preflight requests (OPTIONS) explicitamente
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Aumentar limite do body parser para suportar imagens em base64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rota de teste - DEVE SER A PRIMEIRA ROTA (antes de qualquer middleware que possa bloquear)
// Esta rota deve responder SEMPRE, mesmo se o banco de dados estiver offline
app.get('/', (req, res) => {
  res.status(200).send('OK');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.get('/api/health', (req, res) => {
  // Não fazer log aqui para evitar spam nos logs
  res.status(200).json({
    status: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || '3001'
  });
});

// Rota temporária para testar envio de emails
app.use('/api/test-email', testEmailRoutes);

// Configuração de sessão para OAuth
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    },
  })
);

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Rotas públicas (autenticação e ativação de conta)
// Log para debug - verificar se as rotas estão sendo registradas
// FORÇAR REBUILD: Atualizado em 2024 para incluir rotas de recuperação de senha
console.log('🔧 Registrando rotas de autenticação em /api/auth');
console.log('🔧 Incluindo rotas: /api/auth/cliente/esqueci-senha, /api/auth/dono/esqueci-senha');
app.use('/api/auth', (req, res, next) => {
  console.log('🔧 Rota /api/auth chamada:', req.method, req.path);
  console.log('🔧 URL completa:', req.originalUrl);
  console.log('🔧 Base URL:', req.baseUrl);
  next();
}, authRoutes);
app.use('/api/auth/google', googleAuthRoutes);
app.use('/api/auth/facebook', facebookAuthRoutes);
app.use('/api/auth/apple', appleAuthRoutes);
app.use('/api', ativacaoRoutes);
app.use('/api/solicitacoes', solicitacoesRoutes);
app.use('/api/agendamentos', agendamentosRoutes);
app.use('/api/pagamentos', pagamentosRoutes);

// Rotas públicas de barbearias (para clientes)
console.log('🔧 Registrando rotas públicas de barbearias em /api/barbearias');
app.use('/api/barbearias', (req, res, next) => {
  console.log('🔧 Rota /api/barbearias chamada:', req.method, req.originalUrl);
  next();
}, barbeariasPublicasRoutes);

// Rotas do dono (requerem autenticação)
app.use('/api/dono/profissionais', donoProfissionaisRoutes);
app.use('/api/dono/clientes', donoClientesRoutes);
app.use('/api/dono/servicos', donoServicosRoutes);
app.use('/api/dono/dashboard', donoDashboardRoutes);
app.use('/api/dono/financeiro', donoFinanceiroRoutes);
app.use('/api/dono/promocoes', donoPromocoesRoutes);
app.use('/api/dono/avaliacoes', donoAvaliacoesRoutes);
app.use('/api/dono/produtos', donoProdutosRoutes);
app.use('/api/dono/notificacoes', donoNotificacoesRoutes);
app.use('/api/dono/relatorios', donoRelatoriosRoutes);
app.use('/api/dono/configuracao', donoConfiguracaoRoutes);
app.use('/api/dono/comissoes', donoComissoesRoutes);
app.use('/api/dono/assinatura', donoAssinaturaRoutes);
app.use('/api/dono', donoPlanosClienteRoutes);
app.use('/api/dono', donoClientesProfissionaisRoutes);

// Rota PÚBLICA de suporte para clientes (SEM autenticação)
// Usar path diferente para evitar conflito com middleware de /api/cliente
app.use('/api/suporte-cliente', clienteSuporteRoutes);

// Rotas do cliente (requerem autenticação)
app.use('/api/cliente', clientePanelRoutes);

// Rotas admin - ordem importa! Rotas mais específicas primeiro
app.use('/api/admin', adminUsuariosRoutes); // /api/admin/barbearias/:id/dono
app.use('/api/admin', adminConvitesRoutes); // /api/admin/barbearias/:id/convite
app.use('/api/admin/barbearias', adminBarbeariasRoutes); // /api/admin/barbearias
app.use('/api/admin/assinaturas', adminAssinaturasRoutes); // /api/admin/assinaturas

// Webhook de faturas (público, mas validado)
app.use('/api/faturas', faturasRoutes);
app.use('/api/admin/suporte', adminSuporteRoutes); // /api/admin/suporte - Tickets de suporte

// Handler para rotas não encontradas (404) - DEVE SER O ÚLTIMO
// Retorna JSON em vez de HTML para APIs
// IMPORTANTE: Usar app.use sem path específico para capturar todas as rotas não encontradas
app.use((req, res, next) => {
  // Só retornar 404 se for uma rota da API
  if (req.path.startsWith('/api')) {
    console.log('❌ [404] Rota não encontrada:');
    console.log('   Method:', req.method);
    console.log('   Original URL:', req.originalUrl);
    console.log('   Path:', req.path);
    console.log('   Base URL:', req.baseUrl);
    console.log('   Headers:', JSON.stringify(req.headers, null, 2));
    console.log('   Rotas registradas: /api/auth, /api/dono, /api/admin');

    // Log específico para rotas de clientes
    if (req.path.includes('/clientes')) {
      console.log('⚠️ [404] Requisição para rota de clientes não encontrada!');
      console.log('⚠️ [404] Verifique se a rota DELETE /api/dono/clientes/:id está registrada');
      console.log('⚠️ [404] Verifique se o middleware de autenticação está permitindo a requisição');
    }

    return res.status(404).json({
      error: 'Rota não encontrada',
      path: req.originalUrl,
      method: req.method,
      message: 'Verifique se a rota está correta e se o método HTTP está correto (GET, POST, PUT, DELETE)'
    });
  }
  // Para rotas não-API, passar para o próximo handler (se houver)
  next();
});

// Iniciar servidor apenas se não estiver rodando como serverless function (Vercel)
// Na Vercel, o app é exportado e não precisa de app.listen()
// Railway sempre define PORT, então sempre iniciar o servidor se não for Vercel
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  // Railway define PORT automaticamente, usar 3001 como fallback apenas para desenvolvimento local
  const PORT = parseInt(process.env.PORT || '3001', 10);

  console.log(`🔧 Tentando iniciar servidor na porta ${PORT}...`);
  console.log(`🔧 PORT da env: ${process.env.PORT}`);

  // Tratamento de erros para evitar crash
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    console.error('❌ Stack:', error.stack);
    // Não encerrar o processo imediatamente, apenas logar
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // Não encerrar o processo imediatamente, apenas logar
  });

  // Iniciar servidor imediatamente, sem try-catch que possa esconder erros
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is running on http://0.0.0.0:${PORT}`);
    console.log(`✅ API Health: http://0.0.0.0:${PORT}/api/health`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Health check endpoint ready at /api/health`);

    // Configurar jobs agendados (apenas em ambiente local)
    try {
      configurarJobs();
    } catch (error) {
      console.error('❌ Erro ao configurar jobs:', error);
      // Não encerrar o processo se jobs falharem
    }
  });

  // Tratamento de erro no servidor
  server.on('error', (error: any) => {
    console.error('❌ Server error:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
  });

  // Garantir que o servidor está escutando
  server.on('listening', () => {
    const address = server.address();
    console.log(`✅ Server listening on:`, address);
    console.log(`✅ Health check disponível em: http://0.0.0.0:${PORT}/api/health`);
  });

} else {
  // Em produção na Vercel, jobs agendados devem ser configurados via Vercel Cron
  console.log('✅ Running as serverless function on Vercel');
}

/**
 * Configura jobs agendados (cron jobs)
 */
function configurarJobs() {
  try {
    // Job para enviar lembretes de agendamento
    // Executa a cada hora (no minuto 0 de cada hora)
    // Exemplo: 00:00, 01:00, 02:00, etc.
    cron.schedule('0 * * * *', async () => {
      try {
        console.log('⏰ Executando job de lembretes de agendamento...');
        await enviarLembretesAgendamento();
      } catch (error) {
        console.error('❌ Erro ao executar job de lembretes:', error);
        // Não encerrar o processo se o job falhar
      }
    });

    console.log('✅ Jobs agendados configurados:');
    console.log('   - Lembretes de agendamento: A cada hora (minuto 0)');
  } catch (error) {
    console.error('❌ Erro ao configurar jobs:', error);
    // Não encerrar o processo se configuração de jobs falhar
  }
}
