import { createContext, useContext, useState, ReactNode } from "react";
import { Plano, NovoPlano, Assinatura, NovaAssinatura, TrocaPlano, StatusAssinatura, Pagamento } from "@/types/plano";
import { useBarbearias } from "./BarbeariasContext";

interface PlanosContextType {
  planos: Plano[];
  assinaturas: Assinatura[];
  adicionarPlano: (plano: NovoPlano) => void;
  editarPlano: (id: string, dados: Partial<Plano>) => void;
  excluirPlano: (id: string) => void;
  getPlano: (id: string) => Plano | undefined;
  adicionarAssinatura: (assinatura: NovaAssinatura) => void;
  trocarPlano: (troca: TrocaPlano) => void;
  atualizarStatusAssinatura: (id: string, status: StatusAssinatura) => void;
  adicionarPagamento: (assinaturaId: string, pagamento: Omit<Pagamento, "id">) => void;
  getAssinatura: (id: string) => Assinatura | undefined;
  getAssinaturasPorStatus: (status: StatusAssinatura) => Assinatura[];
}

const PlanosContext = createContext<PlanosContextType | undefined>(undefined);

// Recursos disponíveis para os planos
const recursosDisponiveis = [
  { id: "whatsapp", nome: "Integração WhatsApp", descricao: "Envio de notificações via WhatsApp" },
  { id: "pagamentos", nome: "Gateway de Pagamentos", descricao: "Integração com gateways de pagamento" },
  { id: "relatorios", nome: "Relatórios Avançados", descricao: "Relatórios detalhados de performance" },
  { id: "agendamento_online", nome: "Agendamento Online", descricao: "Sistema de agendamento para clientes" },
  { id: "app_mobile", nome: "App Mobile", descricao: "Aplicativo mobile para barbeiros" },
  { id: "suporte_prioritario", nome: "Suporte Prioritário", descricao: "Atendimento prioritário 24/7" },
  { id: "marketing", nome: "Ferramentas de Marketing", descricao: "Campanhas e promoções" },
  { id: "multi_unidade", nome: "Múltiplas Unidades", descricao: "Gerenciar várias unidades" },
];

// Planos iniciais mockados
const planosIniciais: Plano[] = [
  {
    id: "1",
    nome: "Básico",
    descricao: "Plano ideal para começar",
    valorMensal: 49.90,
    limiteBarbeiros: 1,
    limiteAgendamentos: 100,
    recursos: [
      recursosDisponiveis.find(r => r.id === "agendamento_online")!,
      recursosDisponiveis.find(r => r.id === "relatorios")!,
    ],
    ativo: true,
    dataCriacao: "2024-01-01",
  },
  {
    id: "2",
    nome: "Profissional",
    descricao: "Para barbearias em crescimento",
    valorMensal: 99.90,
    limiteBarbeiros: 3,
    limiteAgendamentos: 500,
    recursos: [
      recursosDisponiveis.find(r => r.id === "agendamento_online")!,
      recursosDisponiveis.find(r => r.id === "whatsapp")!,
      recursosDisponiveis.find(r => r.id === "pagamentos")!,
      recursosDisponiveis.find(r => r.id === "relatorios")!,
      recursosDisponiveis.find(r => r.id === "marketing")!,
    ],
    ativo: true,
    dataCriacao: "2024-01-01",
  },
  {
    id: "3",
    nome: "Premium",
    descricao: "Solução completa para barbearias estabelecidas",
    valorMensal: 199.90,
    limiteBarbeiros: 10,
    limiteAgendamentos: 2000,
    recursos: recursosDisponiveis,
    ativo: true,
    dataCriacao: "2024-01-01",
  },
];

