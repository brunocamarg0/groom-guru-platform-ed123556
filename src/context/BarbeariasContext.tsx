import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Barbearia, NovaBarbearia, StatusBarbearia, ServicoBarbearia, NovoServicoBarbearia } from "@/types/barbearia";
import { 
  listarBarbeariasAdmin, 
  criarBarbeariaAdmin, 
  atualizarBarbeariaAdmin, 
  alterarStatusBarbeariaAdmin,
  deletarBarbeariaAdmin,
  BarbeariaBackend 
} from "@/services/adminApi";
import { useToast } from "@/hooks/use-toast";

interface BarbeariasContextType {
  barbearias: Barbearia[];
  isLoading: boolean;
  error: string | null;
  recarregarBarbearias: () => Promise<void>;
  adicionarBarbearia: (barbearia: NovaBarbearia) => Promise<void>;
  editarBarbearia: (id: string, dados: Partial<Barbearia>) => Promise<void>;
  alterarStatus: (id: string, status: StatusBarbearia) => Promise<void>;
  suspenderPorInadimplencia: (id: string) => Promise<void>;
  deletarBarbearia: (id: string) => Promise<void>;
  getBarbearia: (id: string) => Barbearia | undefined;
  adicionarServico: (barbeariaId: string, servico: NovoServicoBarbearia) => void;
  editarServico: (barbeariaId: string, servicoId: string, dados: Partial<ServicoBarbearia>) => void;
  removerServico: (barbeariaId: string, servicoId: string) => void;
  toggleServicoAtivo: (barbeariaId: string, servicoId: string) => void;
}

const BarbeariasContext = createContext<BarbeariasContextType | undefined>(undefined);

// Função para converter dados do backend para o formato do frontend
function converterBarbeariaBackend(backend: BarbeariaBackend): Barbearia {
  return {
    id: backend.id,
    nome: backend.nome,
    cnpjCpf: backend.cnpjCpf,
    responsavel: backend.responsavel,
    plano: backend.plano as 'basico' | 'premium' | 'enterprise',
    status: backend.status as StatusBarbearia,
    dataCriacao: backend.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
    dataVencimento: backend.dataVencimento?.split('T')[0] || new Date().toISOString().split('T')[0],
    gatewayPagamento: {
      nome: '',
      conectado: false,
    },
    servicos: (backend.servicos || []).map(s => ({
      id: s.id,
      tipo: s.tipo || 'outro',
      nome: s.nome,
      descricao: s.descricao,
      duracao: s.duracao,
      valor: s.preco,
      ativo: s.ativo,
      ordem: s.ordem,
    })),
    email: backend.email,
    telefone: backend.telefone,
    endereco: backend.endereco,
    cidade: backend.cidade,
    bairro: backend.bairro,
    cep: backend.cep,
  };
}

export function BarbeariasProvider({ children }: { children: ReactNode }) {
  const [barbearias, setBarbearias] = useState<Barbearia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Verificar se é admin antes de carregar
  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('userType') === 'admin';

  const carregarBarbearias = useCallback(async () => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📋 [BARBEARIAS] Carregando barbearias do banco de dados...');
      const dados = await listarBarbeariasAdmin();
      console.log('📋 [BARBEARIAS] Barbearias carregadas:', dados.length);
      
      const barbeariasConvertidas = dados.map(converterBarbeariaBackend);
      setBarbearias(barbeariasConvertidas);
    } catch (err: any) {
      console.error('❌ [BARBEARIAS] Erro ao carregar:', err);
      setError(err.message || 'Erro ao carregar barbearias');
      // Não mostrar toast aqui para evitar spam
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    carregarBarbearias();
  }, [carregarBarbearias]);

  const recarregarBarbearias = async () => {
    await carregarBarbearias();
  };

  const adicionarBarbearia = async (novaBarbearia: NovaBarbearia) => {
    try {
      console.log('➕ [BARBEARIAS] Criando nova barbearia:', novaBarbearia.nome);
      const resultado = await criarBarbeariaAdmin({
        nome: novaBarbearia.nome,
        cnpjCpf: novaBarbearia.cnpjCpf,
        responsavel: novaBarbearia.responsavel,
        plano: novaBarbearia.plano,
        email: novaBarbearia.email,
        telefone: novaBarbearia.telefone,
        endereco: novaBarbearia.endereco,
        cidade: novaBarbearia.cidade,
        bairro: novaBarbearia.bairro,
        cep: novaBarbearia.cep,
        enviarEmail: true,
      });
      
      console.log('✅ [BARBEARIAS] Barbearia criada com sucesso');
      
      // Recarregar lista
      await carregarBarbearias();
      
      toast({
        title: "Barbearia criada",
        description: `${novaBarbearia.nome} foi cadastrada com sucesso.`,
      });
    } catch (err: any) {
      console.error('❌ [BARBEARIAS] Erro ao criar:', err);
      toast({
        title: "Erro ao criar barbearia",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const editarBarbearia = async (id: string, dados: Partial<Barbearia>) => {
    try {
      console.log('✏️ [BARBEARIAS] Editando barbearia:', id);
      await atualizarBarbeariaAdmin(id, {
        nome: dados.nome,
        cnpjCpf: dados.cnpjCpf,
        responsavel: dados.responsavel,
        plano: dados.plano,
        email: dados.email,
        telefone: dados.telefone,
        endereco: dados.endereco,
        cidade: dados.cidade,
        bairro: dados.bairro,
        cep: dados.cep,
      });
      
      // Recarregar lista
      await carregarBarbearias();
      
      toast({
        title: "Barbearia atualizada",
        description: "Os dados foram salvos com sucesso.",
      });
    } catch (err: any) {
      console.error('❌ [BARBEARIAS] Erro ao editar:', err);
      toast({
        title: "Erro ao atualizar barbearia",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const alterarStatus = async (id: string, status: StatusBarbearia) => {
    try {
      console.log('🔄 [BARBEARIAS] Alterando status:', id, '->', status);
      await alterarStatusBarbeariaAdmin(id, status);
      
      // Atualizar localmente para feedback imediato
      setBarbearias(prev => 
        prev.map(b => b.id === id ? { ...b, status } : b)
      );
      
      toast({
        title: "Status alterado",
        description: `Barbearia ${status === 'ativa' ? 'ativada' : status === 'bloqueada' ? 'bloqueada' : status === 'cancelada' ? 'cancelada' : 'em teste'} com sucesso.`,
      });
    } catch (err: any) {
      console.error('❌ [BARBEARIAS] Erro ao alterar status:', err);
      toast({
        title: "Erro ao alterar status",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const suspenderPorInadimplencia = async (id: string) => {
    await alterarStatus(id, 'bloqueada');
  };

  const deletarBarbearia = async (id: string) => {
    try {
      console.log('🗑️ [BARBEARIAS] Deletando barbearia:', id);
      await deletarBarbeariaAdmin(id);
      
      // Remover localmente
      setBarbearias(prev => prev.filter(b => b.id !== id));
      
      toast({
        title: "Barbearia removida",
        description: "A barbearia foi removida com sucesso.",
      });
    } catch (err: any) {
      console.error('❌ [BARBEARIAS] Erro ao deletar:', err);
      toast({
        title: "Erro ao remover barbearia",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const getBarbearia = (id: string) => {
    return barbearias.find((b) => b.id === id);
  };

  // Funções de serviços (operações locais por enquanto, podem ser conectadas ao backend depois)
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
        isLoading,
        error,
        recarregarBarbearias,
        adicionarBarbearia,
        editarBarbearia,
        alterarStatus,
        suspenderPorInadimplencia,
        deletarBarbearia,
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
