import { Router } from 'express';
import * as barbeariasPublicasController from '../controllers/barbeariasPublicasController';

const router = Router();

// Rotas públicas de barbearias (para clientes)
router.get('/', barbeariasPublicasController.listarBarbeariasPublicas);
router.get('/:id', barbeariasPublicasController.buscarBarbeariaPublica);

export default router;

