import { Router } from 'express';
import * as comissoesController from '../../controllers/comissoesController';
import * as comissoesCompletoController from '../../controllers/comissoesCompletoController';
import { autenticarDono } from '../../middleware/auth';

const router = Router();

// Aplicar autenticação do dono
router.use(autenticarDono);

// Rotas de comissões
router.get('/resumo', comissoesController.listarResumoComissoes);
router.get('/profissional/:profissionalId', comissoesController.calcularComissoesProfissional);
router.get('/completo/:profissionalId', comissoesCompletoController.relatorioComissoesCompleto);
router.post('/marcar-paga', comissoesController.marcarComissaoComoPaga);
router.post('/marcar-todas-pagas', comissoesController.marcarTodasComissoesComoPagas);

// Log para debug
console.log('✅ Rotas de comissões registradas:');
console.log('   GET    /api/dono/comissoes/resumo');
console.log('   GET    /api/dono/comissoes/profissional/:profissionalId');
console.log('   POST   /api/dono/comissoes/marcar-paga');
console.log('   POST   /api/dono/comissoes/marcar-todas-pagas');

export default router;
