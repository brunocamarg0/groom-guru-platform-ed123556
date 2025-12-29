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
  CreditCard,
  History,
  Star,
  User,
  Bell,
  Gift,
  MessageCircle,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCliente } from "@/context/ClienteContext";
import { Badge } from "@/components/ui/badge";

export default function ClienteLayout() {
  const location = useLocation();
  const { cliente, notificacoes } = useCliente();
  const notificacoesNaoLidas = notificacoes.filter((n) => !n.lida).length;

  const menuItems = [
    {
      title: "Dashboard",
      url: "/cliente",
      icon: Home,
    },
    {
      title: "Agendar",
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

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="bg-primary p-2 rounded-full">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-sidebar-foreground">
                {cliente.nome}
              </span>
              <span className="text-xs text-sidebar-foreground/70">
                Painel do Cliente
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
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Área do Cliente</h1>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

