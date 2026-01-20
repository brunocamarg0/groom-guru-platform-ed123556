import { Router } from 'express';
import * as financeiroController from '../../controllers/financeiroDonoController';
import { autenticarDono } from '../../middleware/auth';

const router = Router();

// Middleware de log para debug (antes da autenticação)
router.use((req, res, next) => {
  console.log('💰 [ROTA FINANCEIRO] Requisição recebida:');
  console.log('   Method:', req.method);
  console.log('   Path:', req.path);
  console.log('   Base URL:', req.baseUrl);
  console.log('   URL completa:', req.originalUrl);
  console.log('   Authorization header presente:', !!req.headers.authorization);
  next();
});

// Todas as rotas requerem autenticação de dono
router.use(autenticarDono);

// Middleware de log após autenticação (só executa se autenticação passar)
router.use((req, res, next) => {
  console.log('✅ [ROTA FINANCEIRO] Autenticação passou, prosseguindo...');
  next();
});

router.get('/pagamentos', financeiroController.listarPagamentos);
router.get('/estatisticas', financeiroController.obterEstatisticasFinanceiras);
router.post('/pagamentos/manual', financeiroController.registrarPagamentoManual);

export default router;

