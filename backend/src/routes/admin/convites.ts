import { Router } from 'express';
import * as convitesController from '../../controllers/convitesController';

const router = Router();

// Gerar convite para barbearia
router.post('/barbearias/:barbeariaId/convite', convitesController.gerarConvite);

// Listar convites de uma barbearia
router.get('/barbearias/:barbeariaId/convites', convitesController.listarConvites);

export default router;

