import { useCliente } from "@/context/ClienteContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  Clock,
  User,
  Scissors,
  DollarSign,
  CalendarCheck,
  History,
  UserCircle,
  Gift,
  MapPin,
  Phone,
  Mail,
  Search,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function ClienteDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  let cliente, getProximoAgendamento, fidelidade, barbearias, cancelarAgendamento, carregarDados;
  
  try {
    const clienteContext = useCliente();
    cliente = clienteContext.cliente;
    getProximoAgendamento = clienteContext.getProximoAgendamento;
    fidelidade = clienteContext.fidelidade;
    barbearias = clienteContext.barbearias || [];
    cancelarAgendamento = clienteContext.cancelarAgendamento;
    carregarDados = clienteContext.carregarDados;
  } catch (error) {
    console.error("Erro ao carregar dados do cliente:", error);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Erro ao carregar dados do cliente</p>
          <p className="text-sm text-muted-foreground mt-2">
            {error instanceof Error ? error.message : "Erro desconhecido"}
          </p>
        </div>
      </div>
    );
  }

  if (!cliente || !getProximoAgendamento || !fidelidade) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando dados do cliente...</p>
        </div>
      </div>
    );
  }

  const proximoAgendamento = getProximoAgendamento();

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const calcularTempoRestante = () => {
    if (!proximoAgendamento) return null;

    const dataAgendamento = new Date(
      `${proximoAgendamento.data}T${proximoAgendamento.horario || proximoAgendamento.hora}`
    );
    const agora = new Date();

    if (dataAgendamento < agora) return null;

    const diffMs = dataAgendamento.getTime() - agora.getTime();
    const horas = Math.floor(diffMs / (1000 * 60 * 60));
    const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (horas > 0) {
      return `Faltam ${horas}h e ${minutos}min para seu corte`;
    } else {
      return `Faltam ${minutos}min para seu corte`;
    }
  };

  const formatarData = (data: string, horario: string) => {
    try {
      const date = new Date(`${data}T${horario}`);
      const meses = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
      ];
      const dia = date.getDate();
      const mes = meses[date.getMonth()];
      const hora = horario;
      return `${dia} de ${mes} às ${hora}`;
    } catch {
      return `${data} às ${horario}`;
    }
  };

  const handleCancelarAgendamento = async () => {
    if (!proximoAgendamento) return;
    
    if (confirm("Tem certeza que deseja cancelar este agendamento?")) {
      try {
        await cancelarAgendamento(proximoAgendamento.id);
        toast({
          title: "Agendamento cancelado",
          description: "Seu agendamento foi cancelado com sucesso.",
        });
        // Recarregar dados
        if (carregarDados) {
          await carregarDados();
        }
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error.message || "Não foi possível cancelar o agendamento.",
          variant: "destructive",
        });
      }
    }
  };

  const tempoRestante = calcularTempoRestante();

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    confirmado: { label: "Confirmado", variant: "default" },
    aguardando_pagamento: { label: "Aguardando Pagamento", variant: "secondary" },
    pendente: { label: "Pendente", variant: "secondary" },
    concluido: { label: "Concluído", variant: "outline" },
    cancelado: { label: "Cancelado", variant: "destructive" },
    reagendado: { label: "Reagendado", variant: "secondary" },
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status] || { label: status, variant: "default" as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Olá, {cliente.nome.split(" ")[0]}! 👋</h2>
          <p className="text-muted-foreground">
            Bem-vindo ao seu painel de agendamentos
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => carregarDados && carregarDados()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Próximo Agendamento */}
      {proximoAgendamento ? (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Próximo Agendamento
                </CardTitle>
                {tempoRestante && (
                  <CardDescription className="mt-2 text-primary font-medium">
                    ⏰ {tempoRestante}
                  </CardDescription>
                )}
              </div>
              <Badge variant={getStatusConfig(proximoAgendamento.status).variant}>
                {getStatusConfig(proximoAgendamento.status).label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Data e Horário</p>
                <p className="font-medium">
                  {formatarData(proximoAgendamento.data, proximoAgendamento.horario || proximoAgendamento.hora)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Profissional</p>
                <p className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {proximoAgendamento.profissionalNome || 'A definir'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Serviço</p>
                <p className="font-medium flex items-center gap-2">
                  <Scissors className="h-4 w-4" />
                  {proximoAgendamento.servicoNome || proximoAgendamento.servico?.nome || 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {formatarMoeda(proximoAgendamento.valor || proximoAgendamento.servico?.preco || 0)}
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" asChild>
                <Link to={`/cliente/agendar?reagendar=${proximoAgendamento.id}`}>
                  <CalendarCheck className="h-4 w-4 mr-2" />
                  Reagendar
                </Link>
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelarAgendamento}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum agendamento próximo</CardTitle>
            <CardDescription>
              Você não possui agendamentos confirmados no momento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/cliente/barbearias">
                <Calendar className="h-4 w-4 mr-2" />
                Agendar Agora
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Atalhos Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/cliente/barbearias">
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Agendar Agora
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Agende seu próximo corte de forma rápida e fácil
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/cliente/historico">
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Ver Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Veja todos os seus agendamentos anteriores
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/cliente/perfil">
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Meu Perfil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gerencie suas informações pessoais
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Fidelidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Programa de Fidelidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{fidelidade.pontos} pontos</p>
              <p className="text-sm text-muted-foreground">
                {fidelidade.cortesRealizados} cortes realizados • Nível {fidelidade.nivel}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                Faltam {fidelidade.proximoDesconto?.cortesNecessarios || 5} cortes
              </p>
              <p className="text-xs text-muted-foreground">
                para ganhar {fidelidade.proximoDesconto?.desconto || 5}% de desconto
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Créditos */}
      {((cliente as any).creditos || 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Créditos Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {formatarMoeda((cliente as any).creditos || 0)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Use seus créditos no próximo pagamento
            </p>
          </CardContent>
        </Card>
      )}

      {/* Barbearias Disponíveis */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Barbearias Disponíveis</h2>
            <p className="text-muted-foreground">
              Escolha uma barbearia para agendar seu serviço
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/cliente/barbearias')}>
            <Search className="h-4 w-4 mr-2" />
            Buscar Mais
          </Button>
        </div>

        {barbearias.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                Nenhuma barbearia disponível no momento.
              </p>
              <Button 
                className="mt-4" 
                onClick={() => navigate('/cliente/barbearias')}
              >
                Buscar Barbearias
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {barbearias.slice(0, 6).map((barbearia: any) => (
              <Card
                key={barbearia.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/cliente/agendar?barbearia=${barbearia.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {barbearia.foto ? (
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarImage src={barbearia.foto} alt={barbearia.nome} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {barbearia.nome.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="bg-primary p-2 rounded-full">
                          <Scissors className="h-5 w-5 text-primary-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <CardTitle className="text-lg">{barbearia.nome}</CardTitle>
                        {(barbearia.endereco || barbearia.cidade || barbearia.bairro) && (
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {[
                              barbearia.endereco,
                              barbearia.bairro,
                              barbearia.cidade
                            ].filter(Boolean).join(', ')}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Informações de contato */}
                  <div className="space-y-1 text-sm">
                    {barbearia.telefone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {barbearia.telefone}
                      </div>
                    )}
                    {barbearia.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {barbearia.email}
                      </div>
                    )}
                  </div>

                  {/* Estatísticas */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {barbearia.totalServicos > 0 && (
                      <div className="flex items-center gap-1">
                        <Scissors className="h-3 w-3" />
                        {barbearia.totalServicos} serviços
                      </div>
                    )}
                    {barbearia.profissionais && barbearia.profissionais.length > 0 && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {barbearia.profissionais.length} profissionais
                      </div>
                    )}
                  </div>

                  {/* Serviços disponíveis (primeiros 2) */}
                  {barbearia.servicos && barbearia.servicos.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Serviços:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {barbearia.servicos.slice(0, 2).map((servico: any) => (
                          <Badge key={servico.id} variant="secondary" className="text-xs">
                            {servico.nome}
                          </Badge>
                        ))}
                        {barbearia.servicos.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{barbearia.servicos.length - 2} mais
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Botão de ação */}
                  <Button className="w-full mt-4" variant="default">
                    <CalendarCheck className="h-4 w-4 mr-2" />
                    Agendar Agora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {barbearias.length > 6 && (
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={() => navigate('/cliente/barbearias')}>
              Ver Todas as {barbearias.length} Barbearias
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
