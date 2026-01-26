import { Outlet, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useDono } from "@/context/DonoContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";

function DonoLayoutContent() {
  const location = useLocation();
  const { notificacoes, configuracao } = useDono();
  const { theme } = useTheme();
  const notificacoesNaoLidas = notificacoes?.filter((n) => !n.lida).length || 0;
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Verificar autenticação ao montar o componente (apenas uma vez)
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 40; // Aumentado para 20 segundos (40 tentativas x 500ms) - dar mais tempo após login
    
    const checkAuth = () => {
      attempts++;
      // Tentar obter token do localStorage primeiro, depois do sessionStorage como fallback
      let token = localStorage.getItem('token');
      let userType = localStorage.getItem('userType');
      
      // Se não encontrou no localStorage, tentar sessionStorage (backup)
      if (!token) {
        token = sessionStorage.getItem('token') || sessionStorage.getItem('token_backup');
        userType = sessionStorage.getItem('userType') || sessionStorage.getItem('userType_backup');
        
        // Se encontrou no sessionStorage, copiar para localStorage
        if (token && userType) {
          console.log('🔄 [DONO LAYOUT] Token encontrado no sessionStorage, copiando para localStorage...');
          try {
            localStorage.setItem('token', token);
            localStorage.setItem('userType', userType);
            console.log('✅ [DONO LAYOUT] Token copiado com sucesso!');
          } catch (e) {
            console.error('❌ [DONO LAYOUT] Erro ao copiar token do sessionStorage para localStorage:', e);
          }
        }
      }
      
      const barbearia = localStorage.getItem('barbearia');
      
      // Log apenas a cada 5 tentativas para não poluir o console
      if (attempts === 1 || attempts % 5 === 0 || attempts === maxAttempts) {
        console.log(`🔐 [DONO LAYOUT] Verificando autenticação (tentativa ${attempts}/${maxAttempts})...`);
        console.log('   Token presente:', !!token);
        console.log('   UserType:', userType);
        console.log('   Barbearia presente:', !!barbearia);
      }
      
      // Se não há token ou userType não é 'dono'
      if (!token || userType !== 'dono') {
        // Se ainda não atingiu o máximo de tentativas, tentar novamente
        if (attempts < maxAttempts) {
          // Não fazer log a cada tentativa para não poluir o console
          if (attempts % 5 === 0) {
            console.warn(`⚠️ [DONO LAYOUT] Token não encontrado (tentativa ${attempts}). Continuando verificação...`);
          }
          setTimeout(checkAuth, 500);
          return;
        }
        
        // Se atingiu o máximo de tentativas, verificar se há barbearia (pode ser que o token foi perdido mas a sessão ainda é válida)
        const barbeariaFinal = localStorage.getItem('barbearia');
        if (barbeariaFinal) {
          console.warn('⚠️ [DONO LAYOUT] Token não encontrado mas barbearia presente. Aguardando mais 5 segundos...');
          // Aguardar mais 5 segundos antes de redirecionar (dar mais tempo após login)
          setTimeout(() => {
            const tokenFinal = localStorage.getItem('token') || sessionStorage.getItem('token') || sessionStorage.getItem('token_backup');
            if (!tokenFinal) {
              console.error('❌ [DONO LAYOUT] Token ainda não encontrado após espera adicional. Redirecionando para login...');
              window.location.href = '/login?tab=owner';
            } else {
              console.log('✅ [DONO LAYOUT] Token encontrado após espera adicional!');
              // Copiar do sessionStorage se necessário
              if (!localStorage.getItem('token')) {
                localStorage.setItem('token', tokenFinal);
                localStorage.setItem('userType', sessionStorage.getItem('userType') || sessionStorage.getItem('userType_backup') || 'dono');
              }
              setIsCheckingAuth(false);
            }
          }, 5000);
          return;
        }
        
        // Se atingiu o máximo de tentativas e não há barbearia, redirecionar para login
        console.error('❌ [DONO LAYOUT] Token não encontrado após múltiplas tentativas. Redirecionando para login...');
        console.error('   Token final:', !!localStorage.getItem('token'));
        console.error('   UserType final:', localStorage.getItem('userType'));
        console.error('   Barbearia final:', !!localStorage.getItem('barbearia'));
        window.location.href = '/login?tab=owner';
        return;
      }
      
      console.log('✅ [DONO LAYOUT] Autenticação válida');
      setIsCheckingAuth(false);
    };

    // Aguardar 1 segundo antes de começar a verificação (dar tempo para o token ser salvo após login)
    const initialDelay = setTimeout(() => {
      checkAuth(); // Primeira verificação após delay inicial
      
      // Continuar verificando periodicamente
      const timer = setInterval(() => {
        if (attempts < maxAttempts) {
          checkAuth();
        } else {
          clearInterval(timer);
        }
      }, 500); // Verificar a cada 500ms
      
      return () => {
        clearInterval(timer);
      };
    }, 1000); // Aguardar 1 segundo antes de começar
    
    return () => {
      clearTimeout(initialDelay);
    };
  }, [location.pathname]);

  // Se ainda está verificando autenticação, mostrar loading
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

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
            {configuracao?.foto ? (
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={configuracao.foto} alt={configuracao.nome || "Barbearia"} />
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
