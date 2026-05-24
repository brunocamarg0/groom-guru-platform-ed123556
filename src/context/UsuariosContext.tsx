import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Usuario, NovoUsuario, TipoUsuario, StatusUsuario } from "@/types/usuario";
import { useBarbearias } from "./BarbeariasContext";
import { listarBarbeariasAdmin, BarbeariaBackend } from "@/services/adminApi";

interface UsuariosContextType {
  usuarios: Usuario[];
  isLoading: boolean;
  error: string | null;
  recarregarUsuarios: () => Promise<void>;
  adicionarUsuario: (usuario: NovoUsuario) => void;
  editarUsuario: (id: string, dados: Partial<Usuario>) => void;
  resetarSenha: (id: string) => void;
  bloquearUsuario: (id: string) => void;
  desbloquearUsuario: (id: string) => void;
  getUsuario: (id: string) => Usuario | undefined;
  getUsuariosPorBarbearia: (barbeariaId: string) => Usuario[];
}

const UsuariosContext = createContext<UsuariosContextType | undefined>(undefined);

export function UsuariosProvider({ children }: { children: ReactNode }) {
  const { barbearias } = useBarbearias();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin status MUST be validated server-side via RLS / authenticated APIs.
  // This flag is UI-only and intentionally not based on client-controlled storage.
  // Legacy Railway admin panel is being deprecated in favor of Lovable Cloud RLS.
  const isAdmin = false;

  // Carregar usuários a partir das barbearias (donos)
  const carregarUsuarios = useCallback(async () => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('👥 [USUARIOS] Carregando usuários do banco de dados...');
      const barbeariasDados = await listarBarbeariasAdmin();
      
      // Extrair usuários donos das barbearias
      const usuariosDonos: Usuario[] = barbeariasDados
        .filter(b => b.dono)
        .map(b => ({
          id: b.dono!.id,
          barbeariaId: b.id,
          barbeariaNome: b.nome,
          nome: b.dono!.nome,
          email: b.dono!.email,
          tipo: 'admin_barbearia' as TipoUsuario,
          status: b.dono!.ativo ? 'ativo' as StatusUsuario : 'bloqueado' as StatusUsuario,
          dataCriacao: b.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          permissoes: ['todas'],
        }));
      
      console.log('👥 [USUARIOS] Usuários carregados:', usuariosDonos.length);
      setUsuarios(usuariosDonos);
    } catch (err: any) {
      console.error('❌ [USUARIOS] Erro ao carregar:', err);
      setError(err.message || 'Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  const recarregarUsuarios = async () => {
    await carregarUsuarios();
  };

  const adicionarUsuario = (novoUsuario: NovoUsuario) => {
    const barbearia = barbearias.find((b) => b.id === novoUsuario.barbeariaId);
    const usuario: Usuario = {
      id: Date.now().toString(),
      ...novoUsuario,
      barbeariaNome: barbearia?.nome || "",
      status: "ativo",
      dataCriacao: new Date().toISOString().split("T")[0],
      permissoes: novoUsuario.permissoes || [],
    };
    setUsuarios([...usuarios, usuario]);
  };

  const editarUsuario = (id: string, dados: Partial<Usuario>) => {
    setUsuarios(
      usuarios.map((u) => (u.id === id ? { ...u, ...dados } : u))
    );
  };

  const resetarSenha = (id: string) => {
    // Em produção, isso enviaria um email com link de reset
    console.log(`Resetando senha do usuário ${id}`);
  };

  const bloquearUsuario = (id: string) => {
    setUsuarios(
      usuarios.map((u) => (u.id === id ? { ...u, status: "bloqueado" } : u))
    );
  };

  const desbloquearUsuario = (id: string) => {
    setUsuarios(
      usuarios.map((u) => (u.id === id ? { ...u, status: "ativo" } : u))
    );
  };

  const getUsuario = (id: string) => {
    return usuarios.find((u) => u.id === id);
  };

  const getUsuariosPorBarbearia = (barbeariaId: string) => {
    return usuarios.filter((u) => u.barbeariaId === barbeariaId);
  };

  return (
    <UsuariosContext.Provider
      value={{
        usuarios,
        isLoading,
        error,
        recarregarUsuarios,
        adicionarUsuario,
        editarUsuario,
        resetarSenha,
        bloquearUsuario,
        desbloquearUsuario,
        getUsuario,
        getUsuariosPorBarbearia,
      }}
    >
      {children}
    </UsuariosContext.Provider>
  );
}

export function useUsuarios() {
  const context = useContext(UsuariosContext);
  if (!context) {
    throw new Error("useUsuarios deve ser usado dentro de UsuariosProvider");
  }
  return context;
}
