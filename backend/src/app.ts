import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import adminBarbeariasRoutes from './routes/admin/barbearias';
import adminConvitesRoutes from './routes/admin/convites';
import ativacaoRoutes from './routes/ativacao';

// Carregar variáveis de ambiente
dotenv.config();

export const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running', timestamp: new Date().toISOString() });
});

// Rotas públicas (ativação de conta)
app.use('/api', ativacaoRoutes);

// Rotas admin
app.use('/api/admin/barbearias', adminBarbeariasRoutes);
app.use('/api/admin', adminConvitesRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📚 API Health: http://localhost:${PORT}/api/health`);
});
