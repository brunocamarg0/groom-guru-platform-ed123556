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

// Função para decodificar JWT e obter dados do token
function obterDadosDoToken(): { id: string; email: string; tipo: string; barbeariaId?: string } | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    // Decodificar JWT (sem verificar assinatura, apenas para obter dados)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    return null;
  }
}

// Função para obter barbeariaId do token ou localStorage
function obterBarbeariaIdDoToken(): string | null {
  // O token não contém barbeariaId diretamente, precisa buscar do localStorage
  // que foi salvo durante o login
  try {
    const barbeariaStr = localStorage.getItem('barbearia');
    if (barbeariaStr) {
      const barbearia = JSON.parse(barbeariaStr);
      return barbearia.id || null;
    }
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.barbeariaId || null;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao obter barbeariaId:', error);
    return null;
  }
}

interface DonoContextType {
  // Estado
  loading: boolean;
  barbeariaId: string | null;

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
  registrarPagamentoManual: (agendamentoId: string, valor: number, metodo: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito', observacao?: string) => Promise<void>;
  
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

// Função helper para extrair data do agendamento corretamente
// Como o backend salva datas em noon UTC (T12:00:00.000Z), usamos UTC para extrair a data
// Isso garante consistência independente do fuso horário do cliente
const converterDataParaBrasilia = (dataUTC: string | Date): string => {
  try {
    const data = typeof dataUTC === 'string' ? new Date(dataUTC) : dataUTC;
    
    // Se a data foi salva como T12:00:00.000Z (noon UTC), a data UTC é a correta
    // Usar métodos UTC para extrair ano, mês e dia
    const ano = data.getUTCFullYear();
    const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(data.getUTCDate()).padStart(2, '0');
    
    // Retornar no formato YYYY-MM-DD
    return `${ano}-${mes}-${dia}`;
  } catch (error) {
    console.error('Erro ao converter data:', error);
    // Fallback: extrair apenas a parte da data se houver erro
    if (typeof dataUTC === 'string' && dataUTC.includes('T')) {
      return dataUTC.split('T')[0];
    }
    const data = typeof dataUTC === 'string' ? new Date(dataUTC) : dataUTC;
    return data.toISOString().split('T')[0];
  }
};

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
  // Obter barbeariaId do localStorage (salvo durante o login)
  // O token JWT não contém barbeariaId, apenas id, email e tipo
  const getBarbeariaIdFromStorage = (): string | null => {
    try {
      console.log('🔍 [DONO CONTEXT] Buscando barbeariaId no localStorage...');
      
      // Primeiro tenta obter do objeto barbearia salvo no login
      const barbeariaStr = localStorage.getItem('barbearia');
      if (barbeariaStr) {
        const barbearia = JSON.parse(barbeariaStr);
        console.log('✅ [DONO CONTEXT] barbeariaId encontrado em localStorage.barbearia:', barbearia.id);
        return barbearia.id || null;
      }
      
      // Fallback: tenta obter do objeto user
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.barbeariaId) {
          console.log('✅ [DONO CONTEXT] barbeariaId encontrado em localStorage.user:', user.barbeariaId);
          return user.barbeariaId;
        }
      }
      
      console.warn('⚠️ [DONO CONTEXT] barbeariaId não encontrado no localStorage');
      console.warn('   localStorage.barbearia:', localStorage.getItem('barbearia'));
      console.warn('   localStorage.user:', localStorage.getItem('user'));
      console.warn('   localStorage.token:', localStorage.getItem('token') ? 'Presente' : 'Ausente');
      return null;
    } catch (error) {
      console.error('❌ [DONO CONTEXT] Erro ao obter barbeariaId do localStorage:', error);
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

  // Verificar se há token antes de fazer requisições
  // Usar useState para garantir que seja recalculado quando o token mudar
  const [hasToken, setHasToken] = useState(() => 
    typeof window !== 'undefined' && !!localStorage.getItem('token')
  );
  
  // Atualizar hasToken quando o token mudar
  useEffect(() => {
    const checkToken = () => {
      const tokenPresent = typeof window !== 'undefined' && !!localStorage.getItem('token');
      if (tokenPresent !== hasToken) {
        console.log('🔄 [DONO CONTEXT] Token mudou, atualizando hasToken:', tokenPresent);
        setHasToken(tokenPresent);
      }
    };
    
    // Verificar imediatamente
    checkToken();
    
    // Verificar periodicamente (a cada 1 segundo) para pegar mudanças no localStorage
    const interval = setInterval(checkToken, 1000);
    
    // Listener para mudanças no localStorage (pode não funcionar em todas as abas)
    window.addEventListener('storage', checkToken);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkToken);
    };
  }, [hasToken]);
  
  // Log para debug - FORÇAR LOG VISÍVEL
  useEffect(() => {
    const tokenPresent = typeof window !== 'undefined' && !!localStorage.getItem('token');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 [DONO CONTEXT] Estado atual:');
    console.log('   barbeariaId:', barbeariaId);
    console.log('   hasToken (state):', hasToken);
    console.log('   token presente (localStorage):', tokenPresent);
    console.log('   userType:', localStorage.getItem('userType'));
    console.log('   Query habilitada (profissionais):', !!barbeariaId && hasToken);
    console.log('   Query habilitada (clientes):', !!barbeariaId && hasToken);
    console.log('   Query habilitada (serviços):', !!barbeariaId && hasToken);
    console.log('   Query habilitada (produtos):', !!barbeariaId && hasToken);
    console.log('   Query habilitada (pagamentos):', !!barbeariaId && hasToken);
    console.log('═══════════════════════════════════════════════════════════');
    
    // Se hasToken está false mas o token está presente, forçar atualização
    if (!hasToken && tokenPresent) {
      console.warn('⚠️ [DONO CONTEXT] hasToken está false mas token está presente! Forçando atualização...');
      setHasToken(true);
    }
  }, [barbeariaId, hasToken]);
  
  // Hook para buscar KPIs
  const { data: kpisData, isLoading: loadingKpi, error: errorKpi } = useQuery({
    queryKey: ['kpis', barbeariaId],
    queryFn: () => {
      console.log('📊 [QUERY] Buscando KPIs para barbeariaId:', barbeariaId);
      return apiGet<any>('/dono/dashboard/kpis');
    },
    enabled: !!barbeariaId && hasToken, // Só fazer requisição se tiver token
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
    retry: (failureCount, error: any) => {
      // Não tentar novamente se for erro 401 (token inválido)
      if (error?.status === 401 || error?.message?.includes('401')) {
        console.error('❌ [QUERY KPIs] Erro 401, não tentando novamente');
        return false;
      }
      return failureCount < 2; // Tentar no máximo 2 vezes
    },
  });
  
  // Log de erros nas queries
  useEffect(() => {
    if (errorKpi) {
      console.error('❌ [QUERY KPIs] Erro ao buscar KPIs:', errorKpi);
    }
    if (kpisData) {
      console.log('✅ [QUERY KPIs] KPIs carregados:', kpisData);
    }
  }, [kpisData, errorKpi]);

  // Hook para buscar Professionais
  const queryEnabledProfs = !!barbeariaId && hasToken;
  const { data: qProfissionais, isLoading: loadingProfs, error: errorProfs } = useQuery({
    queryKey: ['profissionais', barbeariaId],
    queryFn: () => {
      console.log('👥 [QUERY] Buscando profissionais para barbeariaId:', barbeariaId);
      return apiGet<any[]>('/dono/profissionais');
    },
    enabled: queryEnabledProfs,
    staleTime: 1000 * 60 * 10,
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.message?.includes('401')) {
        console.error('❌ [QUERY PROFISSIONAIS] Erro 401, não tentando novamente');
        return false;
      }
      return failureCount < 2;
    },
  });
  
  // Log quando a query é habilitada/desabilitada
  useEffect(() => {
    console.log('🔧 [QUERY PROFISSIONAIS] Estado:', {
      enabled: queryEnabledProfs,
      barbeariaId: !!barbeariaId,
      hasToken,
      isLoading: loadingProfs,
      hasData: !!qProfissionais,
      hasError: !!errorProfs,
    });
  }, [queryEnabledProfs, loadingProfs, qProfissionais, errorProfs, barbeariaId, hasToken]);
  
  useEffect(() => {
    if (errorProfs) {
      console.error('❌ [QUERY PROFISSIONAIS] Erro ao buscar profissionais:', errorProfs);
    }
    if (qProfissionais) {
      console.log('✅ [QUERY PROFISSIONAIS] Profissionais carregados:', qProfissionais.length);
    }
  }, [qProfissionais, errorProfs]);

  // Hook para buscar Clientes
  const queryEnabledClientes = !!barbeariaId && hasToken;
  const { data: qClientes, isLoading: loadingClis, error: errorClientes } = useQuery({
    queryKey: ['clientes', barbeariaId],
    queryFn: () => {
      console.log('👤 [QUERY] Buscando clientes para barbeariaId:', barbeariaId);
      return apiGet<any[]>('/dono/clientes');
    },
    enabled: queryEnabledClientes,
    staleTime: 1000 * 60 * 10,
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.message?.includes('401')) {
        console.error('❌ [QUERY CLIENTES] Erro 401, não tentando novamente');
        return false;
      }
      return failureCount < 2;
    },
  });
  
  // Log quando a query é habilitada/desabilitada
  useEffect(() => {
    console.log('🔧 [QUERY CLIENTES] Estado:', {
      enabled: queryEnabledClientes,
      barbeariaId: !!barbeariaId,
      hasToken,
      isLoading: loadingClis,
      hasData: !!qClientes,
      hasError: !!errorClientes,
    });
  }, [queryEnabledClientes, loadingClis, qClientes, errorClientes, barbeariaId, hasToken]);
  
  useEffect(() => {
    if (errorClientes) {
      console.error('❌ [QUERY CLIENTES] Erro ao buscar clientes:', errorClientes);
    }
    if (qClientes) {
      console.log('✅ [QUERY CLIENTES] Clientes carregados:', qClientes.length);
    }
  }, [qClientes, errorClientes]);

  // Hook para buscar Agendamentos
  const { data: qAgendamentos, isLoading: loadingAgends } = useQuery({
    queryKey: ['agendamentos', barbeariaId],
    queryFn: () => apiGet<any[]>(`/agendamentos/barbearia/${barbeariaId}`),
    enabled: !!barbeariaId && hasToken,
    staleTime: 1000 * 60 * 2, // Agendamentos expiram mais rápido
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.message?.includes('401')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Hook para buscar Serviços
  const queryEnabledServicos = !!barbeariaId && hasToken;
  const { data: qServicos, isLoading: loadingSrvs, error: errorServicos } = useQuery({
    queryKey: ['servicos', barbeariaId],
    queryFn: () => {
      console.log('✂️ [QUERY] Buscando serviços para barbeariaId:', barbeariaId);
      return apiGet<any[]>('/dono/servicos');
    },
    enabled: queryEnabledServicos,
    staleTime: 1000 * 60 * 30,
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.message?.includes('401')) {
        console.error('❌ [QUERY SERVIÇOS] Erro 401, não tentando novamente');
        return false;
      }
      return failureCount < 2;
    },
  });
  
  // Log quando a query é habilitada/desabilitada
  useEffect(() => {
    console.log('🔧 [QUERY SERVIÇOS] Estado:', {
      enabled: queryEnabledServicos,
      barbeariaId: !!barbeariaId,
      hasToken,
      isLoading: loadingSrvs,
      hasData: !!qServicos,
      hasError: !!errorServicos,
    });
  }, [queryEnabledServicos, loadingSrvs, qServicos, errorServicos, barbeariaId, hasToken]);
  
  useEffect(() => {
    if (errorServicos) {
      console.error('❌ [QUERY SERVIÇOS] Erro ao buscar serviços:', errorServicos);
    }
    if (qServicos) {
      console.log('✅ [QUERY SERVIÇOS] Serviços carregados:', qServicos.length);
    }
  }, [qServicos, errorServicos]);

  // Hook para buscar Produtos
  const queryEnabledProdutos = !!barbeariaId && hasToken;
  const { data: qProdutos, error: errorProdutos, isLoading: loadingProdutos } = useQuery({
    queryKey: ['produtos', barbeariaId],
    queryFn: () => {
      console.log('📦 [QUERY] Buscando produtos para barbeariaId:', barbeariaId);
      return apiGet<any[]>('/dono/produtos');
    },
    enabled: queryEnabledProdutos,
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.message?.includes('401')) {
        console.error('❌ [QUERY PRODUTOS] Erro 401, não tentando novamente');
        return false;
      }
      return failureCount < 2;
    },
  });
  
  // Log quando a query é habilitada/desabilitada
  useEffect(() => {
    console.log('🔧 [QUERY PRODUTOS] Estado:', {
      enabled: queryEnabledProdutos,
      barbeariaId: !!barbeariaId,
      hasToken,
      isLoading: loadingProdutos,
      hasData: !!qProdutos,
      hasError: !!errorProdutos,
    });
  }, [queryEnabledProdutos, loadingProdutos, qProdutos, errorProdutos, barbeariaId, hasToken]);
  
  useEffect(() => {
    if (errorProdutos) {
      console.error('❌ [QUERY PRODUTOS] Erro ao buscar produtos:', errorProdutos);
    }
    if (qProdutos) {
      console.log('✅ [QUERY PRODUTOS] Produtos carregados:', qProdutos.length);
    }
  }, [qProdutos, errorProdutos]);

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

  // Hook para buscar Pagamentos
  const queryEnabledPagamentos = !!barbeariaId && hasToken;
  const { data: qPagamentos, isLoading: loadingPags, error: errorPagamentos } = useQuery({
    queryKey: ['pagamentos', barbeariaId],
    queryFn: () => {
      console.log('💰 [QUERY] Buscando pagamentos para barbeariaId:', barbeariaId);
      return apiGet<any[]>('/dono/financeiro/pagamentos');
    },
    enabled: queryEnabledPagamentos,
    staleTime: 1000 * 30, // 30 segundos de cache (atualiza mais frequentemente)
    refetchInterval: 1000 * 30, // Refetch a cada 30 segundos quando na página
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.message?.includes('401')) {
        console.error('❌ [QUERY PAGAMENTOS] Erro 401, não tentando novamente');
        return false;
      }
      return failureCount < 2;
    },
  });
  
  // Log quando a query é habilitada/desabilitada
  useEffect(() => {
    console.log('🔧 [QUERY PAGAMENTOS] Estado:', {
      enabled: queryEnabledPagamentos,
      barbeariaId: !!barbeariaId,
      hasToken,
      isLoading: loadingPags,
      hasData: !!qPagamentos,
      hasError: !!errorPagamentos,
    });
  }, [queryEnabledPagamentos, loadingPags, qPagamentos, errorPagamentos, barbeariaId, hasToken]);

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
      console.log('🔄 [SYNC] Sincronizando profissionais:', qProfissionais.length);
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
      console.log('✅ [SYNC] Profissionais sincronizados:', transformados.length);
    } else {
      console.log('⚠️ [SYNC] qProfissionais está undefined/null');
    }
  }, [qProfissionais]);

  useEffect(() => {
    if (qClientes) {
      console.log('🔄 [SYNC] Sincronizando clientes:', qClientes.length);
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
      console.log('✅ [SYNC] Clientes sincronizados:', transformados.length);
    } else {
      console.log('⚠️ [SYNC] qClientes está undefined/null');
    }
  }, [qClientes]);

  useEffect(() => {
    if (qAgendamentos) {
      const transformados = qAgendamentos.map((ag: any) => {
        // Converter data para timezone de Brasília corretamente
        const dataFormatada = converterDataParaBrasilia(ag.data);
        
        // Para o horário, usar o horário salvo ou extrair do campo data
        let horarioFormatado = ag.horario;
        if (!horarioFormatado && ag.data) {
          // Extrair horário no timezone de Brasília
          const dataObj = typeof ag.data === 'string' ? new Date(ag.data) : ag.data;
          const formatterHora = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
          horarioFormatado = formatterHora.format(dataObj);
        }
        
        return {
          id: ag.id,
          clienteId: ag.clienteId || '',
          clienteNome: ag.clienteRel?.nome || ag.cliente || 'Cliente não cadastrado',
          clienteTelefone: ag.clienteRel?.telefone || ag.telefone,
          profissionalId: ag.profissionais?.[0]?.profissionalId || '',
          profissionalNome: ag.profissionais?.[0]?.profissional?.nome || 'Não atribuído',
          servicoId: ag.servicoId,
          servicoNome: ag.servico?.nome || '',
          data: dataFormatada,
          horario: horarioFormatado || '00:00',
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
    if (qServicos) {
      console.log('🔄 [SYNC] Sincronizando serviços:', qServicos.length);
      setServicos(qServicos);
      console.log('✅ [SYNC] Serviços sincronizados:', qServicos.length);
    } else {
      console.log('⚠️ [SYNC] qServicos está undefined/null');
    }
  }, [qServicos]);

  useEffect(() => {
    if (qProdutos) {
      console.log('🔄 [SYNC] Sincronizando produtos:', qProdutos.length);
      setProdutos(qProdutos);
      console.log('✅ [SYNC] Produtos sincronizados:', qProdutos.length);
    } else {
      console.log('⚠️ [SYNC] qProdutos está undefined/null');
    }
  }, [qProdutos]);

  useEffect(() => {
    if (qPromocoes) setPromocoes(qPromocoes);
  }, [qPromocoes]);

  useEffect(() => {
    if (qNotificacoes) setNotificacoes(qNotificacoes);
  }, [qNotificacoes]);

  useEffect(() => {
    if (qConfiguracao) {
      // Garantir que sempre temos uma configuração completa mesclando com a inicial
      setConfiguracao({
        ...configuracaoInicial,
        ...qConfiguracao,
        horarioFuncionamento: {
          ...configuracaoInicial.horarioFuncionamento,
          ...(qConfiguracao.horarioFuncionamento || {}),
        },
        politicaCancelamento: {
          ...configuracaoInicial.politicaCancelamento,
          ...(qConfiguracao.politicaCancelamento || {}),
        },
      });
    }
  }, [qConfiguracao]);

  useEffect(() => {
    if (qPagamentos) {
      const transformados: PagamentoDono[] = qPagamentos.map((pag: any) => ({
        id: pag.id,
        agendamentoId: pag.agendamentoId,
        valor: pag.valor,
        metodo: pag.metodo as 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro',
        status: pag.status as 'pago' | 'pendente' | 'reembolsado',
        taxaGateway: pag.taxaGateway || 0,
        dataPagamento: pag.dataPagamento 
          ? (typeof pag.dataPagamento === 'string' 
              ? pag.dataPagamento 
              : new Date(pag.dataPagamento).toISOString())
          : undefined,
        dataVencimento: pag.dataVencimento 
          ? (typeof pag.dataVencimento === 'string'
              ? pag.dataVencimento
              : new Date(pag.dataVencimento).toISOString())
          : undefined,
      }));
      setPagamentos(transformados);
    } else if (qPagamentos === null || qPagamentos === undefined) {
      // Se não houver pagamentos, definir array vazio
      setPagamentos([]);
    }
  }, [qPagamentos]);

  // Manter loading global sincronizado com queries principais
  useEffect(() => {
    setLoading(loadingProfs || loadingClis || loadingAgends || loadingSrvs || loadingKpi || loadingPags);
  }, [loadingProfs, loadingClis, loadingAgends, loadingSrvs, loadingKpi, loadingPags]);

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

    // Verificar periodicamente (fallback) - reduzido para 5 segundos para evitar sobrecarga
    const interval = setInterval(checkBarbeariaId, 5000);

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

  // Não verificar token periodicamente - isso pode causar redirecionamentos prematuros
  // O DonoLayout já faz a verificação inicial

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
      const agendamentosTransformados: AgendamentoDono[] = agendamentosData.map((ag: any) => {
        // Converter data para timezone de Brasília corretamente
        const dataFormatada = converterDataParaBrasilia(ag.data);
        
        // Para o horário, usar o horário salvo ou extrair do campo data
        let horarioFormatado = ag.horario;
        if (!horarioFormatado && ag.data) {
          // Extrair horário no timezone de Brasília
          const dataObj = typeof ag.data === 'string' ? new Date(ag.data) : ag.data;
          const formatterHora = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
          horarioFormatado = formatterHora.format(dataObj);
        }
        
        return {
          id: ag.id,
          clienteId: ag.clienteId || '',
          clienteNome: ag.clienteRel?.nome || ag.cliente || 'Cliente não cadastrado',
          clienteTelefone: ag.clienteRel?.telefone || ag.telefone,
          profissionalId: ag.profissionais?.[0]?.profissionalId || '',
          profissionalNome: ag.profissionais?.[0]?.profissional?.nome || 'Não atribuído',
          servicoId: ag.servicoId,
          servicoNome: ag.servico?.nome || '',
          data: dataFormatada,
          horario: horarioFormatado || '00:00',
          duracao: ag.servico?.duracao || 40,
          valor: ag.servico?.preco || 0,
          status: ag.status,
          observacoes: ag.observacao,
          dataCriacao: ag.createdAt,
        };
      });

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
        // Converter data para timezone de Brasília corretamente
        const dataFormatada = converterDataParaBrasilia(novoAgendamento.agendamento.data);
        
        // Para o horário, usar o horário salvo ou extrair do campo data
        let horarioFormatado = novoAgendamento.agendamento.horario;
        if (!horarioFormatado && novoAgendamento.agendamento.data) {
          // Extrair horário no timezone de Brasília
          const dataObj = typeof novoAgendamento.agendamento.data === 'string' 
            ? new Date(novoAgendamento.agendamento.data) 
            : novoAgendamento.agendamento.data;
          const formatterHora = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
          horarioFormatado = formatterHora.format(dataObj);
        }
        
        const agendamentoTransformado: AgendamentoDono = {
          id: novoAgendamento.agendamento.id,
          clienteId: novoAgendamento.agendamento.clienteId || '',
          clienteNome: novoAgendamento.agendamento.clienteRel?.nome || novoAgendamento.agendamento.cliente || 'Cliente não cadastrado',
          clienteTelefone: novoAgendamento.agendamento.clienteRel?.telefone || novoAgendamento.agendamento.telefone,
          profissionalId: novoAgendamento.agendamento.profissionais?.[0]?.profissionalId || '',
          profissionalNome: novoAgendamento.agendamento.profissionais?.[0]?.profissional?.nome || 'Não atribuído',
          servicoId: novoAgendamento.agendamento.servicoId,
          servicoNome: novoAgendamento.agendamento.servico?.nome || '',
          data: dataFormatada,
          horario: horarioFormatado || '00:00',
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
        const agendamentosTransformados: AgendamentoDono[] = agendamentosData.map((ag: any) => {
          // Converter data para timezone de Brasília corretamente
          const dataFormatada = converterDataParaBrasilia(ag.data);
          
          // Para o horário, usar o horário salvo ou extrair do campo data
          let horarioFormatado = ag.horario;
          if (!horarioFormatado && ag.data) {
            // Extrair horário no timezone de Brasília
            const dataObj = typeof ag.data === 'string' ? new Date(ag.data) : ag.data;
            const formatterHora = new Intl.DateTimeFormat('pt-BR', {
              timeZone: 'America/Sao_Paulo',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            });
            horarioFormatado = formatterHora.format(dataObj);
          }
          
          return {
            id: ag.id,
            clienteId: ag.clienteId || '',
            clienteNome: ag.clienteRel?.nome || ag.cliente || 'Cliente não cadastrado',
            clienteTelefone: ag.clienteRel?.telefone || ag.telefone,
            profissionalId: ag.profissionais?.[0]?.profissionalId || '',
            profissionalNome: ag.profissionais?.[0]?.profissional?.nome || 'Não atribuído',
            servicoId: ag.servicoId,
            servicoNome: ag.servico?.nome || '',
            data: dataFormatada,
            horario: horarioFormatado || '00:00',
            duracao: ag.servico?.duracao || 40,
            valor: ag.servico?.preco || 0,
            status: ag.status,
            observacoes: ag.observacao,
            dataCriacao: ag.createdAt,
          };
        });
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

  // Registrar pagamento manual/presencial
  const registrarPagamentoManual = async (
    agendamentoId: string, 
    valor: number, 
    metodo: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito',
    observacao?: string
  ): Promise<void> => {
    try {
      if (!barbeariaId) {
        toast.error('Barbearia não identificada');
        throw new Error('Barbearia não identificada');
      }

      console.log('💰 Registrando pagamento manual:', { agendamentoId, valor, metodo });

      const response = await apiPost<any>('/dono/financeiro/pagamentos/manual', {
        agendamentoId,
        valor,
        metodo,
        observacao,
      });

      if (response.success && response.pagamento) {
        // Adicionar pagamento imediatamente ao estado (otimista)
        const novoPagamento: PagamentoDono = {
          id: response.pagamento.id,
          agendamentoId: response.pagamento.agendamentoId,
          valor: response.pagamento.valor,
          metodo: response.pagamento.metodo,
          status: response.pagamento.status || 'pago',
          taxaGateway: response.pagamento.taxaGateway || 0,
          dataPagamento: response.pagamento.dataPagamento 
            ? (typeof response.pagamento.dataPagamento === 'string' 
                ? response.pagamento.dataPagamento 
                : new Date(response.pagamento.dataPagamento).toISOString())
            : new Date().toISOString(),
          dataVencimento: response.pagamento.dataVencimento 
            ? (typeof response.pagamento.dataVencimento === 'string'
                ? response.pagamento.dataVencimento
                : new Date(response.pagamento.dataVencimento).toISOString())
            : undefined,
        };
        
        // Adicionar ao início da lista para aparecer imediatamente
        setPagamentos(prev => {
          // Verificar se já existe para evitar duplicatas
          const existe = prev.find(p => p.id === novoPagamento.id);
          if (existe) return prev;
          return [novoPagamento, ...prev];
        });
        
        // Invalidar queries para garantir sincronização completa
        queryClient.invalidateQueries({ queryKey: ['agendamentos', barbeariaId] });
        queryClient.invalidateQueries({ queryKey: ['pagamentos', barbeariaId] });
        queryClient.invalidateQueries({ queryKey: ['kpis', barbeariaId] });
        
        // Forçar refetch imediato da query de pagamentos
        queryClient.refetchQueries({ queryKey: ['pagamentos', barbeariaId] });
        
        toast.success('Pagamento registrado com sucesso!');
      } else {
        throw new Error(response.error || 'Erro ao registrar pagamento');
      }
    } catch (error: any) {
      console.error('❌ Erro ao registrar pagamento manual:', error);
      toast.error(error.message || 'Erro ao registrar pagamento');
      throw error;
    }
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
      console.log('💾 [CONFIG] Atualizando configuração:', { 
        campos: Object.keys(dados),
        temFoto: !!dados.foto,
        tamanhoFoto: dados.foto ? dados.foto.length : 0
      });

      // Se há foto, verificar tamanho antes de enviar
      if (dados.foto && dados.foto.length > 2000000) { // 2MB em base64
        throw new Error('Foto muito grande. Por favor, use uma imagem menor.');
      }

      // Verificar token antes de fazer requisição
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado. Faça login novamente.');
      }
      
      console.log('💾 [CONFIG] Enviando requisição PUT para /dono/configuracao');
      console.log('💾 [CONFIG] Token presente:', !!token);
      
      const response = await apiPut('/dono/configuracao', dados);
      console.log('✅ [CONFIG] Configuração atualizada com sucesso');
      
      queryClient.invalidateQueries({ queryKey: ['configuracao'] });
      queryClient.invalidateQueries({ queryKey: [barbeariaId] });

      // Atualizar no Firestore (opcional, não crítico)
      if (barbeariaId) {
        firestoreUtils.setBarbeariaConfig(barbeariaId, dados).catch(err =>
          console.warn('⚠️ Erro ao atualizar configuração no Firestore (não crítico):', err)
        );
      }
      
      toast.success('Configurações atualizadas com sucesso!');
      return response;
    } catch (error: any) {
      console.error('❌ [CONFIG] Erro ao atualizar config:', error);
      console.error('❌ [CONFIG] Detalhes do erro:', {
        message: error?.message,
        status: error?.status,
        endpoint: error?.endpoint,
        stack: error?.stack
      });
      
      // Se for erro 401, mensagem mais específica
      if (error?.status === 401) {
        const errorMessage = error?.message || 'Token inválido ou expirado. Faça login novamente.';
        toast.error(errorMessage);
        throw error;
      }
      
      const errorMessage = error?.message || error?.error || 'Erro ao salvar configurações';
      toast.error(errorMessage);
      throw error; // Re-lançar para que o componente possa tratar
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
        barbeariaId,
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
        registrarPagamentoManual,
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







