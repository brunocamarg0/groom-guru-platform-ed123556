import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { hashSenha, compararSenha } from '../utils/password';
import { gerarTokenJWT } from '../utils/token';
import { enviarEmailRecuperacaoSenha } from '../services/emailService';

/**
 * Registro de cliente
 */
export async function registrarCliente(req: Request, res: Response) {
  try {
    const { nome, email, senha, telefone, dataNascimento } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, email, senha' });
    }

    // Verificar se email já está em uso
    // Usar select explícito para evitar problemas com colunas OAuth que podem não existir
    const emailExistente = await prisma.cliente.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        nome: true,
      },
    });

    if (emailExistente) {
      return res.status(400).json({ error: 'Este email já está em uso' });
    }

    // Hash da senha
    const senhaHash = await hashSenha(senha);

    // Criar cliente
    const cliente = await prisma.cliente.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        telefone: telefone || null,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
        ativo: true,
        emailVerificado: false,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        dataNascimento: true,
        createdAt: true,
      },
    });

    // Gerar token JWT
    const token = gerarTokenJWT({
      id: cliente.id,
      email: cliente.email,
      tipo: 'cliente',
    });

    res.status(201).json({
      sucesso: true,
      mensagem: 'Conta criada com sucesso!',
      token,
      usuario: cliente,
    });
  } catch (error: any) {
    console.error('❌ Erro ao registrar cliente:', error);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Código do erro:', error.code);
    console.error('❌ Mensagem:', error.message);
    
    // Erros específicos do Prisma
    if (error.code === 'P2002') {
      // Violação de constraint única
      const campo = error.meta?.target?.[0] || 'campo';
      return res.status(400).json({ 
        error: `Este ${campo} já está em uso`,
        detalhes: error.meta 
      });
    }
    
    if (error.code === 'P2003') {
      // Foreign key constraint
      return res.status(400).json({ 
        error: 'Erro de relacionamento no banco de dados',
        detalhes: error.meta 
      });
    }
    
    if (error.message?.includes('does not exist')) {
      return res.status(500).json({ 
        error: 'Tabelas não criadas no banco de dados. Execute as migrações: npm run prisma:push',
        detalhes: error.message 
      });
    }
    
    res.status(500).json({ 
      error: 'Erro ao registrar cliente',
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Login de cliente
 */
export async function loginCliente(req: Request, res: Response) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar cliente
    const cliente = await prisma.cliente.findUnique({
      where: { email },
      select: {
        id: true,
        nome: true,
        email: true,
        senha: true,
        telefone: true,
        dataNascimento: true,
        ativo: true,
        emailVerificado: true,
        googleId: true,
        facebookId: true,
        appleId: true,
      },
    });

    if (!cliente) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Verificar senha (pode ser null se criado via OAuth)
    if (!cliente.senha) {
      let provider = 'OAuth';
      if (cliente.googleId) provider = 'Google';
      else if (cliente.facebookId) provider = 'Facebook';
      else if (cliente.appleId) provider = 'Apple';
      return res.status(401).json({ error: `Esta conta foi criada com ${provider}. Use o login com ${provider}.` });
    }

    const senhaValida = await compararSenha(senha, cliente.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Verificar se conta está ativa
    if (!cliente.ativo) {
      return res.status(403).json({ error: 'Conta desativada. Entre em contato com o suporte.' });
    }

    // Gerar token JWT
    const token = gerarTokenJWT({
      id: cliente.id,
      email: cliente.email,
      tipo: 'cliente',
    });

    res.json({
      sucesso: true,
      token,
      usuario: {
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        dataNascimento: cliente.dataNascimento,
      },
    });
  } catch (error) {
    console.error('Erro ao fazer login do cliente:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
}

/**
 * Cadastro direto de dono com barbearia (criação imediata)
 * Cria barbearia e dono em uma única transação
 */
export async function cadastroDiretoDono(req: Request, res: Response) {
  try {
    const { nomeBarbearia, nomeContato, telefone, email, senha } = req.body;

    if (!nomeBarbearia || !nomeContato || !telefone || !email || !senha) {
      return res.status(400).json({ error: 'Campos obrigatórios: nomeBarbearia, nomeContato, telefone, email, senha' });
    }

    // Validação de senha (6-15 caracteres)
    if (senha.length < 6 || senha.length > 15) {
      return res.status(400).json({ error: 'A senha deve ter entre 6 e 15 caracteres' });
    }

    // Verificar se email já está em uso
    const emailExistente = await prisma.usuarioDono.findUnique({
      where: { email },
    });

    if (emailExistente) {
      return res.status(400).json({ error: 'Este email já está em uso' });
    }

    // Hash da senha
    const senhaHash = await hashSenha(senha);

    // Calcular data de vencimento (30 dias para plano básico)
    const dataVencimento = new Date();
    dataVencimento.setDate(dataVencimento.getDate() + 30);

    // Criar barbearia e dono em uma transação
    const resultado = await prisma.$transaction(async (tx) => {
      // Criar barbearia
      const barbearia = await tx.barbearia.create({
        data: {
          nome: nomeBarbearia,
          cnpjCpf: `TEMP-${Date.now()}`, // CNPJ temporário, pode ser atualizado depois
          responsavel: nomeContato,
          plano: 'basico', // Plano padrão
          email: email,
          telefone: telefone,
          // cidade, bairro e cep podem ser adicionados depois nas configurações
          dataVencimento,
          status: 'em_teste',
        },
      });

      // Criar dono
      const dono = await tx.usuarioDono.create({
        data: {
          nome: nomeContato,
          email,
          senha: senhaHash,
          barbeariaId: barbearia.id,
          ativo: true,
          emailVerificado: false,
        },
        select: {
          id: true,
          nome: true,
          email: true,
          barbeariaId: true,
          createdAt: true,
        },
      });

      return { barbearia, dono };
    });

    // Gerar token JWT
    const token = gerarTokenJWT({
      id: resultado.dono.id,
      email: resultado.dono.email,
      tipo: 'dono',
      barbeariaId: resultado.dono.barbeariaId,
    });

    // Enviar email de boas-vindas (não bloqueia o cadastro se falhar)
    try {
      const { enviarEmailBoasVindas } = await import('../services/emailService');
      await enviarEmailBoasVindas({
        email: resultado.dono.email,
        nomeBarbearia: resultado.barbearia.nome,
      });
      console.log('✅ [CADASTRO] Email de boas-vindas enviado com sucesso');
    } catch (emailError: any) {
      // Não falhar o cadastro se o email não for enviado
      console.error('⚠️ [CADASTRO] Erro ao enviar email de boas-vindas (não crítico):', emailError.message);
    }

    res.status(201).json({
      sucesso: true,
      mensagem: 'Cadastro realizado com sucesso!',
      token,
      usuario: resultado.dono,
      barbearia: {
        id: resultado.barbearia.id,
        nome: resultado.barbearia.nome,
        status: resultado.barbearia.status,
      },
    });
  } catch (error: any) {
    console.error('❌ Erro ao realizar cadastro direto:', error);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Código do erro:', error.code);
    console.error('❌ Mensagem:', error.message);
    
    // Erros específicos do Prisma
    if (error.code === 'P2002') {
      // Violação de constraint única
      const campo = error.meta?.target?.[0] || 'campo';
      return res.status(400).json({ 
        error: `Este ${campo} já está em uso`,
        detalhes: error.meta 
      });
    }
    
    if (error.code === 'P2003') {
      // Foreign key constraint
      return res.status(400).json({ 
        error: 'Erro de relacionamento no banco de dados',
        detalhes: error.meta 
      });
    }
    
    if (error.message?.includes('does not exist')) {
      return res.status(500).json({ 
        error: 'Tabelas não criadas no banco de dados. Execute as migrações: npm run prisma:push',
        detalhes: error.message 
      });
    }
    
    res.status(500).json({ 
      error: 'Erro ao realizar cadastro',
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Registro de dono (requer barbearia criada pelo admin)
 * Nota: Para criar conta de dono, o admin precisa criar a barbearia primeiro
 * e então o dono pode se registrar vinculando-se à barbearia
 */
export async function registrarDono(req: Request, res: Response) {
  try {
    const { nome, email, senha, barbeariaId } = req.body;

    if (!nome || !email || !senha || !barbeariaId) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, email, senha, barbeariaId' });
    }

    // Verificar se barbearia existe e não tem dono
    const barbearia = await prisma.barbearia.findUnique({
      where: { id: barbeariaId },
      include: { dono: true },
    });

    if (!barbearia) {
      return res.status(404).json({ error: 'Barbearia não encontrada' });
    }

    if (barbearia.dono) {
      return res.status(400).json({ error: 'Esta barbearia já possui um dono cadastrado' });
    }

    // Verificar se email já está em uso
    const emailExistente = await prisma.usuarioDono.findUnique({
      where: { email },
    });

    if (emailExistente) {
      return res.status(400).json({ error: 'Este email já está em uso' });
    }

    // Hash da senha
    const senhaHash = await hashSenha(senha);

    // Criar dono
    const dono = await prisma.usuarioDono.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        barbeariaId,
        ativo: true,
        emailVerificado: false,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        barbeariaId: true,
        createdAt: true,
      },
    });

    // Gerar token JWT
    const token = gerarTokenJWT({
      id: dono.id,
      email: dono.email,
      tipo: 'dono',
      barbeariaId: dono.barbeariaId,
    });

    // Enviar email de boas-vindas (não bloqueia o cadastro se falhar)
    try {
      const { enviarEmailBoasVindas } = await import('../services/emailService');
      await enviarEmailBoasVindas({
        email: dono.email,
        nomeBarbearia: barbearia.nome,
      });
      console.log('✅ [REGISTRO DONO] Email de boas-vindas enviado com sucesso');
    } catch (emailError: any) {
      // Não falhar o cadastro se o email não for enviado
      console.error('⚠️ [REGISTRO DONO] Erro ao enviar email de boas-vindas (não crítico):', emailError.message);
    }

    res.status(201).json({
      sucesso: true,
      mensagem: 'Conta criada com sucesso!',
      token,
      usuario: dono,
      barbearia: {
        id: barbearia.id,
        nome: barbearia.nome,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar dono:', error);
    res.status(500).json({ error: 'Erro ao registrar dono' });
  }
}

/**
 * Login de dono
 */
export async function loginDono(req: Request, res: Response) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar dono
    const dono = await prisma.usuarioDono.findUnique({
      where: { email },
      include: {
        barbearia: {
          select: {
            id: true,
            nome: true,
            status: true,
          },
        },
      },
    });

    if (!dono) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Verificar senha (pode ser null se criado via OAuth)
    if (!dono.senha) {
      let provider = 'OAuth';
      if (dono.googleId) provider = 'Google';
      return res.status(401).json({ error: `Esta conta foi criada com ${provider}. Use o login com ${provider}.` });
    }

    const senhaValida = await compararSenha(senha, dono.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Verificar se conta está ativa
    if (!dono.ativo) {
      return res.status(403).json({ error: 'Conta desativada. Entre em contato com o suporte.' });
    }

    // Gerar token JWT
    const token = gerarTokenJWT({
      id: dono.id,
      email: dono.email,
      tipo: 'dono',
    });

    res.json({
      sucesso: true,
      token,
      usuario: {
        id: dono.id,
        nome: dono.nome,
        email: dono.email,
        barbeariaId: dono.barbeariaId,
      },
      barbearia: dono.barbearia,
    });
  } catch (error) {
    console.error('Erro ao fazer login do dono:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
}

/**
 * Login de admin
 */
export async function loginAdmin(req: Request, res: Response) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar admin
    const admin = await prisma.usuarioAdmin.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Verificar senha
    const senhaValida = await compararSenha(senha, admin.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Verificar se conta está ativa
    if (!admin.ativo) {
      return res.status(403).json({ error: 'Conta desativada. Entre em contato com o suporte.' });
    }

    // Gerar token JWT
    const token = gerarTokenJWT({
      id: admin.id,
      email: admin.email,
      tipo: 'admin',
    });

    res.json({
      sucesso: true,
      token,
      usuario: {
        id: admin.id,
        nome: admin.nome,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Erro ao fazer login do admin:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
}

/**
 * Alterar senha do dono
 */
export async function alterarSenhaDono(req: Request, res: Response) {
  try {
    console.log('🔐 alterarSenhaDono: Iniciando processo...');
    
    const { senhaAtual, novaSenha } = req.body;
    // O middleware autenticarDono já adiciona userId ao req
    const donoId = (req as any).userId;

    console.log('🔐 alterarSenhaDono: donoId:', donoId);
    console.log('🔐 alterarSenhaDono: senhaAtual presente:', !!senhaAtual);
    console.log('🔐 alterarSenhaDono: novaSenha presente:', !!novaSenha);

    if (!donoId) {
      console.error('❌ alterarSenhaDono: donoId não encontrado no request');
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!senhaAtual || !novaSenha) {
      console.error('❌ alterarSenhaDono: Campos obrigatórios faltando');
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    if (novaSenha.length < 6) {
      console.error('❌ alterarSenhaDono: Nova senha muito curta');
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
    }

    console.log('🔐 alterarSenhaDono: Buscando dono no banco...');
    // Buscar dono
    const dono = await prisma.usuarioDono.findUnique({
      where: { id: donoId },
    });

    if (!dono) {
      console.error('❌ alterarSenhaDono: Dono não encontrado no banco');
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    console.log('🔐 alterarSenhaDono: Dono encontrado:', dono.email);

    if (!dono.senha) {
      console.error('❌ alterarSenhaDono: Conta não possui senha cadastrada');
      return res.status(400).json({ error: 'Esta conta não possui senha cadastrada. Use o login com Google.' });
    }

    console.log('🔐 alterarSenhaDono: Verificando senha atual...');
    // Verificar senha atual
    const senhaValida = await compararSenha(senhaAtual, dono.senha);

    if (!senhaValida) {
      console.error('❌ alterarSenhaDono: Senha atual incorreta');
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    console.log('🔐 alterarSenhaDono: Senha atual válida, gerando hash da nova senha...');
    // Hash da nova senha
    const novaSenhaHash = await hashSenha(novaSenha);

    console.log('🔐 alterarSenhaDono: Atualizando senha no banco...');
    // Atualizar senha
    await prisma.usuarioDono.update({
      where: { id: donoId },
      data: { senha: novaSenhaHash },
    });

    console.log('✅ alterarSenhaDono: Senha alterada com sucesso!');
    res.json({
      sucesso: true,
      mensagem: 'Senha alterada com sucesso!',
    });
  } catch (error: any) {
    console.error('❌ Erro ao alterar senha:', error);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Código:', error.code);
    console.error('❌ Mensagem:', error.message);
    
    // Retornar mensagem de erro mais específica
    const errorMessage = error.message || 'Erro ao alterar senha';
    res.status(500).json({ 
      error: 'Erro ao alterar senha',
      detalhes: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}

/**
 * Recuperação de senha para dono
 */
export async function esqueciMinhaSenhaDono(req: Request, res: Response) {
  try {
    console.log('🔐 esqueciMinhaSenhaDono: Requisição recebida');
    console.log('🔐 Body:', req.body);
    const { email } = req.body;

    if (!email) {
      console.log('❌ Email não fornecido');
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Buscar dono pelo email
    const dono = await prisma.usuarioDono.findUnique({
      where: { email },
      include: {
        barbearia: {
          select: {
            nome: true,
          },
        },
      },
    });

    // Por segurança, sempre retornar sucesso mesmo se o email não existir
    // Isso previne enumeração de emails
    if (!dono) {
      console.log('⚠️ Tentativa de recuperação de senha para email não cadastrado (dono):', email);
      return res.status(200).json({ 
        message: 'Se o email estiver cadastrado, você receberá uma nova senha por email' 
      });
    }

    if (!dono.ativo) {
      console.log('⚠️ Tentativa de recuperação de senha para conta inativa (dono):', email);
      return res.status(200).json({ 
        message: 'Se o email estiver cadastrado, você receberá uma nova senha por email' 
      });
    }

    // Gerar senha aleatória
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
    let senhaNova = '';
    for (let i = 0; i < 12; i++) {
      senhaNova += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }

    // Hash da nova senha
    const senhaHash = await hashSenha(senhaNova);

    // Atualizar senha no banco
    await prisma.usuarioDono.update({
      where: { id: dono.id },
      data: { senha: senhaHash },
    });

    console.log('✅ Nova senha gerada para dono:', dono.email);

    // Enviar email com a nova senha (não bloqueante)
    enviarEmailRecuperacaoSenha({
      email: dono.email,
      nome: dono.nome,
      senhaNova,
      tipo: 'dono',
      nomeBarbearia: dono.barbearia?.nome,
    }).then(() => {
      console.log('✅ Email de recuperação enviado para:', dono.email);
    }).catch((emailError) => {
      console.error('❌ Erro ao enviar email de recuperação:', emailError);
      // Não falhar a operação se o email falhar, mas logar o erro
    });

    // Retornar resposta imediatamente, sem esperar o email
    console.log('✅ Retornando resposta de sucesso');
    return res.status(200).json({ 
      message: 'Se o email estiver cadastrado, você receberá uma nova senha por email' 
    });
  } catch (error: any) {
    console.error('❌ Erro ao recuperar senha do dono:', error);
    return res.status(500).json({ 
      error: 'Erro ao processar solicitação de recuperação de senha' 
    });
  }
}

/**
 * Recuperação de senha para cliente
 */
export async function esqueciMinhaSenhaCliente(req: Request, res: Response) {
  try {
    console.log('🔐 esqueciMinhaSenhaCliente: Requisição recebida');
    console.log('🔐 Body:', req.body);
    const { email } = req.body;

    if (!email) {
      console.log('❌ Email não fornecido');
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Buscar cliente pelo email
    // Usar select mínimo para evitar problemas com colunas OAuth que podem não existir
    let cliente;
    try {
      cliente = await prisma.cliente.findUnique({
        where: { email },
        select: {
          id: true,
          nome: true,
          email: true,
          senha: true,
          ativo: true,
          emailVerificado: true,
        },
      });
    } catch (prismaError: any) {
      // Se der erro por colunas não existentes, tentar sem select (pegar tudo que existe)
      if (prismaError.code === 'P2022' || prismaError.message?.includes('does not exist')) {
        console.warn('⚠️ Colunas OAuth não existem, tentando query alternativa');
        cliente = await prisma.$queryRaw`
          SELECT id, nome, email, senha, ativo, "emailVerificado"
          FROM "Cliente"
          WHERE email = ${email}
          LIMIT 1
        ` as any;
        if (cliente && Array.isArray(cliente) && cliente.length > 0) {
          cliente = cliente[0];
        }
      } else {
        throw prismaError;
      }
    }

    // Por segurança, sempre retornar sucesso mesmo se o email não existir
    // Isso previne enumeração de emails
    if (!cliente) {
      console.log('⚠️ Tentativa de recuperação de senha para email não cadastrado (cliente):', email);
      return res.status(200).json({ 
        message: 'Se o email estiver cadastrado, você receberá uma nova senha por email' 
      });
    }

    if (!cliente.ativo) {
      console.log('⚠️ Tentativa de recuperação de senha para conta inativa (cliente):', email);
      return res.status(200).json({ 
        message: 'Se o email estiver cadastrado, você receberá uma nova senha por email' 
      });
    }

    // Gerar senha aleatória
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
    let senhaNova = '';
    for (let i = 0; i < 12; i++) {
      senhaNova += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }

    // Hash da nova senha
    const senhaHash = await hashSenha(senhaNova);

    // Atualizar senha no banco
    // Usar query raw para evitar problemas com colunas OAuth que podem não existir
    try {
      await prisma.cliente.update({
        where: { id: cliente.id },
        data: { senha: senhaHash },
      });
    } catch (updateError: any) {
      // Se der erro por colunas não existentes, usar SQL raw
      if (updateError.code === 'P2022' || updateError.message?.includes('does not exist')) {
        console.warn('⚠️ Colunas OAuth não existem, usando SQL raw para update');
        await prisma.$executeRaw`
          UPDATE "Cliente"
          SET senha = ${senhaHash}, "updatedAt" = NOW()
          WHERE id = ${cliente.id}
        `;
      } else {
        throw updateError;
      }
    }

    console.log('✅ Nova senha gerada para cliente:', cliente.email);

    // Enviar email com a nova senha (não bloqueante)
    enviarEmailRecuperacaoSenha({
      email: cliente.email,
      nome: cliente.nome,
      senhaNova,
      tipo: 'cliente',
    }).then(() => {
      console.log('✅ Email de recuperação enviado para:', cliente.email);
    }).catch((emailError) => {
      console.error('❌ Erro ao enviar email de recuperação:', emailError);
      // Não falhar a operação se o email falhar, mas logar o erro
    });

    // Retornar resposta imediatamente, sem esperar o email
    console.log('✅ Retornando resposta de sucesso');
    return res.status(200).json({ 
      message: 'Se o email estiver cadastrado, você receberá uma nova senha por email' 
    });
  } catch (error: any) {
    console.error('❌ Erro ao recuperar senha do cliente:', error);
    return res.status(500).json({ 
      error: 'Erro ao processar solicitação de recuperação de senha' 
    });
  }
}

