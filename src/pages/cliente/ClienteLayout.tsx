import { Outlet, Link, useLocation } from "react-router-dom";
import * as React from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCliente } from "@/context/ClienteContext";
import { Badge } from "@/components/ui/badge";

export default function ClienteLayout() {
  const location = useLocation();
  
  // Hooks devem estar sempre no topo do componente
  const [loadingTimeout, setLoadingTimeout] = React.useState(false);
  
  let cliente, notificacoes, notificacoesNaoLidas = 0, loading = false;
  
  try {
    const clienteContext = useCliente();
    cliente = clienteContext.cliente;
    loading = clienteContext.loading;
    notificacoes = clienteContext.notificacoes || [];
    notificacoesNaoLidas = notificacoes.filter((n) => !n.lida).length;
  } catch (error) {
    console.error("Erro ao carregar contexto do cliente:", error);
    // Fallback para evitar crash
    cliente = null;
    loading = false;
    notificacoes = [];
    notificacoesNaoLidas = 0;
  }

  // Verificar se há token no localStorage
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');

  // Se não há token ou userType não é 'cliente', redirecionar para login
  if (!token || userType !== 'cliente') {
    console.warn('⚠️ Token não encontrado ou tipo de usuário incorreto. Redirecionando...');
    window.location.href = '/login?tab=client';
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  // Timeout para loading
  React.useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        console.warn('⚠️ [CLIENTE] Loading demorou mais de 3 segundos, usando dados do localStorage');
        setLoadingTimeout(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  const menuItems = [
    {
      title: "Dashboard",
      url: "/cliente",
      icon: Home,
    },
    {
      title: "Buscar Barbearias",
      url: "/cliente/agendar",
      icon: Calendar,
    },
    {
      title: "Pagamentos",
      url: "/cliente/pagamentos",
      icon: CreditCard,
    },
    {
      title: "Histórico",
      url: "/cliente/historico",
      icon: History,
    },
    {
      title: "Avaliações",
      url: "/cliente/avaliacoes",
      icon: Star,
    },
    {
      title: "Perfil",
      url: "/cliente/perfil",
      icon: User,
    },
    {
      title: "Notificações",
      url: "/cliente/notificacoes",
      icon: Bell,
      badge: notificacoesNaoLidas > 0 ? notificacoesNaoLidas : undefined,
    },
    {
      title: "Fidelidade",
      url: "/cliente/fidelidade",
      icon: Gift,
    },
    {
      title: "Minha Assinatura",
      url: "/cliente/assinatura",
      icon: Receipt,
    },
    {
      title: "Suporte",
      url: "/cliente/suporte",
      icon: MessageCircle,
    },
    {
      title: "Configurações",
      url: "/cliente/configuracoes",
      icon: Settings,
    },
  ];

  // Se não tem cliente ainda, tentar carregar do localStorage imediatamente
  if (!cliente || !cliente.nome) {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        if (userData && userData.nome) {
          // Usar dados do localStorage enquanto carrega da API
          cliente = {
            id: userData.id || '1',
            nome: userData.nome || 'Cliente',
            email: userData.email || '',
            telefone: userData.telefone || '',
          };
        }
      } catch (error) {
        console.error('Erro ao parsear localStorage:', error);
      }
    }
  }


  if (loading && !loadingTimeout && (!cliente || !cliente.nome)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando painel do cliente...</p>
          <p className="text-sm text-muted-foreground">Aguarde alguns instantes</p>
        </div>
      </div>
    );
  }

  // Se ainda não tem cliente após todos os fallbacks, mostrar erro
  if (!cliente || !cliente.nome) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold text-foreground">Erro ao carregar dados do cliente</p>
          <p className="text-muted-foreground">Não foi possível carregar seus dados.</p>
          <p className="text-sm text-muted-foreground">Por favor, faça login novamente.</p>
          <Button asChild className="mt-4">
            <a href="/login?tab=client">Fazer Login Novamente</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="light">
      <SidebarProvider>
        <Sidebar className="bg-sidebar">
          <SidebarHeader className="border-b border-sidebar-border">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="bg-primary p-2 rounded-full">
                <User className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  {cliente.nome || "Cliente"}
                </span>
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  Painel do Cliente
                </span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-gray-900 dark:text-gray-100 font-semibold">Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === item.url || location.pathname.startsWith(item.url + "/")}
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
            <Button
              variant="ghost"
              className="w-full justify-start"
              asChild
            >
              <Link to="/login">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Link>
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

