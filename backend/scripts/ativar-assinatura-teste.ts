import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Ativando assinatura de teste para cliente...\n');

  // 1. Buscar cliente pelo email
  const cliente = await prisma.cliente.findUnique({
    where: { email: 'brunocamargocontato@hotmail.com' },
    include: {
      assinatura: true,
      clienteProfissional: {
        where: { ativo: true },
        include: { profissional: true },
      },
    },
  });

  if (!cliente) {
    console.error('❌ Cliente não encontrado com email: brunocamargocontato@hotmail.com');
    return;
  }

  console.log('✅ Cliente encontrado:', cliente.nome);
  console.log('   Email:', cliente.email);

  // 2. Buscar barbearia "Bruno Camargo 00"
  const barbearia = await prisma.barbearia.findFirst({
    where: {
      nome: {
        contains: 'Bruno Camargo 00',
        mode: 'insensitive',
      },
    },
    include: {
      planosCliente: true,
      profissionais: true,
    },
  });

  if (!barbearia) {
    console.error('❌ Barbearia "Bruno Camargo 00" não encontrada');
    return;
  }

  console.log('\n✅ Barbearia encontrada:', barbearia.nome);
  console.log('   ID:', barbearia.id);

  // 3. Verificar se tem profissional associado ao cliente
  let profissionalId: string | null = null;
  let profissional: any = null;

  if (cliente.clienteProfissional.length > 0) {
    profissional = cliente.clienteProfissional[0].profissional;
    profissionalId = profissional.id;
    console.log('\n✅ Profissional associado:', profissional.nome);
    console.log('   Comissão por assinatura:', profissional.comissaoAssinatura || 0);
  } else {
    // Buscar primeiro profissional da barbearia
    if (barbearia.profissionais.length > 0) {
      profissional = barbearia.profissionais[0];
      profissionalId = profissional.id;
      console.log('\n⚠️ Nenhum profissional associado, usando primeiro:', profissional.nome);
    } else {
      console.log('\n⚠️ Nenhum profissional disponível na barbearia');
    }
  }

  // 4. Criar ou buscar PlanoCliente da barbearia
  let plano = barbearia.planosCliente.find(p => p.ativo);
  
  if (!plano) {
    console.log('\n📝 Criando plano de cliente para a barbearia...');
    plano = await prisma.planoCliente.create({
      data: {
        nome: 'Plano Mensal Premium',
        descricao: 'Plano mensal com benefícios exclusivos',
        valor: 99.90,
        duracaoMeses: 1,
        beneficios: ['Corte ilimitado', 'Desconto em produtos', 'Agendamento prioritário'],
        ativo: true,
        barbeariaId: barbearia.id,
      },
    });
    console.log('✅ Plano criado:', plano.nome);
  } else {
    console.log('\n✅ Plano existente:', plano.nome, '- R$', plano.valor);
  }

  // 5. Criar ou atualizar AssinaturaCliente
  const dataInicio = new Date();
  const dataVencimento = new Date();
  dataVencimento.setMonth(dataVencimento.getMonth() + plano.duracaoMeses);

  let assinatura = await prisma.assinaturaCliente.findUnique({
    where: { clienteId: cliente.id },
  });

  if (assinatura) {
    console.log('\n📝 Atualizando assinatura existente...');
    assinatura = await prisma.assinaturaCliente.update({
      where: { id: assinatura.id },
      data: {
        planoId: plano.id,
        profissionalId,
        status: 'ativa',
        dataInicio,
        dataVencimento,
        proximoVencimento: dataVencimento,
      },
    });
  } else {
    console.log('\n📝 Criando nova assinatura...');
    assinatura = await prisma.assinaturaCliente.create({
      data: {
        clienteId: cliente.id,
        planoId: plano.id,
        profissionalId,
        status: 'ativa',
        dataInicio,
        dataVencimento,
        proximoVencimento: dataVencimento,
      },
    });
  }

  console.log('✅ Assinatura ativa!');
  console.log('   ID:', assinatura.id);
  console.log('   Status:', assinatura.status);
  console.log('   Profissional ID:', assinatura.profissionalId);

  // 6. Criar PagamentoAssinatura (já pago)
  const mesReferencia = `${dataInicio.getFullYear()}-${String(dataInicio.getMonth() + 1).padStart(2, '0')}`;
  
  const pagamento = await prisma.pagamentoAssinatura.create({
    data: {
      assinaturaId: assinatura.id,
      valor: plano.valor,
      dataVencimento,
      dataPagamento: new Date(),
      status: 'paga',
      metodoPagamento: 'pix',
      observacoes: 'Pagamento de teste - simulado',
    },
  });

  console.log('\n✅ Pagamento criado e marcado como PAGO!');
  console.log('   ID:', pagamento.id);
  console.log('   Valor: R$', pagamento.valor);
  console.log('   Status:', pagamento.status);

  // 7. Criar ComissaoAssinatura para o profissional (se houver)
  if (profissionalId && profissional && profissional.comissaoAssinatura > 0) {
    const comissao = await prisma.comissaoAssinatura.create({
      data: {
        profissionalId,
        assinaturaId: assinatura.id,
        pagamentoId: pagamento.id,
        valorComissao: profissional.comissaoAssinatura,
        valorTotal: plano.valor,
        pago: false, // Comissão ainda não foi paga ao profissional
        mesReferencia,
        barbeariaId: barbearia.id,
      },
    });

    console.log('\n✅ Comissão de assinatura criada!');
    console.log('   Profissional:', profissional.nome);
    console.log('   Valor comissão: R$', comissao.valorComissao);
    console.log('   Pago ao profissional:', comissao.pago ? 'Sim' : 'Não');
  } else if (profissionalId && profissional) {
    console.log('\n⚠️ Profissional não tem comissão por assinatura configurada.');
    console.log('   Configure "comissaoAssinatura" no profissional para gerar comissões.');
    
    // Atualizar profissional com comissão de exemplo
    console.log('\n📝 Configurando comissão de R$ 20,00 por assinatura...');
    await prisma.profissional.update({
      where: { id: profissionalId },
      data: { comissaoAssinatura: 20 },
    });

    const comissao = await prisma.comissaoAssinatura.create({
      data: {
        profissionalId,
        assinaturaId: assinatura.id,
        pagamentoId: pagamento.id,
        valorComissao: 20,
        valorTotal: plano.valor,
        pago: false,
        mesReferencia,
        barbeariaId: barbearia.id,
      },
    });

    console.log('✅ Comissão criada: R$', comissao.valorComissao);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 CONFIGURAÇÃO CONCLUÍDA!');
  console.log('='.repeat(50));
  console.log('\nAgora você pode testar:');
  console.log('1. Painel do Dono → Gestão de Assinaturas de Clientes');
  console.log('2. Painel do Dono → Comissões dos Barbeiros');
  console.log('3. Ver pagamentos e comissões pendentes');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
