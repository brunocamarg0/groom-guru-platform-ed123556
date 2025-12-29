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
  Gift,
  Star,
  Package,
  Bell,
  Settings,
  FileText,
  LogOut,
  Building2,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useDono } from "@/context/DonoContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";

function DonoLayoutContent() {
  const location = useLocation();
  const { notificacoes } = useDono();
  const { theme, toggleTheme } = useTheme();
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
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
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
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url || location.pathname.startsWith(item.url + "/")}
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
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
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={toggleTheme}
          >
            {theme === "light" ? (
              <>
                <Moon className="h-4 w-4 mr-2" />
                Modo Escuro
              </>
            ) : (
              <>
                <Sun className="h-4 w-4 mr-2" />
                Modo Claro
              </>
            )}
          </Button>
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
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Área do Dono</h1>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function DonoLayout() {
  return (
    <ThemeProvider>
      <div className="dono-panel-theme">
        <DonoLayoutContent />
      </div>
    </ThemeProvider>
  );
}

