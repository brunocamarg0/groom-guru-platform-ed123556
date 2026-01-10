import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BarbeariasProvider } from "@/context/BarbeariasContext";
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
import ClientLayout from "./pages/client/ClientLayout";
import ClientDashboard from "./pages/client/ClientDashboard";
import AgendarServico from "./pages/client/AgendarServico";
import Checkout from "./pages/client/Checkout";
import DetalhesAgendamento from "./pages/client/DetalhesAgendamento";
import Perfil from "./pages/client/Perfil";
import Pagamentos from "./pages/client/Pagamentos";
import PagamentoSucesso from "./pages/client/PagamentoSucesso";
import PagamentoFalha from "./pages/client/PagamentoFalha";
import PagamentoPendente from "./pages/client/PagamentoPendente";
import DonoLayout from "./pages/dono/DonoLayout";
import DonoDashboard from "./pages/dono/DonoDashboard";
import AgendaInteligente from "./pages/dono/AgendaInteligente";
import GestaoServicos from "./pages/dono/GestaoServicos";
import GestaoProfissionais from "./pages/dono/GestaoProfissionais";
import GestaoClientes from "./pages/dono/GestaoClientes";
import FinanceiroPagamentos from "./pages/dono/FinanceiroPagamentos";
import FidelidadePromocoes from "./pages/dono/FidelidadePromocoes";
import AvaliacoesReputacao from "./pages/dono/AvaliacoesReputacao";
import ProdutosEstoque from "./pages/dono/ProdutosEstoque";
import ComunicacaoNotificacoes from "./pages/dono/ComunicacaoNotificacoes";
import ConfiguracoesBarbearia from "./pages/dono/ConfiguracoesBarbearia";
import RelatoriosAvancados from "./pages/dono/RelatoriosAvancados";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BarbeariasProvider>
        <ClienteProvider>
          <DonoProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                {/* Rotas do Admin */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="barbearias/nova" element={<CadastrarBarbearia />} />
                  <Route path="barbearias/:id" element={<DetalhesBarbearia />} />
                  <Route path="barbearias/:id/editar" element={<EditarBarbearia />} />
                </Route>
                {/* Rotas do Cliente */}
                <Route path="/client" element={<ClientLayout />}>
                  <Route index element={<ClientDashboard />} />
                  <Route path="agendar" element={<AgendarServico />} />
                  <Route path="agendamentos/:id" element={<DetalhesAgendamento />} />
                  <Route path="agendamentos/:id/checkout" element={<Checkout />} />
                  <Route path="perfil" element={<Perfil />} />
                  <Route path="pagamentos" element={<Pagamentos />} />
                  <Route path="pagamento/sucesso" element={<PagamentoSucesso />} />
                  <Route path="pagamento/falha" element={<PagamentoFalha />} />
                  <Route path="pagamento/pendente" element={<PagamentoPendente />} />
                </Route>
                {/* Rotas do Dono */}
                <Route path="/dono" element={<DonoLayout />}>
                  <Route index element={<DonoDashboard />} />
                  <Route path="agenda" element={<AgendaInteligente />} />
                  <Route path="servicos" element={<GestaoServicos />} />
                  <Route path="profissionais" element={<GestaoProfissionais />} />
                  <Route path="clientes" element={<GestaoClientes />} />
                  <Route path="financeiro" element={<FinanceiroPagamentos />} />
                  <Route path="fidelidade" element={<FidelidadePromocoes />} />
                  <Route path="avaliacoes" element={<AvaliacoesReputacao />} />
                  <Route path="produtos" element={<ProdutosEstoque />} />
                  <Route path="notificacoes" element={<ComunicacaoNotificacoes />} />
                  <Route path="configuracoes" element={<ConfiguracoesBarbearia />} />
                  <Route path="relatorios" element={<RelatoriosAvancados />} />
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </DonoProvider>
        </ClienteProvider>
      </BarbeariasProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
