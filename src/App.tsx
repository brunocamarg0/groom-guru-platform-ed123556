import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import { BarbeariasProvider } from "@/context/BarbeariasContext";
import { PlanosProvider } from "@/context/PlanosContext";
import { FinanceiroProvider } from "@/context/FinanceiroContext";
import { UsuariosProvider } from "@/context/UsuariosContext";
import { MonitoramentoProvider } from "@/context/MonitoramentoContext";
import { NotificacoesProvider } from "@/context/NotificacoesContext";
import { IntegracoesGlobaisProvider } from "@/context/IntegracoesGlobaisContext";
import { SegurancaProvider } from "@/context/SegurancaContext";
import { SuporteProvider } from "@/context/SuporteContext";
import { ConfiguracaoProvider } from "@/context/ConfiguracaoContext";
import { ClienteProvider } from "@/context/ClienteContext";
import { DonoProvider } from "@/context/DonoContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CadastrarBarbearia from "./pages/admin/CadastrarBarbearia";
import EditarBarbearia from "./pages/admin/EditarBarbearia";
import DetalhesBarbearia from "./pages/admin/DetalhesBarbearia";
import Planos from "./pages/admin/Planos";
import Assinaturas from "./pages/admin/Assinaturas";
import DetalhesAssinatura from "./pages/admin/DetalhesAssinatura";
import FinanceiroDashboard from "./pages/admin/FinanceiroDashboard";
import ServicosBarbearia from "./pages/admin/ServicosBarbearia";
import Usuarios from "./pages/admin/Usuarios";
import Monitoramento from "./pages/admin/Monitoramento";
import Notificacoes from "./pages/admin/Notificacoes";
import IntegracoesGlobais from "./pages/admin/IntegracoesGlobais";
import Seguranca from "./pages/admin/Seguranca";
import Suporte from "./pages/admin/Suporte";
import Configuracoes from "./pages/admin/Configuracoes";
import ClienteLayout from "./pages/cliente/ClienteLayout";
import ClienteDashboard from "./pages/cliente/ClienteDashboard";
import AgendamentoOnline from "./pages/cliente/AgendamentoOnline";
import BuscarBarbearias from "./pages/cliente/BuscarBarbearias";
import PagamentoIntegrado from "./pages/cliente/PagamentoIntegrado";
import PagamentoSucesso from "./pages/cliente/PagamentoSucesso";
import PagamentoFalha from "./pages/cliente/PagamentoFalha";
import PagamentoPendente from "./pages/cliente/PagamentoPendente";
import HistoricoAgendamentos from "./pages/cliente/HistoricoAgendamentos";
import Avaliacoes from "./pages/cliente/Avaliacoes";
import PerfilCliente from "./pages/cliente/PerfilCliente";
import NotificacoesCliente from "./pages/cliente/NotificacoesCliente";
import Fidelidade from "./pages/cliente/Fidelidade";
import SuporteCliente from "./pages/cliente/SuporteCliente";
import ConfiguracoesCliente from "./pages/cliente/ConfiguracoesCliente";
import MinhaAssinatura from "./pages/cliente/MinhaAssinatura";
import PlanosDisponiveis from "./pages/cliente/PlanosDisponiveis";
import { ErrorBoundary } from "./components/ErrorBoundary";
import DonoLayout from "./pages/dono/DonoLayout";
import DonoDashboard from "./pages/dono/DonoDashboard";
import AgendaInteligente from "./pages/dono/AgendaInteligente";
import GestaoServicos from "./pages/dono/GestaoServicos";
import GestaoProfissionais from "./pages/dono/GestaoProfissionais";
import GestaoClientes from "./pages/dono/GestaoClientes";
import GestaoPlanosCliente from "./pages/dono/GestaoPlanosCliente";
import GestaoAssinaturasCliente from "./pages/dono/GestaoAssinaturasCliente";
import FinanceiroPagamentos from "./pages/dono/FinanceiroPagamentos";
import ComissoesBarbeiros from "./pages/dono/ComissoesBarbeiros";
import FidelidadePromocoes from "./pages/dono/FidelidadePromocoes";
import AvaliacoesReputacao from "./pages/dono/AvaliacoesReputacao";
import ProdutosEstoque from "./pages/dono/ProdutosEstoque";
import ComunicacaoNotificacoes from "./pages/dono/ComunicacaoNotificacoes";
import ConfiguracoesBarbearia from "./pages/dono/ConfiguracoesBarbearia";
import RelatoriosAvancados from "./pages/dono/RelatoriosAvancados";
import AtivarConta from "./pages/AtivarConta";
import AuthCallback from "./pages/AuthCallback";
import Funcionalidades from "./pages/Funcionalidades";
import Cadastro from "./pages/Cadastro";
import EsqueciSenha from "./pages/EsqueciSenha";
import CheckoutAssinatura from "./pages/CheckoutAssinatura";
import PagamentoAssinaturaSucesso from "./pages/PagamentoAssinaturaSucesso";
import PagamentoAssinaturaFalha from "./pages/PagamentoAssinaturaFalha";
import LoginAdmin from "./pages/admin/LoginAdmin";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Não tentar novamente se for erro 401 (token inválido)
        if (error?.status === 401 || error?.message?.includes('401')) {
          return false;
        }
        // Tentar no máximo 2 vezes para outros erros
        return failureCount < 2;
      },
      refetchOnWindowFocus: false, // Não refazer requisição ao focar na janela
      refetchOnReconnect: true, // Refazer apenas ao reconectar
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
      <BarbeariasProvider>
        <PlanosProvider>
          <FinanceiroProvider>
            <UsuariosProvider>
              <MonitoramentoProvider>
                <NotificacoesProvider>
                  <IntegracoesGlobaisProvider>
                    <SegurancaProvider>
                      <SuporteProvider>
                        <ConfiguracaoProvider>
                          <ClienteProvider>
                            <Toaster />
                            <Sonner />
                            <BrowserRouter>
                              <Routes>
                                <Route path="/" element={<Index />} />
                                <Route path="/auth" element={<Auth />} />
                                <Route path="/login" element={<Auth />} />
                                <Route path="/cadastro" element={<Auth />} />
                                <Route path="/esqueci-senha" element={<EsqueciSenha />} />
                                <Route path="/auth/callback" element={<AuthCallback />} />
                                <Route path="/ativar-conta" element={<AtivarConta />} />
                                <Route path="/funcionalidades" element={<Funcionalidades />} />
                                <Route path="/admin/login" element={<LoginAdmin />} />
                                <Route path="/super-admin" element={
                                  <ProtectedRoute requireRole="super_admin">
                                    <SuperAdminDashboard />
                                  </ProtectedRoute>
                                } />
                                <Route path="/cliente/pagamento/sucesso" element={<PagamentoSucesso />} />
                                <Route path="/cliente/pagamento/falha" element={<PagamentoFalha />} />
                                <Route path="/cliente/pagamento/pendente" element={<PagamentoPendente />} />
                                <Route path="/checkout-assinatura" element={<CheckoutAssinatura />} />
                                <Route path="/pagamento-assinatura/sucesso" element={<PagamentoAssinaturaSucesso />} />
                                <Route path="/pagamento-assinatura/falha" element={<PagamentoAssinaturaFalha />} />
                                <Route path="/pagamento-assinatura/pendente" element={<PagamentoAssinaturaFalha />} />
                                <Route path="/admin" element={<AdminLayout />}>
                                  <Route index element={<AdminDashboard />} />
                                  <Route path="barbearias/nova" element={<CadastrarBarbearia />} />
                                  <Route path="barbearias/:id" element={<DetalhesBarbearia />} />
                                  <Route path="barbearias/:id/editar" element={<EditarBarbearia />} />
                                  <Route path="barbearias/:id/servicos" element={<ServicosBarbearia />} />
                                  <Route path="planos" element={<Planos />} />
                                  <Route path="assinaturas" element={<Assinaturas />} />
                                  <Route path="assinaturas/:id" element={<DetalhesAssinatura />} />
                                  <Route path="financeiro" element={<FinanceiroDashboard />} />
                                  <Route path="usuarios" element={<Usuarios />} />
                                  <Route path="monitoramento" element={<Monitoramento />} />
                                  <Route path="notificacoes" element={<Notificacoes />} />
                                  <Route path="integracoes-globais" element={<IntegracoesGlobais />} />
                                  <Route path="seguranca" element={<Seguranca />} />
                                  <Route path="suporte" element={<Suporte />} />
                                  <Route path="configuracoes" element={<Configuracoes />} />
                                </Route>
                                <Route path="/cliente" element={
                                  <ErrorBoundary>
                                    <ClienteLayout />
                                  </ErrorBoundary>
                                }>
                                  <Route index element={<ErrorBoundary><ClienteDashboard /></ErrorBoundary>} />
                                  <Route path="barbearias" element={<ErrorBoundary><BuscarBarbearias /></ErrorBoundary>} />
                                  <Route path="agendar" element={<ErrorBoundary><AgendamentoOnline /></ErrorBoundary>} />
                                  <Route path="pagamentos" element={<ErrorBoundary><PagamentoIntegrado /></ErrorBoundary>} />
                                  <Route path="historico" element={<ErrorBoundary><HistoricoAgendamentos /></ErrorBoundary>} />
                                  <Route path="avaliacoes" element={<ErrorBoundary><Avaliacoes /></ErrorBoundary>} />
                                  <Route path="perfil" element={<ErrorBoundary><PerfilCliente /></ErrorBoundary>} />
                                  <Route path="notificacoes" element={<ErrorBoundary><NotificacoesCliente /></ErrorBoundary>} />
                                  <Route path="fidelidade" element={<ErrorBoundary><Fidelidade /></ErrorBoundary>} />
                                  <Route path="assinatura" element={<ErrorBoundary><MinhaAssinatura /></ErrorBoundary>} />
                                  <Route path="planos" element={<ErrorBoundary><PlanosDisponiveis /></ErrorBoundary>} />
                                  <Route path="suporte" element={<ErrorBoundary><SuporteCliente /></ErrorBoundary>} />
                                  <Route path="configuracoes" element={<ErrorBoundary><ConfiguracoesCliente /></ErrorBoundary>} />
                                  <Route path="*" element={<NotFound />} />
                                </Route>
                                <Route path="/dono" element={
                                  <ProtectedRoute requireRole="owner">
                                    <ErrorBoundary>
                                      <DonoProvider>
                                        <DonoLayout />
                                      </DonoProvider>
                                    </ErrorBoundary>
                                  </ProtectedRoute>
                                }>
                                  <Route index element={<ErrorBoundary><DonoDashboard /></ErrorBoundary>} />
                                  <Route path="agenda" element={<ErrorBoundary><AgendaInteligente /></ErrorBoundary>} />
                                  <Route path="servicos" element={<ErrorBoundary><GestaoServicos /></ErrorBoundary>} />
                                  <Route path="profissionais" element={<ErrorBoundary><GestaoProfissionais /></ErrorBoundary>} />
                                  <Route path="clientes" element={<ErrorBoundary><GestaoClientes /></ErrorBoundary>} />
                                  <Route path="planos-cliente" element={<ErrorBoundary><GestaoPlanosCliente /></ErrorBoundary>} />
                                  <Route path="assinaturas-cliente" element={<ErrorBoundary><GestaoAssinaturasCliente /></ErrorBoundary>} />
                                  <Route path="financeiro" element={<ErrorBoundary><FinanceiroPagamentos /></ErrorBoundary>} />
                                  <Route path="comissoes" element={<ErrorBoundary><ComissoesBarbeiros /></ErrorBoundary>} />
                                  <Route path="fidelidade" element={<ErrorBoundary><FidelidadePromocoes /></ErrorBoundary>} />
                                  <Route path="avaliacoes" element={<ErrorBoundary><AvaliacoesReputacao /></ErrorBoundary>} />
                                  <Route path="produtos" element={<ErrorBoundary><ProdutosEstoque /></ErrorBoundary>} />
                                  <Route path="notificacoes" element={<ErrorBoundary><ComunicacaoNotificacoes /></ErrorBoundary>} />
                                  <Route path="configuracoes" element={<ErrorBoundary><ConfiguracoesBarbearia /></ErrorBoundary>} />
                                  <Route path="relatorios" element={<ErrorBoundary><RelatoriosAvancados /></ErrorBoundary>} />
                                </Route>
                                <Route path="*" element={<NotFound />} />
                              </Routes>
                            </BrowserRouter>
                          </ClienteProvider>
                        </ConfiguracaoProvider>
                      </SuporteProvider>
                    </SegurancaProvider>
                  </IntegracoesGlobaisProvider>
                </NotificacoesProvider>
              </MonitoramentoProvider>
            </UsuariosProvider>
          </FinanceiroProvider>
        </PlanosProvider>
      </BarbeariasProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
