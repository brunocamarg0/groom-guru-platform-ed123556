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
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Verificar autenticação ao montar o componente (apenas uma vez)
  useEffect(() => {
    console.log('🔐 [DONO LAYOUT] Iniciando verificação de autenticação...');
    console.log('   URL atual:', window.location.pathname);
    
    // Verificação inicial: se há dados de sessão mas não há token, limpar dados inválidos
    const barbearia = localStorage.getItem('barbearia');
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    console.log('🔐 [DONO LAYOUT] Estado inicial:');
    console.log('   Token:', !!token);
    console.log('   UserType:', userType);
    console.log('   Barbearia:', !!barbearia);
    console.log('   User:', !!user);
    
    // Se o userType é 'cliente', isso está errado - redirecionar para login do dono
    if (userType === 'cliente') {
      console.error('❌ [DONO LAYOUT] UserType é "cliente" mas estamos no painel do dono!');
      console.error('   Isso indica um problema no login. Redirecionando para login do dono...');
      localStorage.clear();
      window.location.href = '/login?tab=owner';
      return;
    }
    
    if ((barbearia || user) && !token) {
      console.warn('⚠️ [DONO LAYOUT] Detectado dados de sessão sem token!');
      console.warn('   Isso indica que houve um problema no login anterior.');
      console.warn('   Limpando dados de sessão inválidos...');
      
      // Limpar dados de sessão inválidos
      localStorage.removeItem('barbearia');
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
      
      console.warn('   Dados limpos. Redirecionando para login...');
      window.location.href = '/login?tab=owner';
      return;
    }
    
    let attempts = 0;
    const maxAttempts = 100; // Aumentado para 50 segundos (100 tentativas x 500ms) - dar MUITO mais tempo após login
    let intervalId: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let hasBarbearia = false; // Flag para indicar se há barbearia (login recente)
    
    // Verificar imediatamente se há barbearia (indicador de login recente)
    const barbeariaInicial = localStorage.getItem('barbearia');
    if (barbeariaInicial) {
      hasBarbearia = true;
      console.log('🔍 [DONO LAYOUT] Barbearia encontrada no localStorage - login recente detectado, aguardando token...');
    }
    
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
      if (barbearia && !hasBarbearia) {
        hasBarbearia = true;
        console.log('🔍 [DONO LAYOUT] Barbearia detectada durante verificação - login recente confirmado');
      }
      
      // Log apenas a cada 5 tentativas para não poluir o console
      if (attempts === 1 || attempts % 10 === 0 || attempts === maxAttempts) {
        console.log(`🔐 [DONO LAYOUT] Verificando autenticação (tentativa ${attempts}/${maxAttempts})...`);
        console.log('   Token presente:', !!token);
        console.log('   UserType:', userType);
        console.log('   Barbearia presente:', !!barbearia);
        console.log('   localStorage.token:', localStorage.getItem('token') ? localStorage.getItem('token')?.substring(0, 30) + '...' : 'null');
        console.log('   localStorage completo:', {
          token: !!localStorage.getItem('token'),
          userType: localStorage.getItem('userType'),
          user: !!localStorage.getItem('user'),
          barbearia: !!localStorage.getItem('barbearia')
        });
      }
      
      // Verificar se o userType está correto (pode ser 'dono' ou 'owner' dependendo de onde foi salvo)
      const userTypeValido = userType === 'dono' || userType === 'owner';
      
      // Se não há token ou userType não é válido
      if (!token || !userTypeValido) {
        // Se há barbearia mas não há token, aguardar mais tempo (login recente)
        if (hasBarbearia && attempts < maxAttempts) {
          if (attempts % 10 === 0) {
            console.warn(`⚠️ [DONO LAYOUT] Token não encontrado mas barbearia presente (tentativa ${attempts}). Aguardando token...`);
          }
          return; // Continuar verificando no intervalo
        }
        
        // Se ainda não atingiu o máximo de tentativas, tentar novamente
        if (attempts < maxAttempts) {
          // Não fazer log a cada tentativa para não poluir o console
          if (attempts % 10 === 0) {
            console.warn(`⚠️ [DONO LAYOUT] Token não encontrado (tentativa ${attempts}). Continuando verificação...`);
          }
          return; // Continuar verificando no intervalo
        }
        
        // Se atingiu o máximo de tentativas, verificar se há barbearia (pode ser que o token foi perdido mas a sessão ainda é válida)
        const barbeariaFinal = localStorage.getItem('barbearia');
        if (barbeariaFinal) {
          console.warn('⚠️ [DONO LAYOUT] Token não encontrado mas barbearia presente após todas as tentativas. Aguardando mais 15 segundos...');
          // Aguardar mais 15 segundos antes de redirecionar (dar MUITO mais tempo após login)
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            const tokenFinal = localStorage.getItem('token') || sessionStorage.getItem('token') || sessionStorage.getItem('token_backup');
            const userTypeFinal = localStorage.getItem('userType') || sessionStorage.getItem('userType') || sessionStorage.getItem('userType_backup');
            console.log('🔐 [DONO LAYOUT] Verificação após espera adicional:');
            console.log('   Token:', !!tokenFinal);
            console.log('   UserType:', userTypeFinal);
            console.log('   localStorage completo:', {
              token: !!localStorage.getItem('token'),
              userType: localStorage.getItem('userType'),
              user: !!localStorage.getItem('user'),
              barbearia: !!localStorage.getItem('barbearia')
            });
            if (tokenFinal && (userTypeFinal === 'dono' || userTypeFinal === 'owner')) {
              console.log('✅ [DONO LAYOUT] Token encontrado após espera adicional!');
              // Normalizar userType para 'dono'
              if (userTypeFinal !== 'dono') {
                localStorage.setItem('userType', 'dono');
              }
              setIsCheckingAuth(false);
              if (intervalId) clearInterval(intervalId);
            } else {
              console.error('❌ [DONO LAYOUT] Token ainda não encontrado após espera adicional.');
              console.error('   Limpando dados de sessão e redirecionando para login...');
              // Limpar dados de sessão antigos para evitar confusão
              localStorage.removeItem('barbearia');
              localStorage.removeItem('user');
              localStorage.removeItem('userType');
              window.location.href = '/login?tab=owner';
            }
          }, 2000);
          return;
        }
        
        // Se atingiu o máximo de tentativas e não há dados de sessão, redirecionar para login
        console.error('❌ [DONO LAYOUT] Token não encontrado após múltiplas tentativas. Redirecionando para login...');
        console.error('   Token final:', !!localStorage.getItem('token'));
        console.error('   UserType final:', localStorage.getItem('userType'));
        console.error('   Barbearia final:', !!localStorage.getItem('barbearia'));
        // Limpar qualquer dado residual
        localStorage.removeItem('userType');
        if (intervalId) clearInterval(intervalId);
        window.location.href = '/login?tab=owner';
        return;
      }
      
      console.log('✅ [DONO LAYOUT] Autenticação válida');
      setIsCheckingAuth(false);
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };

    // Verificar imediatamente (sem delay) para pegar token que já está presente
    checkAuth();
    
    // Continuar verificando periodicamente
    intervalId = setInterval(() => {
      if (attempts < maxAttempts && isCheckingAuth) {
        checkAuth();
      } else {
        if (intervalId) clearInterval(intervalId);
      }
    }, 500); // Verificar a cada 500ms
    
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [location.pathname, isCheckingAuth]);

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

  // Timeout para loading
  useEffect(() => {
    if (!configuracao) {
      const timer = setTimeout(() => {
        console.warn('⚠️ [DONO] Configuração demorou mais de 3 segundos, usando dados do localStorage');
        setLoadingTimeout(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [configuracao]);

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

  // Se não tem configuração ainda, tentar carregar do localStorage
  let configuracaoLocal = configuracao;
  if (!configuracaoLocal || !configuracaoLocal.nome) {
    const barbeariaStr = localStorage.getItem('barbearia');
    if (barbeariaStr) {
      try {
        const barbeariaData = JSON.parse(barbeariaStr);
        if (barbeariaData && barbeariaData.nome) {
          configuracaoLocal = {
            nome: barbeariaData.nome || 'Barbearia',
            foto: barbeariaData.foto || null,
          };
        }
      } catch (error) {
        console.error('Erro ao parsear localStorage:', error);
      }
    }
  }

  if (!configuracaoLocal && !loadingTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando painel do dono...</p>
          <p className="text-sm text-muted-foreground">Aguarde alguns instantes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="light bg-white min-h-screen light-theme-override" id="dono-panel">
      <SidebarProvider>
        <Sidebar className="bg-sidebar border-r border-sidebar-border">
        <SidebarHeader className="border-b border-sidebar-border bg-sidebar">
          <div className="flex items-center gap-3 px-4 py-3">
            {configuracaoLocal?.foto ? (
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={configuracaoLocal.foto} alt={configuracaoLocal.nome || "Barbearia"} />
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
                {configuracaoLocal?.nome || "Painel do Dono"}
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
