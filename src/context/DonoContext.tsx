import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
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
  RelatorioDono
} from "@/types/dono";
import { apiGet, apiPost, apiPut, apiDelete } from "@/services/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as firestoreUtils from "@/lib/firestoreUtils";

// Função para decodificar JWT e obter barbeariaId
function obterBarbeariaIdDoToken(): string | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    // Decodificar JWT (sem verificar assinatura, apenas para obter dados)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.barbeariaId || null;
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    return null;
  }
}

interface DonoContextType {
  // Estado
  loading: boolean;

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
  removerCliente: (id: string) => Promise<void>;
  marcarClienteVIP: (id: string, vip: boolean) => void;

  // Funções de serviços
  servicos: any[];
  adicionarServico: (servico: { nome: string; descricao?: string; preco: number; duracao: number; tipo?: string; ordem?: number; ativo?: boolean }) => Promise<void>;
  atualizarServico: (id: string, dados: Partial<{ nome: string; descricao?: string; preco: number; duracao: number; tipo?: string; ordem?: number; ativo?: boolean }>) => Promise<void>;
  removerServico: (id: string) => Promise<void>;
  toggleServicoAtivo: (id: string) => Promise<void>;

  registrarPagamento: (pagamento: Omit<PagamentoDono, "id">) => Promise<void>;

  criarPromocao: (promocao: Omit<PromocaoDono, "id">) => Promise<void>;
  atualizarPromocao: (id: string, dados: Partial<PromocaoDono>) => Promise<void>;

  responderAvaliacao: (id: string, resposta: string) => Promise<void>;

  adicionarProduto: (produto: Omit<ProdutoDono, "id">) => Promise<void>;
  atualizarProduto: (id: string, dados: Partial<ProdutoDono>) => Promise<void>;
  atualizarEstoque: (id: string, quantidade: number) => Promise<void>;

  marcarNotificacaoLida: (id: string) => Promise<void>;

  atualizarConfiguracao: (dados: Partial<ConfiguracaoBarbearia>) => void;

  gerarRelatorio: (dataInicio: string, dataFim: string) => RelatorioDono;
}

const DonoContext = createContext<DonoContextType | undefined>(undefined);

// Dados iniciais (serão substituídos pelos dados reais do banco)
const kpiInicial: KPI = {
  faturamentoHoje: 0,
  faturamentoSemana: 0,
  faturamentoMes: 0,
  agendamentosHoje: 0,
  cancelamentos: 0,
  clientesRecorrentes: 0,
  notaMedia: 0,
  totalAvaliacoes: 0,
  variacaoHoje: 0,
  variacaoSemana: 0,
  variacaoMes: 0,
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
  linkAgendamento: "https://barbermaster.com/agendar/joao",
  paginaPublica: true,
};

