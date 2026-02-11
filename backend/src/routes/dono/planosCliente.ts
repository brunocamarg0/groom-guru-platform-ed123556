import { Router } from 'express';
import { autenticarDono } from '../../middleware/auth';
import * as planosClienteController from '../../controllers/planosClienteController';
import * as assinaturasClienteController from '../../controllers/assinaturasClienteController';
import * as pagamentosAssinaturaController from '../../controllers/pagamentosAssinaturaController';
import * as comissoesAssinaturaController from '../../controllers/comissoesAssinaturaController';
import * as assinaturasClienteTesteController from '../../controllers/assinaturasClienteTesteController';

const router = Router();

// Todas as rotas requerem autenticação de dono
router.use(autenticarDono);

// Rotas de planos de clientes
router.get('/planos-cliente', planosClienteController.listarPlanosCliente);
router.get('/planos-cliente/:id', planosClienteController.buscarPlanoCliente);
router.post('/planos-cliente', planosClienteController.criarPlanoCliente);
router.put('/planos-cliente/:id', planosClienteController.atualizarPlanoCliente);
router.delete('/planos-cliente/:id', planosClienteController.deletarPlanoCliente);

// Rotas de assinaturas de clientes
router.get('/assinaturas-cliente', assinaturasClienteController.listarAssinaturasCliente);
router.get('/assinaturas-cliente/:id', assinaturasClienteController.buscarAssinaturaCliente);
router.post('/assinaturas-cliente', assinaturasClienteController.criarAssinaturaCliente);
router.put('/assinaturas-cliente/:id', assinaturasClienteController.atualizarAssinaturaCliente);
router.post('/assinaturas-cliente/:id/cancelar', assinaturasClienteController.cancelarAssinaturaCliente);

// Rotas de pagamentos de assinaturas
router.get('/pagamentos-assinatura', pagamentosAssinaturaController.listarPagamentosAssinatura);
router.post('/pagamentos-assinatura/:id/marcar-pago', pagamentosAssinaturaController.marcarPagamentoComoPago);

// Rotas de comissões por assinatura
router.get('/comissoes-assinatura/resumo', comissoesAssinaturaController.listarResumoComissoesAssinatura);
router.get('/comissoes-assinatura/:profissionalId', comissoesAssinaturaController.calcularComissoesAssinatura);
router.post('/comissoes-assinatura/:id/marcar-pago', comissoesAssinaturaController.marcarComissaoAssinaturaComoPaga);
router.post('/comissoes-assinatura/profissional/:profissionalId/marcar-todas-pagas', comissoesAssinaturaController.marcarTodasComissoesAssinaturaComoPagas);

// Rotas de teste (apenas desenvolvimento)
router.post('/assinaturas-cliente/:id/simular-pagamento', assinaturasClienteTesteController.simularPagamentoAssinatura);

export default router;

