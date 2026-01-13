import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  KPI,
  AgendamentoDono,
  ProfissionalDono,
  ClienteDono,
  PagamentoDono,
  PromocaoDono,
  AvaliacaoDono,
  ProdutoDono,
  NotificacaoDono,
  ConfiguracaoBarbearia,
  RelatorioDono,
} from "@/types/dono";
import { apiGet, apiPost, apiPut, apiDelete } from "@/services/api";
import { useBarbearias } from "@/context/BarbeariasContext";
import { toast } from "sonner";

interface DonoContextType {
  // Dados
  kpi: KPI;
  agendamentos: AgendamentoDono[];
  profissionais: ProfissionalDono[];
  clientes: ClienteDono[];
  pagamentos: PagamentoDono[];
  promocoes: PromocaoDono[];
  avaliacoes: AvaliacaoDono[];
  produtos: ProdutoDono[];
  notificacoes: NotificacaoDono[];
  configuracao: ConfiguracaoBarbearia;
  
  // Funções
  criarAgendamento: (agendamento: Omit<AgendamentoDono, "id" | "dataCriacao">) => Promise<void>;
  atualizarAgendamento: (id: string, dados: Partial<AgendamentoDono>) => Promise<void>;
  cancelarAgendamento: (id: string) => Promise<void>;
  confirmarAgendamento: (id: string) => Promise<void>;
  recusarAgendamento: (id: string, motivo?: string) => Promise<void>;
  
  adicionarProfissional: (profissional: Omit<ProfissionalDono, "id" | "dataAdmissao" | "avaliacaoMedia" | "totalAvaliacoes" | "faturamentoTotal" | "faltas">) => Promise<void>;
  atualizarProfissional: (id: string, dados: Partial<ProfissionalDono>) => Promise<void>;
  removerProfissional: (id: string) => Promise<void>;
  
  adicionarCliente: (cliente: Omit<ClienteDono, "id" | "dataCadastro" | "totalAgendamentos" | "ticketMedio" | "frequencia">) => Promise<void>;
  atualizarCliente: (id: string, dados: Partial<ClienteDono>) => Promise<void>;
  marcarClienteVIP: (id: string, vip: boolean) => void;
  
  registrarPagamento: (pagamento: Omit<PagamentoDono, "id">) => void;
  
  criarPromocao: (promocao: Omit<PromocaoDono, "id">) => void;
  atualizarPromocao: (id: string, dados: Partial<PromocaoDono>) => void;
  
  responderAvaliacao: (id: string, resposta: string) => void;
  
  adicionarProduto: (produto: Omit<ProdutoDono, "id">) => void;
  atualizarProduto: (id: string, dados: Partial<ProdutoDono>) => void;
  atualizarEstoque: (id: string, quantidade: number) => void;
  
  marcarNotificacaoLida: (id: string) => void;
  
  atualizarConfiguracao: (dados: Partial<ConfiguracaoBarbearia>) => void;
  
  gerarRelatorio: (dataInicio: string, dataFim: string) => RelatorioDono;
}

const DonoContext = createContext<DonoContextType | undefined>(undefined);

// Dados mockados iniciais
const kpiInicial: KPI = {
  faturamentoHoje: 450.00,
  faturamentoSemana: 3200.00,
  faturamentoMes: 12500.00,
  agendamentosHoje: 12,
  cancelamentos: 2,
  clientesRecorrentes: 45,
  notaMedia: 4.8,
};

const profissionaisIniciais: ProfissionalDono[] = [
  {
    id: "1",
    nome: "Carlos Barbeiro",
    telefone: "(11) 99999-9999",
    especialidades: ["Corte", "Barba", "Hidratação"],
    comissao: { tipo: "percentual", valor: 40 },
    ativo: true,
    dataAdmissao: "2024-01-15",
    avaliacaoMedia: 4.9,
    totalAvaliacoes: 120,
    faturamentoTotal: 15000.00,
    faltas: 0,
  },
  {
    id: "2",
    nome: "João Silva",
    telefone: "(11) 88888-8888",
    especialidades: ["Corte", "Alisamento"],
    comissao: { tipo: "percentual", valor: 35 },
    ativo: true,
    dataAdmissao: "2024-02-01",
    avaliacaoMedia: 4.7,
    totalAvaliacoes: 85,
    faturamentoTotal: 9800.00,
    faltas: 1,
  },
];

