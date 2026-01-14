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
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function ClienteDashboard() {
  const navigate = useNavigate();
  let cliente, getProximoAgendamento, fidelidade, barbearias;
  
  try {
    const clienteContext = useCliente();
    cliente = clienteContext.cliente;
    getProximoAgendamento = clienteContext.getProximoAgendamento;
    fidelidade = clienteContext.fidelidade;
    barbearias = clienteContext.barbearias || [];
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
      `${proximoAgendamento.data}T${proximoAgendamento.horario}`
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

  const tempoRestante = calcularTempoRestante();

  const statusConfig = {
    confirmado: { label: "Confirmado", variant: "default" as const },
    aguardando_pagamento: { label: "Aguardando Pagamento", variant: "secondary" as const },
    concluido: { label: "Concluído", variant: "outline" as const },
    cancelado: { label: "Cancelado", variant: "destructive" as const },
    reagendado: { label: "Reagendado", variant: "secondary" as const },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Olá, {cliente.nome.split(" ")[0]}! 👋</h2>
        <p className="text-muted-foreground">
          Bem-vindo ao seu painel de agendamentos
        </p>
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
              <Badge variant={statusConfig[proximoAgendamento.status].variant}>
                {statusConfig[proximoAgendamento.status].label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Data e Horário</p>
                <p className="font-medium">
                  {formatarData(proximoAgendamento.data, proximoAgendamento.horario)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Profissional</p>
                <p className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {proximoAgendamento.profissionalNome}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Serviço</p>
                <p className="font-medium flex items-center gap-2">
                  <Scissors className="h-4 w-4" />
                  {proximoAgendamento.servicoNome}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {formatarMoeda(proximoAgendamento.valor)}
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
                onClick={() => {
                  // Cancelar agendamento
                  if (confirm("Tem certeza que deseja cancelar este agendamento?")) {
                    // Implementar cancelamento
                  }
                }}
              >
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
              <Link to="/cliente/agendar">
                <Calendar className="h-4 w-4 mr-2" />
                Agendar Agora
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Atalhos Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/cliente/agendar">
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
    </div>
  );
}