export function PlanosProvider({ children }: { children: ReactNode }) {
  const [planos, setPlanos] = useState<Plano[]>(planosIniciais);
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const { barbearias } = useBarbearias();

  const adicionarPlano = (novoPlano: NovoPlano) => {
    const plano: Plano = {
      id: Date.now().toString(),
      ...novoPlano,
      ativo: true,
      dataCriacao: new Date().toISOString().split("T")[0],
    };
    setPlanos([...planos, plano]);
  };

  const editarPlano = (id: string, dados: Partial<Plano>) => {
    setPlanos(
      planos.map((p) =>
        p.id === id
          ? { ...p, ...dados, dataAtualizacao: new Date().toISOString().split("T")[0] }
          : p
      )
    );
  };

  const excluirPlano = (id: string) => {
    setPlanos(planos.filter((p) => p.id !== id));
  };

  const getPlano = (id: string) => {
    return planos.find((p) => p.id === id);
  };

  const adicionarAssinatura = (novaAssinatura: NovaAssinatura) => {
    const plano = getPlano(novaAssinatura.planoId);
    const barbearia = barbearias.find((b) => b.id === novaAssinatura.barbeariaId);

    if (!plano || !barbearia) return;

    const dataVencimento = calcularVencimento(novaAssinatura.dataInicio);

    const assinatura: Assinatura = {
      id: Date.now().toString(),
      barbeariaId: novaAssinatura.barbeariaId,
      barbeariaNome: barbearia.nome,
      planoId: novaAssinatura.planoId,
      planoNome: plano.nome,
      status: "em_dia",
      dataInicio: novaAssinatura.dataInicio,
      dataVencimento,
      proximoVencimento: dataVencimento,
      valorMensal: plano.valorMensal,
      pagamentos: [],
    };

    setAssinaturas([...assinaturas, assinatura]);
  };

  const trocarPlano = (troca: TrocaPlano) => {
    const assinatura = assinaturas.find((a) => a.id === troca.assinaturaId);
    const novoPlano = getPlano(troca.novoPlanoId);

    if (!assinatura || !novoPlano) return;

    const novaDataVencimento = calcularVencimento(troca.dataEfetivacao);

    setAssinaturas(
      assinaturas.map((a) =>
        a.id === troca.assinaturaId
          ? {
              ...a,
              planoId: troca.novoPlanoId,
              planoNome: novoPlano.nome,
              valorMensal: novoPlano.valorMensal,
              dataVencimento: novaDataVencimento,
              proximoVencimento: novaDataVencimento,
            }
          : a
      )
    );
  };

  const atualizarStatusAssinatura = (id: string, status: StatusAssinatura) => {
    setAssinaturas(
      assinaturas.map((a) =>
        a.id === id
          ? {
              ...a,
              status,
              ...(status === "cancelado" && {
                dataCancelamento: new Date().toISOString().split("T")[0],
              }),
            }
          : a
      )
    );
  };

  const adicionarPagamento = (assinaturaId: string, pagamento: Omit<Pagamento, "id">) => {
    const novoPagamento: Pagamento = {
      id: Date.now().toString(),
      ...pagamento,
    };

    setAssinaturas(
      assinaturas.map((a) => {
        if (a.id === assinaturaId) {
          const proximoVencimento = calcularVencimento(a.proximoVencimento);
          return {
            ...a,
            pagamentos: [...a.pagamentos, novoPagamento],
            status: pagamento.status === "pago" ? "em_dia" : a.status,
            proximoVencimento,
          };
        }
        return a;
      })
    );
  };

  const getAssinatura = (id: string) => {
    return assinaturas.find((a) => a.id === id);
  };

  const getAssinaturasPorStatus = (status: StatusAssinatura) => {
    return assinaturas.filter((a) => a.status === status);
  };

  return (
    <PlanosContext.Provider
      value={{
        planos,
        assinaturas,
        adicionarPlano,
        editarPlano,
        excluirPlano,
        getPlano,
        adicionarAssinatura,
        trocarPlano,
        atualizarStatusAssinatura,
        adicionarPagamento,
        getAssinatura,
        getAssinaturasPorStatus,
      }}
    >
      {children}
    </PlanosContext.Provider>
  );
}

export function usePlanos() {
  const context = useContext(PlanosContext);
  if (!context) {
    throw new Error("usePlanos deve ser usado dentro de PlanosProvider");
  }
  return context;
}

function calcularVencimento(dataInicio: string): string {
  const data = new Date(dataInicio);
  data.setMonth(data.getMonth() + 1);
  return data.toISOString().split("T")[0];
}

