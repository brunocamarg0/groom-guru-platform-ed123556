import { createContext, useContext, useState, ReactNode } from "react";
import { Barbearia, NovaBarbearia, StatusBarbearia, ServicoBarbearia, NovoServicoBarbearia } from "@/types/barbearia";

interface BarbeariasContextType {
  barbearias: Barbearia[];
  adicionarBarbearia: (barbearia: NovaBarbearia) => void;
  editarBarbearia: (id: string, dados: Partial<Barbearia>) => void;
  alterarStatus: (id: string, status: StatusBarbearia) => void;
  suspenderPorInadimplencia: (id: string) => void;
  getBarbearia: (id: string) => Barbearia | undefined;
  adicionarServico: (barbeariaId: string, servico: NovoServicoBarbearia) => void;
  editarServico: (barbeariaId: string, servicoId: string, dados: Partial<ServicoBarbearia>) => void;
  removerServico: (barbeariaId: string, servicoId: string) => void;
  toggleServicoAtivo: (barbeariaId: string, servicoId: string) => void;
}

const BarbeariasContext = createContext<BarbeariasContextType | undefined>(undefined);

// Serviços padrão que toda barbearia pode ter
const servicosPadrao: ServicoBarbearia[] = [
  { id: "s1", tipo: "corte", nome: "Corte Masculino", duracao: 30, valor: 25, ativo: true, ordem: 1 },
  { id: "s2", tipo: "barba", nome: "Barba", duracao: 20, valor: 15, ativo: true, ordem: 2 },
  { id: "s3", tipo: "combo", nome: "Corte + Barba", duracao: 60, valor: 45, ativo: true, ordem: 3 },
];

// Dados mockados iniciais
const barbeariasIniciais: Barbearia[] = [
  {
    id: "1",
    nome: "Barbearia do João",
    cnpjCpf: "12.345.678/0001-90",
    responsavel: "João Silva",
    plano: "premium",
    status: "ativa",
    dataCriacao: "2024-01-15",
    dataVencimento: "2024-12-15",
    gatewayPagamento: {
      nome: "Stripe",
      conectado: true,
      dataConexao: "2024-01-15",
    },
    servicos: [
      ...servicosPadrao,
      { id: "s4", tipo: "hidratacao", nome: "Hidratação Capilar", duracao: 45, valor: 35, ativo: true, ordem: 4 },
      { id: "s5", tipo: "alisamento", nome: "Alisamento", duracao: 120, valor: 150, ativo: true, ordem: 5 },
      { id: "s6", tipo: "progressiva", nome: "Progressiva", duracao: 180, valor: 200, ativo: false, ordem: 6 },
    ],
    email: "joao@barbearia.com",
    telefone: "(11) 99999-9999",
  },
  {
    id: "2",
    nome: "Corte & Estilo",
    cnpjCpf: "98.765.432/0001-10",
    responsavel: "Maria Santos",
    plano: "basico",
    status: "em_teste",
    dataCriacao: "2024-02-20",
    dataVencimento: "2024-03-20",
    gatewayPagamento: {
      nome: "Mercado Pago",
      conectado: false,
    },
    servicos: [...servicosPadrao],
    email: "maria@corteestilo.com",
  },
  {
    id: "3",
    nome: "Barber Shop Premium",
    cnpjCpf: "11.222.333/0001-44",
    responsavel: "Carlos Oliveira",
    plano: "enterprise",
    status: "bloqueada",
    dataCriacao: "2023-11-10",
    dataVencimento: "2024-11-10",
    gatewayPagamento: {
      nome: "Asaas",
      conectado: true,
      dataConexao: "2023-11-10",
    },
    servicos: [
      ...servicosPadrao,
      { id: "s7", tipo: "luzes", nome: "Luzes", duracao: 90, valor: 120, ativo: true, ordem: 4 },
      { id: "s8", tipo: "coloring", nome: "Coloração", duracao: 120, valor: 100, ativo: true, ordem: 5 },
    ],
  },
];

