import { Router } from 'express';
import * as produtosController from '../../controllers/produtosDonoController';
import { autenticarDono } from '../../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação de dono
router.use(autenticarDono);

router.get('/', produtosController.listarProdutos);
router.post('/', produtosController.criarProduto);
router.put('/:id', produtosController.atualizarProduto);
router.delete('/:id', produtosController.removerProduto);
router.put('/:id/estoque', produtosController.atualizarEstoque);

export default router;

