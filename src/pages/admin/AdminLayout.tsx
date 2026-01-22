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
  Scissors,
  Building2,
  LogOut,
  CreditCard,
  FileText,
  DollarSign,
  Users,
  Activity,
  Bell,
  Plug,
  Shield,
  MessageCircle,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function AdminLayout() {
  const location = useLocation();

  const menuItems = [
    {
      title: "Barbearias",
      url: "/admin",
      icon: Building2,
    },
    {
      title: "Planos",
      url: "/admin/planos",
      icon: FileText,
    },
    {
      title: "Assinaturas",
      url: "/admin/assinaturas",
      icon: CreditCard,
    },
    {
      title: "Financeiro",
      url: "/admin/financeiro",
      icon: DollarSign,
    },
    {
      title: "Usuários",
      url: "/admin/usuarios",
      icon: Users,
    },
    {
      title: "Monitoramento",
      url: "/admin/monitoramento",
      icon: Activity,
    },
    {
      title: "Notificações",
      url: "/admin/notificacoes",
      icon: Bell,
    },
    {
      title: "Integrações Globais",
      url: "/admin/integracoes-globais",
      icon: Plug,
    },
    {
      title: "Segurança",
      url: "/admin/seguranca",
      icon: Shield,
    },
    {
      title: "Suporte",
      url: "/admin/suporte",
      icon: MessageCircle,
    },
    {
      title: "Configurações",
      url: "/admin/configuracoes",
      icon: Settings,
    },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="bg-primary p-2 rounded">
              <Scissors className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm uppercase text-sidebar-foreground">
                Barber Maestro
              </span>
              <span className="text-xs text-sidebar-foreground/70">
                Admin Panel
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
          <h1 className="text-lg font-semibold">Painel Administrativo</h1>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

