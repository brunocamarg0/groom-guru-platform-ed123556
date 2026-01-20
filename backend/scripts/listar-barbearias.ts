import prisma from '../src/lib/prisma';

async function listarBarbearias() {
  try {
    console.log('🔍 Buscando barbearias cadastradas...\n');
    
    const barbearias = await prisma.barbearia.findMany({
      include: {
        dono: {
          select: {
            id: true,
            nome: true,
            email: true,
            ativo: true,
          },
        },
        servicos: {
          select: {
            id: true,
            nome: true,
            ativo: true,
          },
        },
        profissionais: {
          select: {
            id: true,
            nome: true,
            ativo: true,
          },
        },
        _count: {
          select: {
            agendamentos: true,
            servicos: true,
            profissionais: true,
          },
        },
      },
      orderBy: {
        dataCriacao: 'desc',
      },
    });

    if (barbearias.length === 0) {
      console.log('❌ Nenhuma barbearia cadastrada no sistema.');
      return;
    }

    console.log(`✅ Total de barbearias cadastradas: ${barbearias.length}\n`);
    console.log('═'.repeat(80));
    
    barbearias.forEach((barbearia, index) => {
      console.log(`\n${index + 1}. BARBEARIA: ${barbearia.nome}`);
      console.log('─'.repeat(80));
      console.log(`   ID: ${barbearia.id}`);
      console.log(`   Status: ${barbearia.status}`);
      console.log(`   CNPJ/CPF: ${barbearia.cnpjCpf}`);
      console.log(`   Responsável: ${barbearia.responsavel}`);
      console.log(`   Plano: ${barbearia.plano}`);
      console.log(`   Email: ${barbearia.email || 'Não informado'}`);
      console.log(`   Telefone: ${barbearia.telefone || 'Não informado'}`);
      console.log(`   Cidade: ${barbearia.cidade || 'Não informado'}`);
      console.log(`   Bairro: ${barbearia.bairro || 'Não informado'}`);
      console.log(`   Endereço: ${barbearia.endereco || 'Não informado'}`);
      console.log(`   Data de Criação: ${barbearia.dataCriacao.toLocaleString('pt-BR')}`);
      console.log(`   Data de Vencimento: ${barbearia.dataVencimento.toLocaleString('pt-BR')}`);
      
      if (barbearia.dono) {
        console.log(`\n   👤 DONO:`);
        console.log(`      ID: ${barbearia.dono.id}`);
        console.log(`      Nome: ${barbearia.dono.nome}`);
        console.log(`      Email: ${barbearia.dono.email}`);
        console.log(`      Status: ${barbearia.dono.ativo ? '✅ Ativo' : '❌ Inativo'}`);
      } else {
        console.log(`\n   ⚠️  DONO: Nenhum dono vinculado`);
      }
      
      console.log(`\n   📊 ESTATÍSTICAS:`);
      console.log(`      Serviços: ${barbearia._count.servicos} cadastrados`);
      console.log(`      Profissionais: ${barbearia._count.profissionais} cadastrados`);
      console.log(`      Agendamentos: ${barbearia._count.agendamentos} total`);
      
      if (barbearia.servicos.length > 0) {
        console.log(`\n   ✂️  SERVIÇOS:`);
        barbearia.servicos.forEach((servico) => {
          console.log(`      - ${servico.nome} ${servico.ativo ? '✅' : '❌'}`);
        });
      }
      
      if (barbearia.profissionais.length > 0) {
        console.log(`\n   👨‍💼 PROFISSIONAIS:`);
        barbearia.profissionais.forEach((prof) => {
          console.log(`      - ${prof.nome} ${prof.ativo ? '✅' : '❌'}`);
        });
      }
      
      console.log('');
    });
    
    console.log('═'.repeat(80));
    console.log(`\n📊 RESUMO:`);
    console.log(`   Total de barbearias: ${barbearias.length}`);
    console.log(`   Barbearias ativas: ${barbearias.filter(b => b.status === 'ativa').length}`);
    console.log(`   Barbearias em teste: ${barbearias.filter(b => b.status === 'em_teste').length}`);
    console.log(`   Barbearias bloqueadas: ${barbearias.filter(b => b.status === 'bloqueada').length}`);
    console.log(`   Barbearias canceladas: ${barbearias.filter(b => b.status === 'cancelada').length}`);
    console.log(`   Barbearias com dono vinculado: ${barbearias.filter(b => b.dono).length}`);
    console.log(`   Barbearias sem dono: ${barbearias.filter(b => !b.dono).length}`);
    
  } catch (error) {
    console.error('❌ Erro ao listar barbearias:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listarBarbearias();
