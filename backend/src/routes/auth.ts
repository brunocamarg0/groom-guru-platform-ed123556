import { Router } from 'express';
import * as authController from '../controllers/authController';
import { autenticarDono } from '../middleware/auth';

const router = Router();

// Rotas de cliente
router.post('/cliente/registro', authController.registrarCliente);
router.post('/cliente/login', authController.loginCliente);

// Rotas de dono
router.post('/dono/cadastro-direto', authController.cadastroDiretoDono);
router.post('/dono/registro', authController.registrarDono);
router.post('/dono/login', authController.loginDono);

// Rota protegida - requer autenticação
// IMPORTANTE: A ordem importa! Rotas mais específicas primeiro
router.put('/dono/alterar-senha', autenticarDono, authController.alterarSenhaDono);

// Rotas de admin
router.post('/admin/login', authController.loginAdmin);

export default router;