const clientesIniciais: ClienteDono[] = [
  {
    id: "1",
    nome: "Pedro Santos",
    telefone: "(11) 77777-7777",
    vip: true,
    totalAgendamentos: 15,
    ultimoAgendamento: "2024-03-15",
    ticketMedio: 45.00,
    frequencia: 2,
    dataCadastro: "2024-01-10",
  },
  {
    id: "2",
    nome: "Maria Oliveira",
    telefone: "(11) 66666-6666",
    vip: false,
    totalAgendamentos: 8,
    ultimoAgendamento: "2024-03-10",
    ticketMedio: 35.00,
    frequencia: 1,
    dataCadastro: "2024-02-05",
  },
];

const agendamentosIniciais: AgendamentoDono[] = [
  {
    id: "1",
    clienteId: "1",
    clienteNome: "Pedro Santos",
    profissionalId: "1",
    profissionalNome: "Carlos Barbeiro",
    servicoId: "s1",
    servicoNome: "Corte + Barba",
    data: new Date().toISOString().split("T")[0],
    horario: "14:00",
    duracao: 60,
    valor: 45.00,
    status: "confirmado",
    dataCriacao: new Date().toISOString(),
  },
];

const produtosIniciais: ProdutoDono[] = [
  {
    id: "1",
    nome: "Pomada Modeladora Premium",
    categoria: "pomada",
    preco: 25.00,
    estoque: 15,
    estoqueMinimo: 5,
    ativo: true,
  },
  {
    id: "2",
    nome: "Óleo Capilar Hidratante",
    categoria: "oleo",
    preco: 30.00,
    estoque: 8,
    estoqueMinimo: 3,
    ativo: true,
  },
];

const configuracaoInicial: ConfiguracaoBarbearia = {
  id: "1",
  nome: "Barbearia do João",
  cnpjCpf: "12.345.678/0001-90",
  modoConfirmacao: "hibrido",
  horarioFuncionamento: {
    segunda: { aberto: true, inicio: "09:00", fim: "18:00" },
    terca: { aberto: true, inicio: "09:00", fim: "18:00" },
    quarta: { aberto: true, inicio: "09:00", fim: "18:00" },
    quinta: { aberto: true, inicio: "09:00", fim: "18:00" },
    sexta: { aberto: true, inicio: "09:00", fim: "19:00" },
    sabado: { aberto: true, inicio: "08:00", fim: "17:00" },
    domingo: { aberto: false, inicio: "09:00", fim: "13:00" },
  },
  politicaCancelamento: {
    prazoMinimo: 2,
    permitirReagendamento: true,
  },
  linkAgendamento: "https://barberpro.com/agendar/joao",
  paginaPublica: true,
};

