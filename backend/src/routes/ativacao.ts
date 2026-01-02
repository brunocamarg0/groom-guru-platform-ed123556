import { Router } from 'express';
import * as convitesController from '../controllers/convitesController';

const router = Router();

// Validar token de convite (GET - para verificar antes de mostrar formulário)
router.get('/validar-token', convitesController.validarToken);

// Ativar conta do dono (POST - criar usuário)
router.post('/ativar-conta', convitesController.ativarConta);

export default router;

