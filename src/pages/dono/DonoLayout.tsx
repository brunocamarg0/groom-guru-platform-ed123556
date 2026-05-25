import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Home,
  Calendar,
  Scissors,
  Users,
  User,
  CreditCard,
  DollarSign,
  Gift,
  Star,
  Package,
  Bell,
  Settings,
  FileText,
  LogOut,
  Building2,
  Receipt,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useDono } from "@/context/DonoContext";
import { useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/context/ThemeContext";
import { Loader2 } from "lucide-react";

function DonoLayoutContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { notificacoes, configuracao, loading, barbeariaId } = useDono();
  const notificacoesNaoLidas = notificacoes?.filter((n) => !n.lida).length || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando painel do dono...</p>
        </div>
      </div>
    );
  }

  if (!barbeariaId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-center space-y-4 max-w-md">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold">Nenhuma barbearia vinculada</h2>
          <p className="text-muted-foreground">
            Seu usuário não está vinculado a nenhuma barbearia. Peça ao administrador para criar o vínculo.
          </p>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const menuItems = [
    { title: "Dashboard", url: "/dono", icon: Home },
    { title: "Agenda", url: "/dono/agenda", icon: Calendar },
    { title: "Serviços", url: "/dono/servicos", icon: Scissors },
    { title: "Profissionais", url: "/dono/profissionais", icon: Users },
    { title: "Clientes", url: "/dono/clientes", icon: User },
    { title: "Planos de Clientes", url: "/dono/planos-cliente", icon: Package },
    { title: "Assinaturas", url: "/dono/assinaturas-cliente", icon: Receipt },
    { title: "Financeiro", url: "/dono/financeiro", icon: CreditCard },
    { title: "Comissões", url: "/dono/comissoes", icon: DollarSign },
    { title: "Fidelidade", url: "/dono/fidelidade", icon: Gift },
    { title: "Avaliações", url: "/dono/avaliacoes", icon: Star },
    { title: "Produtos", url: "/dono/produtos", icon: Package },
    {
      title: "Notificações",
      url: "/dono/notificacoes",
      icon: Bell,
      badge: notificacoesNaoLidas > 0 ? notificacoesNaoLidas : undefined,
    },
    { title: "Configurações", url: "/dono/configuracoes", icon: Settings },
    { title: "Relatórios", url: "/dono/relatorios", icon: FileText },
  ];

  return (
    <div className="light bg-white min-h-screen light-theme-override" id="dono-panel">
      <SidebarProvider>
        <Sidebar className="bg-sidebar border-r border-sidebar-border">
          <SidebarHeader className="border-b border-sidebar-border bg-sidebar">
            <div className="flex items-center gap-3 px-4 py-3">
              {configuracao?.foto ? (
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarImage src={configuracao.foto} alt={configuracao.nome} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Building2 className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="bg-primary p-2 rounded-full">
                  <Building2 className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-sidebar-foreground">
                  {configuracao?.nome || "Painel do Dono"}
                </span>
                <span className="text-xs text-sidebar-foreground/70">Gestão Completa</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="bg-sidebar">
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground font-semibold">Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={
                          location.pathname === item.url ||
                          (item.url !== "/dono" && location.pathname.startsWith(item.url + "/"))
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
          <div className="p-4 border-t border-sidebar-border space-y-2 bg-sidebar">
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </Sidebar>
        <SidebarInset className="bg-white">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-white px-4">
            <SidebarTrigger className="-ml-1 text-foreground" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-lg font-semibold text-foreground">Área do Dono</h1>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 bg-white">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export default function DonoLayout() {
  return (
    <ThemeProvider>
      <DonoLayoutContent />
    </ThemeProvider>
  );
}
