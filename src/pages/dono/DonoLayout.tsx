import { Outlet, Link, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useDono } from "@/context/DonoContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";

function DonoLayoutContent() {
  const location = useLocation();
  const { notificacoes } = useDono();
  const { theme } = useTheme();
  const notificacoesNaoLidas = notificacoes?.filter((n) => !n.lida).length || 0;

  const menuItems = [
    {
      title: "Dashboard",
      url: "/dono",
      icon: Home,
    },
    {
      title: "Agenda",
      url: "/dono/agenda",
      icon: Calendar,
    },
    {
      title: "Serviços",
      url: "/dono/servicos",
      icon: Scissors,
    },
    {
      title: "Profissionais",
      url: "/dono/profissionais",
      icon: Users,
    },
    {
      title: "Clientes",
      url: "/dono/clientes",
      icon: User,
    },
    {
      title: "Financeiro",
      url: "/dono/financeiro",
      icon: CreditCard,
    },
    {
      title: "Comissões",
      url: "/dono/comissoes",
      icon: DollarSign,
    },
    {
      title: "Fidelidade",
      url: "/dono/fidelidade",
      icon: Gift,
    },
    {
      title: "Avaliações",
      url: "/dono/avaliacoes",
      icon: Star,
    },
    {
      title: "Produtos",
      url: "/dono/produtos",
      icon: Package,
    },
    {
      title: "Notificações",
      url: "/dono/notificacoes",
      icon: Bell,
      badge: notificacoesNaoLidas > 0 ? notificacoesNaoLidas : undefined,
    },
    {
      title: "Configurações",
      url: "/dono/configuracoes",
      icon: Settings,
    },
    {
      title: "Relatórios",
      url: "/dono/relatorios",
      icon: FileText,
    },
  ];

  return (
    <div className="light bg-white min-h-screen light-theme-override" id="dono-panel">
      <SidebarProvider>
        <Sidebar className="bg-sidebar border-r border-sidebar-border">
        <SidebarHeader className="border-b border-sidebar-border bg-sidebar">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="bg-primary p-2 rounded-full">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-sidebar-foreground">
                Painel do Dono
              </span>
              <span className="text-xs text-sidebar-foreground/70">
                Gestão Completa
              </span>
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
        <div className="p-4 border-t border-sidebar-border space-y-2 bg-sidebar">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            asChild
          >
            <Link to="/login">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Link>
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
