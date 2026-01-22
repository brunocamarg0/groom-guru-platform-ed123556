/**
 * Script para testar o envio de email de boas-vindas
 * Execute: npx tsx scripts/testar-email-boas-vindas.ts
 */

import { enviarEmailBoasVindas } from '../src/services/emailService';

async function testarEmailBoasVindas() {
  const email = 'bcesar8@hotmail.com';
  const nomeBarbearia = 'Barbearia Teste';
  const linkFormulario = process.env.FORMULARIO_BARBEARIA_LINK || 'https://forms.gle/seu-formulario-aqui';

  console.log('📧 [TESTE] Iniciando teste de envio de email de boas-vindas...');
  console.log('📧 [TESTE] Email de destino:', email);
  console.log('📧 [TESTE] Nome da barbearia:', nomeBarbearia);
  console.log('📧 [TESTE] Link do formulário:', linkFormulario);
  console.log('');

  try {
    const resultado = await enviarEmailBoasVindas({
      email,
      nomeBarbearia,
      linkFormulario,
    });

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    if (resultado.sucesso) {
      console.log('✅ [TESTE] Email enviado com sucesso!');
      console.log('✅ [TESTE] Método:', resultado.metodo);
      console.log('✅ [TESTE] Message ID:', resultado.messageId);
      if (resultado.previewUrl) {
        console.log('📧 [TESTE] Preview URL:', resultado.previewUrl);
        console.log('   (Acesse este link para ver o email de teste)');
      }
    } else {
      console.log('❌ [TESTE] Falha ao enviar email');
      console.log('❌ [TESTE] Erro:', resultado.erro);
    }
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('📧 [TESTE] Verifique a caixa de entrada e spam do email:', email);
  } catch (error: any) {
    console.error('');
    console.error('❌ [TESTE] Erro ao enviar email:', error.message);
    console.error('❌ [TESTE] Stack:', error.stack);
  }

  process.exit(0);
}

testarEmailBoasVindas();