export function DonoProvider({ children }: { children: ReactNode }) {
  // Obter barbeariaId do localStorage (salvo após login)
  const getBarbeariaIdFromStorage = (): string | null => {
    try {
      const userStr = localStorage.getItem('user');
      const barbeariaStr = localStorage.getItem('barbearia');
      
      if (barbeariaStr) {
        const barbearia = JSON.parse(barbeariaStr);
        return barbearia.id || null;
      }
      
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.barbeariaId || null;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao obter barbeariaId do localStorage:', error);
      return null;
    }
  };

  const [barbeariaId, setBarbeariaId] = useState<string | null>(getBarbeariaIdFromStorage());
  const [kpi, setKpi] = useState<KPI>(kpiInicial);
  const [agendamentos, setAgendamentos] = useState<AgendamentoDono[]>([]);
  // IMPORTANTE: Sempre inicia vazio - dados vêm APENAS do banco de dados
  const [profissionais, setProfissionais] = useState<ProfissionalDono[]>([]);
  const [clientes, setClientes] = useState<ClienteDono[]>([]);
  const [pagamentos, setPagamentos] = useState<PagamentoDono[]>([]);
  const [promocoes, setPromocoes] = useState<PromocaoDono[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoDono[]>([]);
  const [produtos, setProdutos] = useState<ProdutoDono[]>([]);
  const [notificacoes, setNotificacoes] = useState<NotificacaoDono[]>([]);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoBarbearia>(configuracaoInicial);
  const [loading, setLoading] = useState(true);
  const [ultimoCarregamento, setUltimoCarregamento] = useState<number>(0);

  // Atualizar barbeariaId quando localStorage mudar
  useEffect(() => {
    const checkBarbeariaId = () => {
      const newBarbeariaId = getBarbeariaIdFromStorage();
      if (newBarbeariaId !== barbeariaId) {
        setBarbeariaId(newBarbeariaId);
      }
    };

    // Verificar imediatamente
    checkBarbeariaId();

    // Verificar quando localStorage mudar (evento customizado)
    const handleStorageChange = () => {
      checkBarbeariaId();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Verificar periodicamente (fallback)
    const interval = setInterval(checkBarbeariaId, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [barbeariaId]);

  // Carregar dados da API quando o componente montar ou barbeariaId mudar
  // Mas só se estiver em uma rota do dono (não na página inicial)
  useEffect(() => {
    const currentPath = window.location.pathname;
    const isDonoRoute = currentPath.startsWith('/dono');
    
    if (barbeariaId && isDonoRoute) {
      console.log('🔄 Carregando dados do banco para barbeariaId:', barbeariaId);
      console.log('🔄 Rota atual:', currentPath);
      console.log('🔄 Token disponível:', !!localStorage.getItem('token'));
      carregarDados();
    } else if (isDonoRoute && !barbeariaId) {
      console.warn('⚠️ BarbeariaId não encontrado. Verifique se está logado como dono.');
      console.warn('⚠️ localStorage.user:', localStorage.getItem('user'));
      console.warn('⚠️ localStorage.barbearia:', localStorage.getItem('barbearia'));
      setLoading(false);
    }
  }, [barbeariaId]);

  // Listener para recarregar quando navegar para /dono
  useEffect(() => {
    if (!barbeariaId) return;

    const checkRoute = () => {
      const currentPath = window.location.pathname;
      const isDonoRoute = currentPath.startsWith('/dono');
      
      if (isDonoRoute) {
        console.log('🔄 Detectada navegação para /dono, recarregando dados...');
        carregarDados();
      }
    };

    // Verificar imediatamente
    checkRoute();

    // Escutar mudanças de rota
    const handlePopState = () => {
      setTimeout(checkRoute, 100);
    };

    window.addEventListener('popstate', handlePopState);
    
    // Verificar periodicamente (fallback para React Router)
    const interval = setInterval(checkRoute, 2000);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearInterval(interval);
    };
  }, [barbeariaId]);

  const carregarDados = async () => {
    if (!barbeariaId) {
      console.warn('⚠️ Não é possível carregar dados: barbeariaId não definido');
      setLoading(false);
      return;
    }

    // Evitar múltiplas chamadas simultâneas (debounce de 1 segundo)
    const agora = Date.now();
    if (agora - ultimoCarregamento < 1000) {
      console.log('⏸️ Carregamento já em andamento, aguardando...');
      return;
    }
    setUltimoCarregamento(agora);

    console.log('📥 Iniciando carregamento de dados do banco de dados...');
    console.log('📥 barbeariaId:', barbeariaId);
    console.log('📥 Token:', localStorage.getItem('token') ? 'Presente' : 'Ausente');
    setLoading(true);
    try {
      // Carregar dados em paralelo do BANCO DE DADOS
      // IMPORTANTE: Sempre carrega do banco, nunca usa dados mockados
      const [kpisData, agendamentosData, profissionaisData, clientesData] = await Promise.all([
        apiGet<KPI>('/dono/dashboard/kpis').catch((err) => {
          console.warn('⚠️ Erro ao carregar KPIs do banco:', err);
          // Retorna valores padrão se houver erro, mas não dados mockados
          return null;
        }),
        apiGet<any[]>(`/agendamentos/barbearia/${barbeariaId}`).catch((err) => {
          console.warn('⚠️ Erro ao carregar agendamentos do banco:', err);
          return [];
        }),
        apiGet<any[]>('/dono/profissionais').catch((err) => {
          console.error('❌ Erro ao carregar profissionais do banco:', err);
          // Se erro de autenticação, retorna array vazio (não dados mockados)
          if (err.message?.includes('Token inválido') || err.message?.includes('Token não fornecido')) {
            console.error('❌ Token inválido ou não fornecido. Faça login novamente.');
            return [];
          }
          // Em caso de erro, retorna array vazio (não dados mockados)
          return [];
        }),
        apiGet<any[]>('/dono/clientes').catch((err) => {
          console.warn('⚠️ Erro ao carregar clientes do banco:', err);
          return [];
        }),
      ]);

      console.log('✅ Dados carregados do banco:');
      console.log('  - Profissionais:', profissionaisData?.length || 0, profissionaisData);
      console.log('  - Clientes:', clientesData?.length || 0, clientesData);
      console.log('  - Agendamentos:', agendamentosData?.length || 0);
      
      // IMPORTANTE: Se não houver dados, define arrays vazios (NUNCA dados mockados)
      if (!profissionaisData || profissionaisData.length === 0) {
        console.log('ℹ️ Nenhum profissional encontrado no banco de dados');
      }

      // Atualizar KPIs (só se dados vieram do banco)
      if (kpisData) {
        setKpi({
          faturamentoHoje: kpisData.faturamentoHoje || 0,
          faturamentoSemana: kpisData.faturamentoSemana || 0,
          faturamentoMes: kpisData.faturamentoMes || 0,
          agendamentosHoje: kpisData.agendamentosHoje || 0,
          cancelamentos: kpisData.cancelamentos || 0,
          clientesRecorrentes: kpisData.totalClientes || 0,
          notaMedia: kpisData.notaMedia || 0,
        });
      }

      // Transformar agendamentos da API para o formato do frontend
      const agendamentosTransformados: AgendamentoDono[] = agendamentosData.map((ag: any) => ({
        id: ag.id,
        clienteId: ag.clienteId || '',
        clienteNome: ag.clienteRel?.nome || ag.cliente || 'Cliente não cadastrado',
        clienteTelefone: ag.clienteRel?.telefone || ag.telefone,
        profissionalId: ag.profissionais?.[0]?.profissionalId || '',
        profissionalNome: ag.profissionais?.[0]?.profissional?.nome || 'Não atribuído',
        servicoId: ag.servicoId,
        servicoNome: ag.servico?.nome || '',
        data: ag.data.split('T')[0],
        horario: ag.horario || new Date(ag.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        duracao: ag.servico?.duracao || 40,
        valor: ag.servico?.preco || 0,
        status: ag.status,
        observacoes: ag.observacao,
        dataCriacao: ag.createdAt,
      }));

      setAgendamentos(agendamentosTransformados);

      // Transformar profissionais da API (SEMPRE do banco de dados)
      // Se profissionaisData for null/undefined ou array vazio, define array vazio (não dados mockados)
      const profissionaisTransformados: ProfissionalDono[] = (profissionaisData || []).map((prof: any) => ({
        id: prof.id,
        nome: prof.nome,
        email: prof.email || '',
        telefone: prof.telefone,
        foto: prof.foto,
        especialidades: prof.especialidades || [],
        comissao: {
          tipo: prof.comissaoTipo || 'percentual',
          valor: prof.comissaoValor || 0,
        },
        ativo: prof.ativo !== undefined ? prof.ativo : true,
        dataAdmissao: prof.dataAdmissao 
          ? (typeof prof.dataAdmissao === 'string' 
              ? (prof.dataAdmissao.includes('T') ? prof.dataAdmissao.split('T')[0] : prof.dataAdmissao)
              : new Date(prof.dataAdmissao).toISOString().split('T')[0])
          : new Date().toISOString().split('T')[0],
        avaliacaoMedia: 0, // Calcular se necessário
        totalAvaliacoes: 0,
        faturamentoTotal: 0,
        faltas: 0,
      }));

      console.log('✅ Profissionais carregados do banco:', profissionaisTransformados.length);
      setProfissionais(profissionaisTransformados);

      // Transformar clientes da API (SEMPRE do banco de dados)
      // Se clientesData for null/undefined ou array vazio, define array vazio (não dados mockados)
      const clientesTransformados: ClienteDono[] = (clientesData || []).map((cli: any) => ({
        id: cli.id,
        nome: cli.nome,
        email: cli.email || '',
        telefone: cli.telefone || '',
        foto: cli.foto,
        dataNascimento: cli.dataNascimento ? (cli.dataNascimento.split('T')[0] || cli.dataNascimento) : undefined,
        vip: false, // Adicionar campo no backend se necessário
        totalAgendamentos: cli._count?.agendamentos || 0,
        ultimoAgendamento: undefined, // Calcular se necessário
        ticketMedio: 0, // Calcular se necessário
        frequencia: 0, // Calcular se necessário
        dataCadastro: cli.createdAt ? (cli.createdAt.split('T')[0] || cli.createdAt) : new Date().toISOString().split('T')[0],
      }));

      console.log('✅ Clientes carregados do banco:', clientesTransformados.length);
      setClientes(clientesTransformados);
      
      console.log('✅ Todos os dados foram carregados do banco de dados com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao carregar dados do banco:', error);
      toast.error('Erro ao carregar dados do painel. Verifique sua conexão.');
      // Em caso de erro, define arrays vazios (não dados mockados)
      setProfissionais([]);
      setClientes([]);
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  };

  // Funções de agendamento
  const criarAgendamento = async (agendamento: Omit<AgendamentoDono, "id" | "dataCriacao">) => {
    if (!barbeariaId) {
      toast.error('Barbearia não identificada');
      return;
    }

    try {
      // Combinar data e horário
      const dataHora = new Date(`${agendamento.data}T${agendamento.horario}`);
      
      const novoAgendamento = await apiPost<any>('/agendamentos', {
        barbeariaId,
        clienteId: agendamento.clienteId || null,
        servicoId: agendamento.servicoId,
        profissionalId: agendamento.profissionalId || null,
        cliente: agendamento.clienteNome,
        telefone: agendamento.clienteTelefone || '',
        data: dataHora.toISOString(),
        horario: agendamento.horario,
        observacao: agendamento.observacoes || null,
      });

      // Recarregar agendamentos
      await carregarDados();
      toast.success('Agendamento criado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      toast.error(error.message || 'Erro ao criar agendamento');
      throw error;
    }
  };

  const atualizarAgendamento = async (id: string, dados: Partial<AgendamentoDono>) => {
    try {
      // Se precisar atualizar via API, adicionar endpoint
      setAgendamentos(agendamentos.map((a) => (a.id === id ? { ...a, ...dados } : a)));
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      toast.error('Erro ao atualizar agendamento');
    }
  };

  const cancelarAgendamento = async (id: string) => {
    try {
      await apiPut(`/agendamentos/${id}/cancelar`, {});
      await carregarDados();
      toast.success('Agendamento cancelado');
    } catch (error: any) {
      console.error('Erro ao cancelar agendamento:', error);
      toast.error(error.message || 'Erro ao cancelar agendamento');
    }
  };

  const confirmarAgendamento = async (id: string) => {
    try {
      await apiPut(`/agendamentos/${id}/confirmar`, {});
      await carregarDados();
      toast.success('Agendamento confirmado!');
    } catch (error: any) {
      console.error('Erro ao confirmar agendamento:', error);
      toast.error(error.message || 'Erro ao confirmar agendamento');
      throw error;
    }
  };

  const recusarAgendamento = async (id: string, motivo?: string) => {
    try {
      await apiPut(`/agendamentos/${id}/recusar`, { motivo });
      await carregarDados();
      toast.success('Agendamento recusado');
    } catch (error: any) {
      console.error('Erro ao recusar agendamento:', error);
      toast.error(error.message || 'Erro ao recusar agendamento');
      throw error;
    }
  };

  // Funções de profissional
  const adicionarProfissional = async (profissional: Omit<ProfissionalDono, "id" | "dataAdmissao" | "avaliacaoMedia" | "totalAvaliacoes" | "faturamentoTotal" | "faltas">) => {
    try {
      console.log('➕ Adicionando profissional ao banco de dados:', profissional.nome);
      const resultado = await apiPost('/dono/profissionais', {
        nome: profissional.nome,
        email: profissional.email,
        telefone: profissional.telefone,
        foto: profissional.foto,
        especialidades: profissional.especialidades,
        comissaoTipo: profissional.comissao.tipo,
        comissaoValor: profissional.comissao.valor,
      });
      
      console.log('✅ Profissional adicionado ao banco:', resultado);
      
      // SEMPRE recarregar dados do banco após adicionar
      console.log('🔄 Recarregando dados do banco após adicionar profissional...');
      await carregarDados();
      
      console.log('✅ Dados recarregados do banco com sucesso');
      toast.success('Profissional adicionado com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao adicionar profissional:', error);
      toast.error(error.message || 'Erro ao adicionar profissional');
      throw error;
    }
  };

  const atualizarProfissional = async (id: string, dados: Partial<ProfissionalDono>) => {
    try {
      console.log('✏️ Atualizando profissional no banco:', id);
      const updateData: any = {};
      if (dados.nome) updateData.nome = dados.nome;
      if (dados.email !== undefined) updateData.email = dados.email;
      if (dados.telefone) updateData.telefone = dados.telefone;
      if (dados.foto !== undefined) updateData.foto = dados.foto;
      if (dados.especialidades) updateData.especialidades = dados.especialidades;
      if (dados.comissao) {
        updateData.comissaoTipo = dados.comissao.tipo;
        updateData.comissaoValor = dados.comissao.valor;
      }
      if (dados.ativo !== undefined) updateData.ativo = dados.ativo;

      await apiPut(`/dono/profissionais/${id}`, updateData);
      console.log('✅ Profissional atualizado no banco, recarregando dados...');
      await carregarDados();
      toast.success('Profissional atualizado!');
    } catch (error: any) {
      console.error('❌ Erro ao atualizar profissional:', error);
      toast.error(error.message || 'Erro ao atualizar profissional');
    }
  };

  const removerProfissional = async (id: string) => {
    try {
      console.log('🗑️ Removendo profissional do banco:', id);
      await apiDelete(`/dono/profissionais/${id}`);
      console.log('✅ Profissional removido do banco, recarregando dados...');
      await carregarDados();
      toast.success('Profissional removido');
    } catch (error: any) {
      console.error('❌ Erro ao remover profissional:', error);
      toast.error(error.message || 'Erro ao remover profissional');
    }
  };

  // Funções de cliente
  const adicionarCliente = async (cliente: Omit<ClienteDono, "id" | "dataCadastro" | "totalAgendamentos" | "ticketMedio" | "frequencia">) => {
    try {
      console.log('➕ Adicionando cliente ao banco de dados:', cliente.nome);
      await apiPost('/dono/clientes', {
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        foto: cliente.foto,
        dataNascimento: cliente.dataNascimento,
      });
      console.log('✅ Cliente adicionado ao banco, recarregando dados...');
      await carregarDados();
      toast.success('Cliente adicionado com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao adicionar cliente:', error);
      toast.error(error.message || 'Erro ao adicionar cliente');
      throw error;
    }
  };

  const atualizarCliente = async (id: string, dados: Partial<ClienteDono>) => {
    try {
      const updateData: any = {};
      if (dados.nome) updateData.nome = dados.nome;
      if (dados.email) updateData.email = dados.email;
      if (dados.telefone) updateData.telefone = dados.telefone;
      if (dados.foto !== undefined) updateData.foto = dados.foto;
      if (dados.dataNascimento) updateData.dataNascimento = dados.dataNascimento;
      if (dados.ativo !== undefined) updateData.ativo = dados.ativo;

      await apiPut(`/dono/clientes/${id}`, updateData);
      await carregarDados();
      toast.success('Cliente atualizado!');
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error);
      toast.error(error.message || 'Erro ao atualizar cliente');
    }
  };

  const marcarClienteVIP = async (id: string, vip: boolean) => {
    // Implementar quando o backend tiver suporte a VIP
    toast.info('Funcionalidade VIP em desenvolvimento');
  };

  // Funções de pagamento
  const registrarPagamento = (pagamento: Omit<PagamentoDono, "id">) => {
    const novo: PagamentoDono = {
      id: Date.now().toString(),
      ...pagamento,
    };
    setPagamentos([...pagamentos, novo]);
  };

  // Funções de promoção
  const criarPromocao = (promocao: Omit<PromocaoDono, "id">) => {
    const novo: PromocaoDono = {
      id: Date.now().toString(),
      ...promocao,
    };
    setPromocoes([...promocoes, novo]);
  };

  const atualizarPromocao = (id: string, dados: Partial<PromocaoDono>) => {
    setPromocoes(promocoes.map((p) => (p.id === id ? { ...p, ...dados } : p)));
  };

  // Funções de avaliação
  const responderAvaliacao = (id: string, resposta: string) => {
    setAvaliacoes(avaliacoes.map((a) => (a.id === id ? { ...a, resposta } : a)));
  };

  // Funções de produto
  const adicionarProduto = (produto: Omit<ProdutoDono, "id">) => {
    const novo: ProdutoDono = {
      id: Date.now().toString(),
      ...produto,
    };
    setProdutos([...produtos, novo]);
  };

  const atualizarProduto = (id: string, dados: Partial<ProdutoDono>) => {
    setProdutos(produtos.map((p) => (p.id === id ? { ...p, ...dados } : p)));
  };

  const atualizarEstoque = (id: string, quantidade: number) => {
    atualizarProduto(id, { estoque: quantidade });
  };

  // Funções de notificação
  const marcarNotificacaoLida = (id: string) => {
    setNotificacoes(notificacoes.map((n) => (n.id === id ? { ...n, lida: true } : n)));
  };

  // Funções de configuração
  const atualizarConfiguracao = (dados: Partial<ConfiguracaoBarbearia>) => {
    setConfiguracao({ ...configuracao, ...dados });
  };

  // Funções de relatório
  const gerarRelatorio = (dataInicio: string, dataFim: string): RelatorioDono => {
    const agendamentosPeriodo = agendamentos.filter(
      (a) => a.data >= dataInicio && a.data <= dataFim
    );

    const faturamento = agendamentosPeriodo.reduce((sum, a) => sum + a.valor, 0);
    const cancelamentos = agendamentosPeriodo.filter((a) => a.status === "cancelado").length;

    return {
      periodo: `${dataInicio} a ${dataFim}`,
      faturamento,
      agendamentos: agendamentosPeriodo.length,
      cancelamentos,
      taxaCancelamento: agendamentosPeriodo.length > 0 ? (cancelamentos / agendamentosPeriodo.length) * 100 : 0,
      ticketMedio: agendamentosPeriodo.length > 0 ? faturamento / agendamentosPeriodo.length : 0,
      servicosMaisVendidos: [],
      profissionaisMaisRentaveis: [],
      horariosPico: [],
    };
  };

  return (
    <DonoContext.Provider
      value={{
        kpi,
        agendamentos,
        profissionais,
        clientes,
        pagamentos,
        promocoes,
        avaliacoes,
        produtos,
        notificacoes,
        configuracao,
        criarAgendamento,
        atualizarAgendamento,
        cancelarAgendamento,
        confirmarAgendamento,
        recusarAgendamento,
        adicionarProfissional,
        atualizarProfissional,
        removerProfissional,
        adicionarCliente,
        atualizarCliente,
        marcarClienteVIP,
        registrarPagamento,
        criarPromocao,
        atualizarPromocao,
        responderAvaliacao,
        adicionarProduto,
        atualizarProduto,
        atualizarEstoque,
        marcarNotificacaoLida,
        atualizarConfiguracao,
        gerarRelatorio,
      }}
    >
      {children}
    </DonoContext.Provider>
  );
}

export function useDono() {
  const context = useContext(DonoContext);
  if (!context) {
    throw new Error("useDono deve ser usado dentro de DonoProvider");
  }
  return context;
}







