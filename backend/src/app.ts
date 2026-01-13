import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import adminBarbeariasRoutes from './routes/admin/barbearias';
import adminConvitesRoutes from './routes/admin/convites';
import adminUsuariosRoutes from './routes/admin/usuarios';
import criarExemploRoutes from './routes/admin/criar-exemplo';
import ativacaoRoutes from './routes/ativacao';
import authRoutes from './routes/auth';
import googleAuthRoutes from './routes/googleAuth';
import solicitacoesRoutes from './routes/solicitacoes';
import agendamentosRoutes from './routes/agendamentos';
import donoProfissionaisRoutes from './routes/dono/profissionais';
import donoClientesRoutes from './routes/dono/clientes';
import donoServicosRoutes from './routes/dono/servicos';
import donoDashboardRoutes from './routes/dono/dashboard';
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

// Carregar variáveis de ambiente
dotenv.config();

export const app = express();

// Middleware CORS
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL, 'https://groom-guru-platform.vercel.app']
  : ['http://localhost:5173', 'http://localhost:8080', 'https://groom-guru-platform.vercel.app'];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    // Permitir origens específicas ou todas em desenvolvimento
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Em produção, permitir apenas origens conhecidas
      // Em desenvolvimento, permitir todas
      if (process.env.NODE_ENV === 'production') {
        // Permitir Vercel mesmo se não estiver na lista
        if (origin.includes('vercel.app') || origin.includes('groom-guru-platform')) {
          callback(null, true);
        } else {
          callback(null, true); // Por enquanto permitir todas para debug
        }
      } else {
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

app.use(express.json());

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

// Rota de teste - DEVE SER A PRIMEIRA ROTA
app.get('/api/health', (req, res) => {
  console.log('✅ Health check chamado');
  res.status(200).json({ 
    status: 'API is running', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rotas públicas (autenticação e ativação de conta)
app.use('/api/auth', authRoutes);
app.use('/api/auth/google', googleAuthRoutes);
app.use('/api', ativacaoRoutes);
app.use('/api/solicitacoes', solicitacoesRoutes);
app.use('/api/agendamentos', agendamentosRoutes);

// Rotas do dono (requerem autenticação)
app.use('/api/dono/profissionais', donoProfissionaisRoutes);
app.use('/api/dono/clientes', donoClientesRoutes);
app.use('/api/dono/servicos', donoServicosRoutes);
app.use('/api/dono/dashboard', donoDashboardRoutes);

// Rotas admin - ordem importa! Rotas mais específicas primeiro
app.use('/api/admin', criarExemploRoutes); // /api/admin/criar-exemplo
app.use('/api/admin', adminUsuariosRoutes); // /api/admin/barbearias/:id/dono
app.use('/api/admin', adminConvitesRoutes); // /api/admin/barbearias/:id/convite
app.use('/api/admin/barbearias', adminBarbeariasRoutes); // /api/admin/barbearias

// Iniciar servidor apenas se não estiver rodando como serverless function (Vercel)
// Na Vercel, o app é exportado e não precisa de app.listen()
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  const PORT = parseInt(process.env.PORT || '3001', 10);
  
  // Tratamento de erros para evitar crash
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // Não encerrar o processo imediatamente, apenas logar
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // Não encerrar o processo imediatamente, apenas logar
  });
  
  try {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
      console.log(`📚 API Health: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
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
    });
    
    // Garantir que o servidor está escutando
    server.on('listening', () => {
      console.log(`✅ Server listening on port ${PORT}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
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
