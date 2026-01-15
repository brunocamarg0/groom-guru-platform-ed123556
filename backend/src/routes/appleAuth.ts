import { Router, Request, Response } from 'express';
import passport from 'passport';
import * as appleAuthController from '../controllers/appleAuthController';

const router = Router();

// Rotas de autenticação Apple para Cliente
router.get(
  '/cliente',
  (req: Request, res: Response, next) => {
    // Salvar tipo na sessão
    (req.session as any).authType = 'cliente';
    next();
  },
  passport.authenticate('apple-cliente', {
    scope: ['name', 'email'],
  })
);

router.get(
  '/cliente/callback',
  passport.authenticate('apple-cliente', { failureRedirect: '/login?error=apple_auth_failed' }),
  appleAuthController.appleCallbackCliente
);

// Rotas de autenticação Apple para Dono
router.get(
  '/dono',
  (req: Request, res: Response, next) => {
    // Salvar tipo e barbeariaId na sessão
    (req.session as any).authType = 'dono';
    (req.session as any).barbeariaId = req.query.barbeariaId;
    next();
  },
  passport.authenticate('apple-dono', {
    scope: ['name', 'email'],
  })
);

router.get(
  '/dono/callback',
  passport.authenticate('apple-dono', { failureRedirect: '/login?error=apple_auth_failed' }),
  appleAuthController.appleCallbackDono
);

export default router;

