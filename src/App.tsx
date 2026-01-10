import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BarbeariasProvider } from "@/context/BarbeariasContext";
import { ClienteProvider } from "@/context/ClienteContext";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BarbeariasProvider>
        <ClienteProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="barbearias/nova" element={<CadastrarBarbearia />} />
                <Route path="barbearias/:id" element={<DetalhesBarbearia />} />
                <Route path="barbearias/:id/editar" element={<EditarBarbearia />} />
              </Route>
              <Route path="/client" element={<ClientLayout />}>
                <Route index element={<ClientDashboard />} />
                <Route path="agendar" element={<AgendarServico />} />
                <Route path="checkout/:id" element={<Checkout />} />
                <Route path="agendamentos/:id" element={<DetalhesAgendamento />} />
                <Route path="perfil" element={<Perfil />} />
                <Route path="pagamentos" element={<Pagamentos />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ClienteProvider>
      </BarbeariasProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
