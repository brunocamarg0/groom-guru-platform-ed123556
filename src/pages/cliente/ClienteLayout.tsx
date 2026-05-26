import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Home,
  Calendar,
  CreditCard,
  History,
  Star,
  User,
  Bell,
  Gift,
  MessageCircle,
  Settings,
  LogOut,
  Receipt,
  Package,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCliente } from "@/context/ClienteContext";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

export default function ClienteLayout() {
  const location = useLocation();
  const { user, roles, loading: authLoading, signOut } = useAuth();
  // Hook must be called unconditionally to satisfy Rules of Hooks.
  // ClienteProvider always wraps this layout, so useCliente is safe.
  const clienteCtx = useCliente();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const isClient = roles.includes("client") || roles.includes("super_admin");
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-center space-y-3 max-w-md">
          <h1 className="text-2xl font-bold">Acesso restrito</h1>
          <p className="text-muted-foreground">
            Esta área é exclusiva para clientes. Sua conta atual não está cadastrada como cliente.
          </p>
          <Button asChild>
            <Link to="/">Voltar para o início</Link>
          </Button>
        </div>
      </div>
    );
  }

  const cliente = (clienteCtx?.cliente as { nome?: string } | null) || null;
  const notificacoesNaoLidas = (clienteCtx?.notificacoes || []).filter((n) => !n.lida).length;
  const nomeCliente =
    (typeof cliente?.nome === "string" && cliente.nome.trim()) || user.email?.split("@")[0] || "Cliente";

  const nomeExibicao = nomeCliente;

  const menuItems = [
    { title: "Dashboard", url: "/cliente", icon: Home },
    { title: "Buscar Barbearias", url: "/cliente/agendar", icon: Calendar },
    { title: "Pagamentos", url: "/cliente/pagamentos", icon: CreditCard },
    { title: "Histórico", url: "/cliente/historico", icon: History },
    { title: "Avaliações", url: "/cliente/avaliacoes", icon: Star },
    { title: "Perfil", url: "/cliente/perfil", icon: User },
    {
      title: "Notificações",
      url: "/cliente/notificacoes",
      icon: Bell,
      badge: notificacoesNaoLidas > 0 ? notificacoesNaoLidas : undefined,
    },
    { title: "Fidelidade", url: "/cliente/fidelidade", icon: Gift },
    { title: "Planos Disponíveis", url: "/cliente/planos", icon: Package },
    { title: "Minha Assinatura", url: "/cliente/assinatura", icon: Receipt },
    { title: "Suporte", url: "/cliente/suporte", icon: MessageCircle },
    { title: "Configurações", url: "/cliente/configuracoes", icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <div className="light bg-white min-h-screen" id="cliente-panel">
      <SidebarProvider>
        <Sidebar className="bg-sidebar">
          <SidebarHeader className="border-b border-sidebar-border">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="bg-primary p-2 rounded-full">
                <User className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  {nomeExibicao}
                </span>
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  Painel do Cliente
                </span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-gray-900 dark:text-gray-100 font-semibold">
                Menu
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={
                          location.pathname === item.url ||
                          location.pathname.startsWith(item.url + "/")
                        }
                        className="text-gray-900 dark:text-gray-100"
                      >
                        <Link to={item.url} className="text-gray-900 dark:text-gray-100">
                          <item.icon className="h-4 w-4" />
                          <span className="text-gray-900 dark:text-gray-100">{item.title}</span>
                          {item.badge && (
                            <Badge variant="destructive" className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <div className="p-4 border-t border-sidebar-border">
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </Sidebar>
        <SidebarInset className="bg-background">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4 bg-background">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-lg font-semibold text-foreground">Área do Cliente</h1>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 bg-background min-h-screen">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