export function DonoProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  // Obter barbeariaId do token JWT (prioridade) ou localStorage (fallback)
  const getBarbeariaIdFromStorage = (): string | null => {
    // Primeiro tenta obter do token JWT
    const tokenId = obterBarbeariaIdDoToken();
    if (tokenId) return tokenId;

    // Fallback: tenta obter do localStorage
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
  const [servicos, setServicos] = useState<any[]>([]);
  const [pagamentos, setPagamentos] = useState<PagamentoDono[]>([]);
  const [promocoes, setPromocoes] = useState<PromocaoDono[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoDono[]>([]);
  const [produtos, setProdutos] = useState<ProdutoDono[]>([]);
  const [notificacoes, setNotificacoes] = useState<NotificacaoDono[]>([]);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoBarbearia>(configuracaoInicial);
  const [loading, setLoading] = useState(false); // Mudado para false por padrão, React Query cuida do loading
  const [ultimoCarregamento, setUltimoCarregamento] = useState<number>(0);
  const [migracaoConcluida, setMigracaoConcluida] = useState<boolean>(false);

  const queryClient = useQueryClient();

  // --- CONFIGURAÇÃO DO REACT QUERY PARA NEON ---

  // Hook para buscar KPIs
  const { data: kpisData, isLoading: loadingKpi } = useQuery({
    queryKey: ['kpis', barbeariaId],
    queryFn: () => apiGet<any>('/dono/dashboard/kpis'),
    enabled: !!barbeariaId,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  // Hook para buscar Professionais
  const { data: qProfissionais, isLoading: loadingProfs } = useQuery({
    queryKey: ['profissionais', barbeariaId],
    queryFn: () => apiGet<any[]>('/dono/profissionais'),
    enabled: !!barbeariaId,
    staleTime: 1000 * 60 * 10,
  });

  // Hook para buscar Clientes
  const { data: qClientes, isLoading: loadingClis } = useQuery({
    queryKey: ['clientes', barbeariaId],
    queryFn: () => apiGet<any[]>('/dono/clientes'),
    enabled: !!barbeariaId,
    staleTime: 1000 * 60 * 10,
  });

  // Hook para buscar Agendamentos
  const { data: qAgendamentos, isLoading: loadingAgends } = useQuery({
    queryKey: ['agendamentos', barbeariaId],
    queryFn: () => apiGet<any[]>(`/agendamentos/barbearia/${barbeariaId}`),
    enabled: !!barbeariaId,
    staleTime: 1000 * 60 * 2, // Agendamentos expiram mais rápido
  });

  // Hook para buscar Serviços
  const { data: qServicos, isLoading: loadingSrvs } = useQuery({
    queryKey: ['servicos', barbeariaId],
    queryFn: () => apiGet<any[]>('/dono/servicos'),
    enabled: !!barbeariaId,
    staleTime: 1000 * 60 * 30,
  });

  // Hook para buscar Produtos
  const { data: qProdutos } = useQuery({
    queryKey: ['produtos', barbeariaId],
    queryFn: () => apiGet<any[]>('/dono/produtos'),
    enabled: !!barbeariaId,
  });

  // Hook para buscar Promoções
  const { data: qPromocoes } = useQuery({
    queryKey: ['promocoes', barbeariaId],
    queryFn: () => apiGet<any[]>('/dono/promocoes'),
    enabled: !!barbeariaId,
  });

  // Hook para buscar Notificações
  const { data: qNotificacoes } = useQuery({
    queryKey: ['notificacoes', barbeariaId],
    queryFn: () => apiGet<any[]>('/dono/notificacoes'),
    enabled: !!barbeariaId,
  });

  // Hook para buscar Avaliações
  const { data: qAvaliacoes } = useQuery({
    queryKey: ['avaliacoes', barbeariaId],
    queryFn: () => apiGet<any[]>('/dono/avaliacoes'),
    enabled: !!barbeariaId,
  });

  // Hook para buscar Configuração
  const { data: qConfiguracao } = useQuery({
    queryKey: ['configuracao', barbeariaId],
    queryFn: () => apiGet<any>('/dono/configuracao'),
    enabled: !!barbeariaId,
  });

  // --- SINCRONIZAÇÃO DOS DADOS DO REACT QUERY COM O ESTADO DO CONTEXTO ---

  useEffect(() => {
    if (kpisData) {
      setKpi({
        faturamentoHoje: kpisData.faturamentoHoje || 0,
        faturamentoSemana: kpisData.faturamentoSemana || 0,
        faturamentoMes: kpisData.faturamentoMes || 0,
        agendamentosHoje: kpisData.agendamentosHoje || 0,
        cancelamentos: kpisData.cancelamentos || 0,
        clientesRecorrentes: kpisData.clientesRecorrentes || kpisData.totalClientes || 0,
        notaMedia: kpisData.notaMedia || 0,
        totalAvaliacoes: kpisData.totalAvaliacoes || 0,
        variacaoHoje: kpisData.variacaoHoje || 0,
        variacaoSemana: kpisData.variacaoSemana || 0,
        variacaoMes: kpisData.variacaoMes || 0,
      });
    }
  }, [kpisData]);

  useEffect(() => {
    if (qProfissionais) {
      const transformados = qProfissionais.map((prof: any) => ({
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
        dataAdmissao: prof.dataAdmissao?.split('T')[0] || new Date().toISOString().split('T')[0],
        avaliacaoMedia: 0,
        totalAvaliacoes: 0,
        faturamentoTotal: 0,
        faltas: 0,
      }));
      setProfissionais(transformados);
    }
  }, [qProfissionais]);

  useEffect(() => {
    if (qClientes) {
      const transformados = qClientes.map((cli: any) => ({
        id: cli.id,
        nome: cli.nome,
        email: cli.email || '',
        telefone: cli.telefone || '',
        foto: cli.foto,
        dataNascimento: cli.dataNascimento?.split('T')[0],
        vip: false,
        totalAgendamentos: cli._count?.agendamentos || 0,
        ultimoAgendamento: cli.ultimoAgendamento,
        ticketMedio: cli.ticketMedio || 0,
        frequencia: cli.frequencia || 0,
        dataCadastro: cli.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
      }));
      setClientes(transformados);
    }
  }, [qClientes]);

  useEffect(() => {
    if (qAgendamentos) {
      const transformados = qAgendamentos.map((ag: any) => {
        const dataBrasilia = new Date(new Date(ag.data).toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        return {
          id: ag.id,
          clienteId: ag.clienteId || '',
          clienteNome: ag.clienteRel?.nome || ag.cliente || 'Cliente não cadastrado',
          clienteTelefone: ag.clienteRel?.telefone || ag.telefone,
          profissionalId: ag.profissionais?.[0]?.profissionalId || '',
          profissionalNome: ag.profissionais?.[0]?.profissional?.nome || 'Não atribuído',
          servicoId: ag.servicoId,
          servicoNome: ag.servico?.nome || '',
          data: dataBrasilia.toISOString().split('T')[0],
          horario: ag.horario || dataBrasilia.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          duracao: ag.servico?.duracao || 40,
          valor: ag.servico?.preco || 0,
          status: ag.status,
          observacoes: ag.observacao,
          dataCriacao: ag.createdAt,
        };
      });
      setAgendamentos(transformados);
    }
  }, [qAgendamentos]);

  useEffect(() => {
    if (qServicos) setServicos(qServicos);
  }, [qServicos]);

  useEffect(() => {
    if (qProdutos) setProdutos(qProdutos);
  }, [qProdutos]);

  useEffect(() => {
    if (qPromocoes) setPromocoes(qPromocoes);
  }, [qPromocoes]);

  useEffect(() => {
    if (qNotificacoes) setNotificacoes(qNotificacoes);
  }, [qNotificacoes]);

  useEffect(() => {
    if (qConfiguracao) setConfiguracao(qConfiguracao);
  }, [qConfiguracao]);

  // Manter loading global sincronizado com queries principais
  useEffect(() => {
    setLoading(loadingProfs || loadingClis || loadingAgends || loadingSrvs || loadingKpi);
  }, [loadingProfs, loadingClis, loadingAgends, loadingSrvs, loadingKpi]);

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

  // Auto-refresh dos dados a cada 10 segundos para reduzir delay
  useEffect(() => {
    if (!barbeariaId) return;

    const refreshInterval = setInterval(() => {
      // Só recarrega se não estiver carregando e se a página estiver visível
      if (!loading && document.visibilityState === 'visible') {
        console.log('🔄 [AUTO-REFRESH] Atualizando dados do painel...');
        queryClient.invalidateQueries({ queryKey: [barbeariaId] });
      }
    }, 10000); // 10 segundos

    return () => clearInterval(refreshInterval);
  }, [barbeariaId, loading]);

  // ÚNICO Listener para carregar dados iniciais
  useEffect(() => {
    const currentPath = window.location.pathname;
    const isDonoRoute = currentPath.startsWith('/dono');

    if (isDonoRoute) {
      if (barbeariaId) {
        console.log('🔄 [RE-VALIDATE] Validando dados para barbeariaId:', barbeariaId);
        // Invalida o cache para garantir que os dados estejam frescos
        queryClient.invalidateQueries({ queryKey: [barbeariaId] });
      } else {
        const recId = getBarbeariaIdFromStorage();
        if (recId) {
          setBarbeariaId(recId);
        }
      }
    }
  }, [barbeariaId, window.location.pathname]);

  // Função leve para recarregar apenas agendamentos (usada no polling)
  const recarregarAgendamentos = useCallback(async () => {
    if (!barbeariaId) return;

    try {
      const agendamentosData = await apiGet<any[]>(`/agendamentos/barbearia/${barbeariaId}`).catch((err) => {
        console.warn('⚠️ Erro ao recarregar agendamentos:', err);
        return null;
      });

      if (!agendamentosData) return;

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

      // Só atualizar se houver diferença (evitar re-renders desnecessários)
      setAgendamentos(prev => {
        // Comparar por IDs e quantidade
        const prevIds = new Set(prev.map(a => a.id));
        const newIds = new Set(agendamentosTransformados.map(a => a.id));
        
        // Se quantidade ou IDs forem diferentes, atualizar
        if (prev.length !== agendamentosTransformados.length || 
            ![...newIds].every(id => prevIds.has(id)) ||
            ![...prevIds].every(id => newIds.has(id))) {
          console.log('🔄 [POLLING] Novos agendamentos detectados! Atualizando...');
          return agendamentosTransformados;
        }
        
        return prev;
      });
    } catch (error) {
      console.error('❌ Erro ao recarregar agendamentos:', error);
    }
  }, [barbeariaId]);

  // Polling automático para atualizar agendamentos em tempo real
  // Verifica novos agendamentos a cada 10 segundos quando estiver na página do dono
  useEffect(() => {
    if (!barbeariaId) return;

    const checkAndUpdate = () => {
      const currentPath = window.location.pathname;
      const isDonoRoute = currentPath.startsWith('/dono');
      
      // Só fazer polling se estiver na página do dono e a página estiver visível
      if (isDonoRoute && !document.hidden) {
        recarregarAgendamentos();
      }
    };

    // Verificar imediatamente ao montar
    checkAndUpdate();

    // Configurar polling a cada 10 segundos
    const pollingInterval = setInterval(checkAndUpdate, 10000);

    // Também verificar quando a página voltar a ficar visível
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAndUpdate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(pollingInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [barbeariaId, recarregarAgendamentos]);

  const carregarDados = async (forcar: boolean = false) => {
    // Agora carregarDados apenas dispara a invalidação do React Query
    if (barbeariaId) {
      queryClient.invalidateQueries({ queryKey: [barbeariaId] });
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

      // Adicionar novo agendamento à lista local (otimização: não recarregar todos os dados)
      if (novoAgendamento.agendamento) {
        const agendamentoTransformado: AgendamentoDono = {
          id: novoAgendamento.agendamento.id,
          clienteId: novoAgendamento.agendamento.clienteId || '',
          clienteNome: novoAgendamento.agendamento.clienteRel?.nome || novoAgendamento.agendamento.cliente || 'Cliente não cadastrado',
          clienteTelefone: novoAgendamento.agendamento.clienteRel?.telefone || novoAgendamento.agendamento.telefone,
          profissionalId: novoAgendamento.agendamento.profissionais?.[0]?.profissionalId || '',
          profissionalNome: novoAgendamento.agendamento.profissionais?.[0]?.profissional?.nome || 'Não atribuído',
          servicoId: novoAgendamento.agendamento.servicoId,
          servicoNome: novoAgendamento.agendamento.servico?.nome || '',
          data: novoAgendamento.agendamento.data.split('T')[0],
          horario: novoAgendamento.agendamento.horario || new Date(novoAgendamento.agendamento.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          duracao: novoAgendamento.agendamento.servico?.duracao || 40,
          valor: novoAgendamento.agendamento.servico?.preco || 0,
          status: novoAgendamento.agendamento.status,
          observacoes: novoAgendamento.agendamento.observacao,
          dataCriacao: novoAgendamento.agendamento.createdAt,
        };

        setAgendamentos(prev => [...prev, agendamentoTransformado]);

        // Salvar no Firestore para atualização em tempo real
        if (barbeariaId) {
          firestoreUtils.addAgendamento(barbeariaId, agendamentoTransformado).catch(err =>
            console.error('❌ Erro ao salvar agendamento no Firestore:', err)
          );
        }
      } else {
        // Fallback: recarregar apenas agendamentos se formato não for o esperado
        const agendamentosData = await apiGet<any[]>(`/agendamentos/barbearia/${barbeariaId}`).catch(() => []);
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
      }

      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      toast.success('Agendamento criado com sucesso');
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      toast.error(error.message || 'Erro ao criar agendamento');
      throw error;
    }
  };

  const atualizarAgendamento = async (id: string, dados: Partial<AgendamentoDono>) => {
    try {
      await apiPut(`/agendamentos/${id}`, dados);
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      toast.success('Agendamento atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      toast.error('Erro ao atualizar agendamento');
    }
  };

  const cancelarAgendamento = async (id: string) => {
    try {
      await apiPut(`/agendamentos/${id}/cancelar`, {});
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });

      // Atualizar no Firestore
      if (barbeariaId) {
        firestoreUtils.updateAgendamento(barbeariaId, id, { status: 'cancelado' }).catch(err =>
          console.error('❌ Erro ao cancelar agendamento no Firestore:', err)
        );
      }

      toast.success('Agendamento cancelado');
    } catch (error: any) {
      console.error('Erro ao cancelar agendamento:', error);
      toast.error(error.message || 'Erro ao cancelar agendamento');
    }
  };

  const confirmarAgendamento = async (id: string) => {
    try {
      await apiPut(`/agendamentos/${id}/confirmar`, {});
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });

      // Atualizar no Firestore
      if (barbeariaId) {
        firestoreUtils.updateAgendamento(barbeariaId, id, { status: 'confirmado' }).catch(err =>
          console.error('❌ Erro ao confirmar agendamento no Firestore:', err)
        );
      }

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
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
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
      const novoProfissional = await apiPost<ProfissionalDono>('/dono/profissionais', {
        nome: profissional.nome,
        email: profissional.email,
        telefone: profissional.telefone,
        foto: profissional.foto,
        especialidades: profissional.especialidades,
        comissaoTipo: profissional.comissao.tipo,
        comissaoValor: profissional.comissao.valor,
      });

      console.log('✅ Profissional adicionado:', novoProfissional);

      queryClient.invalidateQueries({ queryKey: ['profissionais'] });
      toast.success('Profissional adicionado com sucesso');
      if (barbeariaId) {
        firestoreUtils.addProfissional(barbeariaId, novoProfissional).catch(err =>
          console.error('❌ Erro ao salvar profissional no Firestore:', err)
        );
      }

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
      queryClient.invalidateQueries({ queryKey: ['profissionais'] });

      // Atualizar no Firestore
      if (barbeariaId) {
        firestoreUtils.updateProfissional(barbeariaId, id, updateData).catch(err =>
          console.error('❌ Erro ao atualizar profissional no Firestore:', err)
        );
      }

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
      queryClient.invalidateQueries({ queryKey: ['profissionais'] });

      // Remover do Firestore
      if (barbeariaId) {
        firestoreUtils.deleteProfissional(barbeariaId, id).catch(err =>
          console.error('❌ Erro ao remover profissional no Firestore:', err)
        );
      }

      toast.success('Profissional removido');
    } catch (error: any) {
      console.error('❌ Erro ao remover profissional:', error);
      toast.error(error.message || 'Erro ao remover profissional');
    }
  };

  // Funções de cliente
  const adicionarCliente = async (cliente: Omit<ClienteDono, "id" | "dataCadastro" | "totalAgendamentos" | "ticketMedio" | "frequencia">) => {
    try {
      console.log('➕ [ADICIONAR CLIENTE] Iniciando...');
      const resultado = await apiPost<any>('/dono/clientes', {
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        foto: cliente.foto,
        dataNascimento: cliente.dataNascimento,
      });

      console.log('✅ [ADICIONAR CLIENTE] Cliente adicionado ao banco:', resultado);

      if (resultado && resultado.id) {
        const novoCliente: ClienteDono = {
          id: resultado.id,
          nome: resultado.nome || cliente.nome,
          email: resultado.email || cliente.email || '',
          telefone: resultado.telefone || cliente.telefone || '',
          foto: resultado.foto || cliente.foto,
          dataNascimento: resultado.dataNascimento ? (typeof resultado.dataNascimento === 'string' ? resultado.dataNascimento.split('T')[0] : new Date(resultado.dataNascimento).toISOString().split('T')[0]) : cliente.dataNascimento,
          vip: false,
          totalAgendamentos: 0,
          ticketMedio: 0,
          frequencia: 0,
          dataCadastro: resultado.createdAt ? (typeof resultado.createdAt === 'string' ? resultado.createdAt.split('T')[0] : new Date(resultado.createdAt).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
        };

        queryClient.invalidateQueries({ queryKey: ['clientes'] });

        // Salvar no Firestore
        if (barbeariaId) {
          firestoreUtils.addCliente(barbeariaId, novoCliente).catch(err =>
            console.error('❌ Erro ao salvar cliente no Firestore:', err)
          );
        }

        console.log('✅ [ADICIONAR CLIENTE] Cliente adicionado à lista local');
      }

      toast.success('Cliente adicionado com sucesso!');
    } catch (error: any) {
      console.error('❌ [ADICIONAR CLIENTE] Erro:', error);
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
      // ativo não está no tipo ClienteDono, mas pode ser usado no backend
      if ((dados as any).ativo !== undefined) updateData.ativo = (dados as any).ativo;

      await apiPut(`/dono/clientes/${id}`, updateData);
      queryClient.invalidateQueries({ queryKey: ['clientes'] });

      // Atualizar no Firestore
      if (barbeariaId) {
        firestoreUtils.updateCliente(barbeariaId, id, updateData).catch(err =>
          console.error('❌ Erro ao atualizar cliente no Firestore:', err)
        );
      }

      toast.success('Cliente atualizado!');
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error);
      toast.error(error.message || 'Erro ao atualizar cliente');
    }
  };

  const removerCliente = async (id: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://groom-guru-platform-production.up.railway.app/api';
      console.log('🗑️ [REMOVER CLIENTE] Iniciando exclusão do cliente:', id);
      console.log('🗑️ [REMOVER CLIENTE] Endpoint:', `/dono/clientes/${id}`);
      console.log('🗑️ [REMOVER CLIENTE] URL completa:', `${API_URL}/dono/clientes/${id}`);
      console.log('🗑️ [REMOVER CLIENTE] Token:', localStorage.getItem('token') ? 'Presente' : 'Ausente');
      console.log('🗑️ [REMOVER CLIENTE] BarbeariaId:', barbeariaId);
      console.log('🗑️ [REMOVER CLIENTE] API_URL:', API_URL);

      const resultado = await apiDelete(`/dono/clientes/${id}`);
      console.log('✅ [REMOVER CLIENTE] Cliente removido com sucesso:', resultado);

      queryClient.invalidateQueries({ queryKey: ['clientes'] });

      // Remover do Firestore
      if (barbeariaId) {
        firestoreUtils.deleteCliente(barbeariaId, id).catch(err =>
          console.error('❌ Erro ao remover cliente no Firestore:', err)
        );
      }

      toast.success('Cliente removido com sucesso!');
    } catch (error: any) {
      console.error('❌ [REMOVER CLIENTE] Erro completo:', error);
      console.error('❌ [REMOVER CLIENTE] Mensagem:', error.message);
      console.error('❌ [REMOVER CLIENTE] Status:', error.status);
      console.error('❌ [REMOVER CLIENTE] URL:', error.url);
      console.error('❌ [REMOVER CLIENTE] Stack:', error.stack);

      // Mensagens de erro mais específicas
      let mensagemErro = 'Erro ao remover cliente';
      if (error.status === 404 || error.message?.includes('404') || error.message?.includes('Rota não encontrada')) {
        mensagemErro = 'Rota não encontrada. Verifique se o backend está rodando e se a rota está correta.';
        console.error('❌ [REMOVER CLIENTE] Erro 404 - Rota não encontrada');
        console.error('❌ [REMOVER CLIENTE] Verifique se o backend está rodando e se a rota DELETE /api/dono/clientes/:id está registrada');
      } else if (error.message?.includes('não encontrado')) {
        mensagemErro = 'Cliente não encontrado ou não pertence a esta barbearia';
      } else if (error.message) {
        mensagemErro = error.message;
      }

      toast.error(mensagemErro);
      throw error;
    }
  };

  const marcarClienteVIP = async (id: string, vip: boolean) => {
    // Implementar quando o backend tiver suporte a VIP
    toast.info('Funcionalidade VIP em desenvolvimento');
  };

  // Funções de serviços
  const adicionarServico = async (servico: { nome: string; descricao?: string; preco: number; duracao: number; tipo?: string; ordem?: number; ativo?: boolean }) => {
    try {
      console.log('➕ Adicionando serviço ao banco de dados:', servico.nome);
      const novoServico = await apiPost('/dono/servicos', servico);

      console.log('✅ Serviço adicionado:', novoServico);

      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      toast.success('Serviço adicionado com sucesso');
      if (barbeariaId) {
        firestoreUtils.addServico(barbeariaId, novoServico).catch(err =>
          console.error('❌ Erro ao salvar serviço no Firestore:', err)
        );
      }

    } catch (error: any) {
      console.error('❌ Erro ao adicionar serviço:', error);
      toast.error(error.message || 'Erro ao adicionar serviço');
      throw error;
    }
  };

  const atualizarServico = async (id: string, dados: Partial<{ nome: string; descricao?: string; preco: number; duracao: number; tipo?: string; ordem?: number; ativo?: boolean }>) => {
    try {
      console.log('✏️ Atualizando serviço no banco:', id);
      await apiPut(`/dono/servicos/${id}`, dados);
      console.log('✅ Serviço atualizado no banco, recarregando dados...');
      await carregarDados(true);

      // Atualizar no Firestore
      if (barbeariaId) {
        firestoreUtils.updateServico(barbeariaId, id, dados).catch(err =>
          console.error('❌ Erro ao atualizar serviço no Firestore:', err)
        );
      }

      toast.success('Serviço atualizado!');
    } catch (error: any) {
      console.error('❌ Erro ao atualizar serviço:', error);
      toast.error(error.message || 'Erro ao atualizar serviço');
    }
  };

  const removerServico = async (id: string) => {
    try {
      console.log('🗑️ Removendo serviço do banco:', id);
      await apiDelete(`/dono/servicos/${id}`);
      console.log('✅ Serviço removido do banco, recarregando dados...');
      await carregarDados(true);

      // Remover do Firestore
      if (barbeariaId) {
        firestoreUtils.deleteServico(barbeariaId, id).catch(err =>
          console.error('❌ Erro ao remover serviço no Firestore:', err)
        );
      }

      toast.success('Serviço removido');
    } catch (error: any) {
      console.error('❌ Erro ao remover serviço:', error);
      toast.error(error.message || 'Erro ao remover serviço');
    }
  };

  const toggleServicoAtivo = async (id: string) => {
    try {
      console.log('🔄 Alternando status do serviço:', id);
      await apiPut(`/dono/servicos/${id}/toggle`, {});
      console.log('✅ Status do serviço alterado, recarregando dados...');
      await carregarDados(true);

      // Atualizar no Firestore (precisa saber o novo status, mas o toggle do backend não retorna)
      // O hook do Firestore vai pegar a mudança se o backend atualizar o Firestore, 
      // mas aqui estamos fazendo do frontend para garantir.
      const servico = servicos.find(s => s.id === id);
      if (barbeariaId && servico) {
        firestoreUtils.updateServico(barbeariaId, id, { ativo: !servico.ativo }).catch(err =>
          console.error('❌ Erro ao alterar status do serviço no Firestore:', err)
        );
      }

      toast.success('Status do serviço alterado');
    } catch (error: any) {
      console.error('❌ Erro ao alterar status do serviço:', error);
      toast.error(error.message || 'Erro ao alterar status do serviço');
    }
  };

  // Funções de pagamento
  const registrarPagamento = async (pagamento: Omit<PagamentoDono, "id">): Promise<void> => {
    // Pagamentos são criados automaticamente quando um agendamento é confirmado/concluído
    // Esta função pode ser usada para criar pagamentos manuais se necessário
    console.log('💰 Registrando pagamento:', pagamento);
    queryClient.invalidateQueries({ queryKey: [barbeariaId] });
  };

  // Funções de promoção
  const criarPromocao = async (promocao: Omit<PromocaoDono, "id">) => {
    try {
      console.log('🎁 Criando promoção no banco de dados:', promocao.nome);
      await apiPost('/dono/promocoes', promocao);
      queryClient.invalidateQueries({ queryKey: ['promocoes'] });

      // Salvar no Firestore
      if (barbeariaId) {
        firestoreUtils.addPromocao(barbeariaId, promocao).catch(err =>
          console.error('❌ Erro ao salvar promoção no Firestore:', err)
        );
      }

      toast.success('Promoção criada com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao criar promoção:', error);
      toast.error(error.message || 'Erro ao criar promoção');
      throw error;
    }
  };

  const atualizarPromocao = async (id: string, dados: Partial<PromocaoDono>) => {
    try {
      console.log('✏️ Atualizando promoção no banco:', id);
      await apiPut(`/dono/promocoes/${id}`, dados);
      queryClient.invalidateQueries({ queryKey: ['promocoes'] });

      // Atualizar no Firestore
      if (barbeariaId) {
        firestoreUtils.updatePromocao(barbeariaId, id, dados).catch(err =>
          console.error('❌ Erro ao atualizar promoção no Firestore:', err)
        );
      }

      toast.success('Promoção atualizada!');
    } catch (error: any) {
      console.error('❌ Erro ao atualizar promoção:', error);
      toast.error(error.message || 'Erro ao atualizar promoção');
    }
  };

  // Funções de avaliação
  const responderAvaliacao = async (id: string, resposta: string) => {
    try {
      console.log('⭐ Respondendo avaliação no banco:', id);
      await apiPut(`/dono/avaliacoes/${id}/responder`, { resposta });
      queryClient.invalidateQueries({ queryKey: ['avaliacoes'] });
      toast.success('Avaliação respondida!');
    } catch (error: any) {
      console.error('❌ Erro ao responder avaliação:', error);
      toast.error(error.message || 'Erro ao responder avaliação');
    }
  };

  // Funções de produto
  const adicionarProduto = async (produto: Omit<ProdutoDono, "id">) => {
    try {
      console.log('📦 Adicionando produto ao banco de dados:', produto.nome);
      const novoProduto = await apiPost<ProdutoDono>('/dono/produtos', produto);

      console.log('✅ Produto adicionado com sucesso:', novoProduto);

      // Atualizar estado localmente sem recarregar tudo
      queryClient.invalidateQueries({ queryKey: ['produtos'] });

      // Salvar no Firestore
      if (barbeariaId) {
        firestoreUtils.addProduto(barbeariaId, novoProduto).catch(err =>
          console.error('❌ Erro ao salvar produto no Firestore:', err)
        );
      }

      toast.success('Produto adicionado com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao adicionar produto:', error);
      toast.error(error.message || 'Erro ao adicionar produto');
      throw error;
    }
  };

  const atualizarProduto = async (id: string, dados: Partial<ProdutoDono>) => {
    try {
      console.log('✏️ Atualizando produto no banco:', id);
      await apiPut(`/dono/produtos/${id}`, dados);
      queryClient.invalidateQueries({ queryKey: ['produtos'] });

      // Atualizar no Firestore
      if (barbeariaId) {
        firestoreUtils.updateProduto(barbeariaId, id, dados).catch(err =>
          console.error('❌ Erro ao atualizar produto no Firestore:', err)
        );
      }

      toast.success('Produto atualizado!');
    } catch (error: any) {
      console.error('❌ Erro ao atualizar produto:', error);
      toast.error(error.message || 'Erro ao atualizar produto');
    }
  };

  const atualizarEstoque = async (id: string, quantidade: number) => {
    try {
      console.log('📊 Atualizando estoque no banco:', id, quantidade);
      await apiPut(`/dono/produtos/${id}/estoque`, { quantidade });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });

      // Atualizar no Firestore
      if (barbeariaId) {
        firestoreUtils.updateProduto(barbeariaId, id, { estoque: quantidade }).catch(err =>
          console.error('❌ Erro ao atualizar estoque no Firestore:', err)
        );
      }

      toast.success('Estoque atualizado!');
    } catch (error: any) {
      console.error('❌ Erro ao atualizar estoque:', error);
      toast.error(error.message || 'Erro ao atualizar estoque');
    }
  };

  // Funções de notificação
  const marcarNotificacaoLida = async (id: string) => {
    try {
      console.log('🔔 Marcando notificação como lida no banco:', id);
      await apiPut(`/dono/notificacoes/${id}/lida`, {});
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
    } catch (error: any) {
      console.error('❌ Erro ao marcar notificação como lida:', error);
    }
  };

  // Funções de configuração
  const atualizarConfiguracao = async (dados: Partial<ConfiguracaoBarbearia>) => {
    try {
      await apiPut('/dono/configuracao', dados);
      queryClient.invalidateQueries({ queryKey: ['configuracao'] });

      // Atualizar no Firestore
      if (barbeariaId) {
        firestoreUtils.setBarbeariaConfig(barbeariaId, dados).catch(err =>
          console.error('❌ Erro ao atualizar configuração no Firestore:', err)
        );
      }
      toast.success('Configurações atualizadas');
    } catch (error: any) {
      console.error('Erro ao atualizar config:', error);
      toast.error('Erro ao salvar configurações');
    }
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
        loading,
        kpi,
        agendamentos,
        profissionais,
        clientes,
        servicos,
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
        removerCliente,
        marcarClienteVIP,
        adicionarServico,
        atualizarServico,
        removerServico,
        toggleServicoAtivo,
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







