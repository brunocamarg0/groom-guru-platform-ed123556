import { Router, Request, Response } from 'express';
import { enviarEmailBoasVindas } from '../services/emailService';

const router = Router();

/**
 * Rota temporária para testar envio de email de boas-vindas
 * GET ou POST /api/test-email/boas-vindas
 * 
 * Parâmetros (query ou body):
 * - email: Email de destino (padrão: bcesar8@hotmail.com)
 * - nomeBarbearia: Nome da barbearia (padrão: "Barbearia Teste")
 * - linkFormulario: Link do formulário (opcional)
 */
router.get('/boas-vindas', async (req: Request, res: Response) => {
  await testarEmailBoasVindas(req, res);
});

router.post('/boas-vindas', async (req: Request, res: Response) => {
  await testarEmailBoasVindas(req, res);
});

async function testarEmailBoasVindas(req: Request, res: Response) {
  try {
    const email = (req.query.email || req.body.email || 'bcesar8@hotmail.com') as string;
    const nomeBarbearia = (req.query.nomeBarbearia || req.body.nomeBarbearia || 'Barbearia Teste') as string;
    const linkFormulario = (req.query.linkFormulario || req.body.linkFormulario || process.env.FORMULARIO_BARBEARIA_LINK) as string | undefined;

    console.log('📧 [TESTE EMAIL] Iniciando teste de envio de email de boas-vindas...');
    console.log('📧 [TESTE EMAIL] Email de destino:', email);
    console.log('📧 [TESTE EMAIL] Nome da barbearia:', nomeBarbearia);
    console.log('📧 [TESTE EMAIL] Link do formulário:', linkFormulario);

    const resultado = await enviarEmailBoasVindas({
      email,
      nomeBarbearia,
      linkFormulario,
    });

    if (resultado.sucesso) {
      res.status(200).json({
        sucesso: true,
        mensagem: 'Email enviado com sucesso!',
        metodo: resultado.metodo,
        messageId: resultado.messageId,
        previewUrl: resultado.previewUrl,
        email: email,
        aviso: resultado.previewUrl ? 'Email enviado via Ethereal (teste). Acesse o previewUrl para ver. Em produção, configure SMTP ou Resend.' : 'Email enviado. Verifique a caixa de entrada e spam.',
      });
    } else {
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao enviar email',
        erro: resultado.erro,
        email: email,
      });
    }
  } catch (error: any) {
    console.error('❌ [TESTE EMAIL] Erro:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao enviar email',
      erro: error.message,
    });
  }
}

export default router;