export function BarbeariasProvider({ children }: { children: ReactNode }) {
  const [barbearias, setBarbearias] = useState<Barbearia[]>(barbeariasIniciais);

  const adicionarBarbearia = (novaBarbearia: NovaBarbearia) => {
    const barbearia: Barbearia = {
      id: Date.now().toString(),
      ...novaBarbearia,
      status: "em_teste",
      dataCriacao: new Date().toISOString().split("T")[0],
      dataVencimento: calcularVencimento(novaBarbearia.plano),
      gatewayPagamento: {
        nome: "",
        conectado: false,
      },
      servicos: [...servicosPadrao], // Inicia com serviços padrão
    };
    setBarbearias([...barbearias, barbearia]);
  };

  const editarBarbearia = (id: string, dados: Partial<Barbearia>) => {
    setBarbearias(
      barbearias.map((b) => (b.id === id ? { ...b, ...dados } : b))
    );
  };

  const alterarStatus = (id: string, status: StatusBarbearia) => {
    setBarbearias(
      barbearias.map((b) => (b.id === id ? { ...b, status } : b))
    );
  };

  const suspenderPorInadimplencia = (id: string) => {
    setBarbearias(
      barbearias.map((b) => (b.id === id ? { ...b, status: "bloqueada" } : b))
    );
  };

  const getBarbearia = (id: string) => {
    return barbearias.find((b) => b.id === id);
  };

  const adicionarServico = (barbeariaId: string, servico: NovoServicoBarbearia) => {
    const novoServico: ServicoBarbearia = {
      id: Date.now().toString(),
      ...servico,
    };
    setBarbearias(
      barbearias.map((b) =>
        b.id === barbeariaId
          ? { ...b, servicos: [...(b.servicos || []), novoServico] }
          : b
      )
    );
  };

  const editarServico = (barbeariaId: string, servicoId: string, dados: Partial<ServicoBarbearia>) => {
    setBarbearias(
      barbearias.map((b) =>
        b.id === barbeariaId
          ? {
              ...b,
              servicos: (b.servicos || []).map((s) =>
                s.id === servicoId ? { ...s, ...dados } : s
              ),
            }
          : b
      )
    );
  };

  const removerServico = (barbeariaId: string, servicoId: string) => {
    setBarbearias(
      barbearias.map((b) =>
        b.id === barbeariaId
          ? { ...b, servicos: (b.servicos || []).filter((s) => s.id !== servicoId) }
          : b
      )
    );
  };

  const toggleServicoAtivo = (barbeariaId: string, servicoId: string) => {
    setBarbearias(
      barbearias.map((b) =>
        b.id === barbeariaId
          ? {
              ...b,
              servicos: (b.servicos || []).map((s) =>
                s.id === servicoId ? { ...s, ativo: !s.ativo } : s
              ),
            }
          : b
      )
    );
  };

  return (
    <BarbeariasContext.Provider
      value={{
        barbearias,
        adicionarBarbearia,
        editarBarbearia,
        alterarStatus,
        suspenderPorInadimplencia,
        getBarbearia,
        adicionarServico,
        editarServico,
        removerServico,
        toggleServicoAtivo,
      }}
    >
      {children}
    </BarbeariasContext.Provider>
  );
}

export function useBarbearias() {
  const context = useContext(BarbeariasContext);
  if (!context) {
    throw new Error("useBarbearias deve ser usado dentro de BarbeariasProvider");
  }
  return context;
}

function calcularVencimento(plano: string): string {
  const hoje = new Date();
  const vencimento = new Date(hoje);
  
  if (plano === "basico") {
    vencimento.setMonth(vencimento.getMonth() + 1);
  } else if (plano === "premium") {
    vencimento.setMonth(vencimento.getMonth() + 3);
  } else {
    vencimento.setFullYear(vencimento.getFullYear() + 1);
  }
  
  return vencimento.toISOString().split("T")[0];
}

