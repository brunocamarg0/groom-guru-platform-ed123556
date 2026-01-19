import { useState, useEffect } from "react";
import { useDono } from "@/context/DonoContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DollarSign,
  Calendar,
  XCircle,
  Users,
  Star,
  TrendingUp,
  AlertCircle,
  CreditCard,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { apiGet } from "@/services/api";

export default function DonoDashboard() {
  const { loading, kpi, agendamentos, notificacoes } = useDono();
  const [resumoComissoes, setResumoComissoes] = useState<any>(null);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const agendamentosHoje = agendamentos.filter(
    (a) => a.data === new Date().toISOString().split("T")[0]
  );

  // Carregar resumo de comissões do mês atual
  useEffect(() => {
    const carregarComissoes = async () => {
      try {
        const mes = new Date().getMonth() + 1;
        const ano = new Date().getFullYear();
        const data = await apiGet<any>(`/dono/comissoes/resumo?mes=${mes}&ano=${ano}`);
        setResumoComissoes(data.resumoGeral);
      } catch (error) {
        console.error('Erro ao carregar resumo de comissões:', error);
      }
    };
    carregarComissoes();
  }, []);

  const alertas = [
    ...(agendamentosHoje.length < 5
      ? [{ tipo: "warning", mensagem: "Agenda com poucos agendamentos hoje" }]
      : []),
    ...(notificacoes.filter((n) => !n.lida).length > 0
      ? [{ tipo: "info", mensagem: `${notificacoes.filter((n) => !n.lida).length} notificações não lidas` }]
      : []),
  ];

  // Mostrar loading enquanto carrega dados
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando dados do painel...</p>
        <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos na primeira vez</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Dashboard Geral</h2>
        <p className="text-muted-foreground">
          Visão completa do seu negócio
        </p>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="space-y-2">
          {alertas.map((alerta, index) => (
            <Card key={index} className="border-yellow-500">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm">{alerta.mensagem}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(kpi.faturamentoHoje)}</div>
            {kpi.variacaoHoje !== undefined && kpi.variacaoHoje !== 0 && (
              <div className="flex items-center gap-1 mt-1">
                {kpi.variacaoHoje > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
                )}
                <p className={`text-xs ${kpi.variacaoHoje > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.variacaoHoje > 0 ? '+' : ''}{kpi.variacaoHoje.toFixed(1)}% vs ontem
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.agendamentosHoje}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {agendamentosHoje.filter((a) => a.status === "confirmado").length} confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelamentos</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{kpi.cancelamentos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nota Média</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.notaMedia.toFixed(1)}</div>
            {kpi.totalAvaliacoes !== undefined && kpi.totalAvaliacoes > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <p className="text-xs text-muted-foreground">
                  Baseado em {kpi.totalAvaliacoes} {kpi.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* KPIs Secundários */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Faturamento Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(kpi.faturamentoSemana)}</div>
            {kpi.variacaoSemana !== undefined && kpi.variacaoSemana !== 0 && (
              <div className="flex items-center gap-1 mt-1">
                {kpi.variacaoSemana > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
                )}
                <p className={`text-xs ${kpi.variacaoSemana > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.variacaoSemana > 0 ? '+' : ''}{kpi.variacaoSemana.toFixed(1)}% vs semana passada
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Faturamento Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(kpi.faturamentoMes)}</div>
            {kpi.variacaoMes !== undefined && kpi.variacaoMes !== 0 && (
              <div className="flex items-center gap-1 mt-1">
                {kpi.variacaoMes > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
                )}
                <p className={`text-xs ${kpi.variacaoMes > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.variacaoMes > 0 ? '+' : ''}{kpi.variacaoMes.toFixed(1)}% vs mês passado
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Clientes Recorrentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.clientesRecorrentes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Comissões do Mês */}
      {resumoComissoes && resumoComissoes.totalPendente > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                  Comissões Pendentes - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <CardDescription>
                  Total a pagar aos barbeiros este mês
                </CardDescription>
              </div>
              <Button asChild variant="default">
                <Link to="/dono/comissoes">
                  Ver Detalhes
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total de Comissões</p>
                <p className="text-2xl font-bold">{formatarMoeda(resumoComissoes.totalComissao)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Já Pago</p>
                <p className="text-2xl font-bold text-green-600">{formatarMoeda(resumoComissoes.totalPago)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-2xl font-bold text-orange-600">{formatarMoeda(resumoComissoes.totalPendente)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agendamentos de Hoje */}
      <Card>
        <CardHeader>
          <CardTitle>Agendamentos de Hoje</CardTitle>
          <CardDescription>
            {agendamentosHoje.length} agendamentos programados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {agendamentosHoje.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhum agendamento para hoje
              </p>
            ) : (
              agendamentosHoje.map((agendamento) => (
                <div
                  key={agendamento.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{agendamento.clienteNome}</p>
                    <p className="text-sm text-muted-foreground">
                      {agendamento.servicoNome} • {agendamento.profissionalNome} • {agendamento.horario}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        agendamento.status === "confirmado"
                          ? "default"
                          : agendamento.status === "pendente"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {agendamento.status}
                    </Badge>
                    <span className="font-medium">{formatarMoeda(agendamento.valor)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}







