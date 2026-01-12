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
import './config/passport';
import * as cron from 'node-cron';
import { enviarLembretesAgendamento } from './jobs/lembretesAgendamento';

// Carregar variáveis de ambiente
dotenv.config();

export const app = express();

// Middleware
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:8080'];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(null, true); // Permitir todas as origens em desenvolvimento
    }
  },
  credentials: true,
}));
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

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running', timestamp: new Date().toISOString() });
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

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📚 API Health: http://localhost:${PORT}/api/health`);
  
  // Configurar jobs agendados
  configurarJobs();
});

/**
 * Configura jobs agendados (cron jobs)
 */
function configurarJobs() {
  // Job para enviar lembretes de agendamento
  // Executa a cada hora (no minuto 0 de cada hora)
  // Exemplo: 00:00, 01:00, 02:00, etc.
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Executando job de lembretes de agendamento...');
    await enviarLembretesAgendamento();
  });

  console.log('✅ Jobs agendados configurados:');
  console.log('   - Lembretes de agendamento: A cada hora (minuto 0)');
}
