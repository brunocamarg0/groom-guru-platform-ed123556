import { useState, useMemo } from "react";
import { useDono } from "@/context/DonoContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Users, 
  Scissors, 
  Calendar,
  DollarSign,
  Star,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function RelatoriosAvancados() {
  const { agendamentos, profissionais, clientes, servicos, pagamentos } = useDono();
  const [dataInicio, setDataInicio] = useState(
    new Date(new Date().setDate(1)).toISOString().split("T")[0]
  );
  const [dataFim, setDataFim] = useState(new Date().toISOString().split("T")[0]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  // Relatórios calculados
  const relatorio = useMemo(() => {
    const agendamentosPeriodo = agendamentos.filter(
      (a) => a.data >= dataInicio && a.data <= dataFim
    );

    const agendamentosConcluidos = agendamentosPeriodo.filter(
      (a) => a.status === "concluido" || a.status === "confirmado"
    );

    const faturamento = agendamentosConcluidos.reduce((sum, a) => sum + a.valor, 0);
    const cancelamentos = agendamentosPeriodo.filter((a) => a.status === "cancelado").length;
    const totalAgendamentos = agendamentosPeriodo.length;
    const taxaCancelamento = totalAgendamentos > 0 ? (cancelamentos / totalAgendamentos) * 100 : 0;
    const ticketMedio = agendamentosConcluidos.length > 0 ? faturamento / agendamentosConcluidos.length : 0;

    // Serviços mais vendidos
    const servicosContagem: Record<string, { quantidade: number; receita: number; nome: string }> = {};
    agendamentosConcluidos.forEach((a) => {
      if (!servicosContagem[a.servicoId]) {
        servicosContagem[a.servicoId] = { quantidade: 0, receita: 0, nome: a.servicoNome };
      }
      servicosContagem[a.servicoId].quantidade++;
      servicosContagem[a.servicoId].receita += a.valor;
    });

    const servicosMaisVendidos = Object.entries(servicosContagem)
      .map(([id, dados]) => ({ id, ...dados }))
      .sort((a, b) => b.quantidade - a.quantidade);

    // Profissionais mais rentáveis
    const profissionaisContagem: Record<string, { receita: number; atendimentos: number; nome: string }> = {};
    agendamentosConcluidos.forEach((a) => {
      if (!profissionaisContagem[a.profissionalId]) {
        profissionaisContagem[a.profissionalId] = { receita: 0, atendimentos: 0, nome: a.profissionalNome };
      }
      profissionaisContagem[a.profissionalId].receita += a.valor;
      profissionaisContagem[a.profissionalId].atendimentos++;
    });

    const profissionaisMaisRentaveis = Object.entries(profissionaisContagem)
      .map(([id, dados]) => ({ id, ...dados }))
      .sort((a, b) => b.receita - a.receita);

    // Horários de pico
    const horariosContagem: Record<string, number> = {};
    agendamentosPeriodo.forEach((a) => {
      const hora = a.horario.split(":")[0];
      horariosContagem[hora] = (horariosContagem[hora] || 0) + 1;
    });

    const horariosPico = Object.entries(horariosContagem)
      .map(([horario, quantidade]) => ({ horario: `${horario}:00`, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);

    // Dias da semana mais movimentados
    const diasContagem: Record<string, number> = {};
    const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    agendamentosPeriodo.forEach((a) => {
      const dia = new Date(a.data).getDay();
      const nomeDia = diasSemana[dia];
      diasContagem[nomeDia] = (diasContagem[nomeDia] || 0) + 1;
    });

    const diasMaisMovimentados = Object.entries(diasContagem)
      .map(([dia, quantidade]) => ({ dia, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);

    return {
      faturamento,
      totalAgendamentos,
      agendamentosConcluidos: agendamentosConcluidos.length,
      cancelamentos,
      taxaCancelamento,
      ticketMedio,
      servicosMaisVendidos,
      profissionaisMaisRentaveis,
      horariosPico,
      diasMaisMovimentados,
    };
  }, [agendamentos, dataInicio, dataFim]);

  const handleExportarCSV = () => {
    const linhas = [
      ["Relatório de", dataInicio, "até", dataFim].join(","),
      "",
      "RESUMO GERAL",
      ["Faturamento Total", relatorio.faturamento.toFixed(2)].join(","),
      ["Total de Agendamentos", relatorio.totalAgendamentos].join(","),
      ["Agendamentos Concluídos", relatorio.agendamentosConcluidos].join(","),
      ["Cancelamentos", relatorio.cancelamentos].join(","),
      ["Taxa de Cancelamento", relatorio.taxaCancelamento.toFixed(1) + "%"].join(","),
      ["Ticket Médio", relatorio.ticketMedio.toFixed(2)].join(","),
      "",
      "SERVIÇOS MAIS VENDIDOS",
      ["Serviço", "Quantidade", "Receita"].join(","),
      ...relatorio.servicosMaisVendidos.map((s) =>
        [s.nome, s.quantidade, s.receita.toFixed(2)].join(",")
      ),
      "",
      "PROFISSIONAIS MAIS RENTÁVEIS",
      ["Profissional", "Atendimentos", "Receita"].join(","),
      ...relatorio.profissionaisMaisRentaveis.map((p) =>
        [p.nome, p.atendimentos, p.receita.toFixed(2)].join(",")
      ),
    ];

    const csvContent = linhas.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_${dataInicio}_${dataFim}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Relatório exportado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Relatórios Avançados</h2>
          <p className="text-muted-foreground">
            Análises detalhadas do seu negócio
          </p>
        </div>
        <Button variant="outline" onClick={handleExportarCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Período do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const hoje = new Date();
                  setDataInicio(new Date(hoje.setDate(1)).toISOString().split("T")[0]);
                  setDataFim(new Date().toISOString().split("T")[0]);
                }}
              >
                Este Mês
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const hoje = new Date();
                  const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
                  const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
                  setDataInicio(inicio.toISOString().split("T")[0]);
                  setDataFim(fim.toISOString().split("T")[0]);
                }}
              >
                Mês Anterior
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatarMoeda(relatorio.faturamento)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {relatorio.agendamentosConcluidos} atendimentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{relatorio.totalAgendamentos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {relatorio.cancelamentos} cancelados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Cancelamento</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${relatorio.taxaCancelamento > 10 ? "text-red-600" : "text-green-600"}`}>
              {relatorio.taxaCancelamento.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Meta: abaixo de 10%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatarMoeda(relatorio.ticketMedio)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Por atendimento
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="servicos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="servicos" className="gap-2">
            <Scissors className="h-4 w-4" />
            Serviços
          </TabsTrigger>
          <TabsTrigger value="profissionais" className="gap-2">
            <Users className="h-4 w-4" />
            Profissionais
          </TabsTrigger>
          <TabsTrigger value="horarios" className="gap-2">
            <Clock className="h-4 w-4" />
            Horários
          </TabsTrigger>
          <TabsTrigger value="dias" className="gap-2">
            <Calendar className="h-4 w-4" />
            Dias da Semana
          </TabsTrigger>
        </TabsList>

        <TabsContent value="servicos">
          <Card>
            <CardHeader>
              <CardTitle>Serviços Mais Vendidos</CardTitle>
              <CardDescription>
                Ranking de serviços por quantidade de atendimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Receita</TableHead>
                    <TableHead>% do Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatorio.servicosMaisVendidos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nenhum dado disponível para o período
                      </TableCell>
                    </TableRow>
                  ) : (
                    relatorio.servicosMaisVendidos.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant={index < 3 ? "default" : "secondary"}>
                            {index + 1}º
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.nome}</TableCell>
                        <TableCell>{item.quantidade}</TableCell>
                        <TableCell>{formatarMoeda(item.receita)}</TableCell>
                        <TableCell>
                          {((item.receita / relatorio.faturamento) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profissionais">
          <Card>
            <CardHeader>
              <CardTitle>Profissionais Mais Rentáveis</CardTitle>
              <CardDescription>
                Ranking de profissionais por faturamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Atendimentos</TableHead>
                    <TableHead>Receita</TableHead>
                    <TableHead>Ticket Médio</TableHead>
                    <TableHead>% do Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatorio.profissionaisMaisRentaveis.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Nenhum dado disponível para o período
                      </TableCell>
                    </TableRow>
                  ) : (
                    relatorio.profissionaisMaisRentaveis.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant={index < 3 ? "default" : "secondary"}>
                            {index + 1}º
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.nome}</TableCell>
                        <TableCell>{item.atendimentos}</TableCell>
                        <TableCell>{formatarMoeda(item.receita)}</TableCell>
                        <TableCell>
                          {formatarMoeda(item.receita / item.atendimentos)}
                        </TableCell>
                        <TableCell>
                          {((item.receita / relatorio.faturamento) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="horarios">
          <Card>
            <CardHeader>
              <CardTitle>Horários de Pico</CardTitle>
              <CardDescription>
                Horários com maior volume de agendamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatorio.horariosPico.slice(0, 8).map((item, index) => (
                  <Card key={item.horario} className={index < 3 ? "border-green-500" : ""}>
                    <CardContent className="pt-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-lg font-bold">{item.horario}</span>
                      </div>
                      <p className="text-2xl font-bold mt-2">{item.quantidade}</p>
                      <p className="text-xs text-muted-foreground">agendamentos</p>
                      {index < 3 && (
                        <Badge className="mt-2" variant="default">
                          Top {index + 1}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dias">
          <Card>
            <CardHeader>
              <CardTitle>Dias Mais Movimentados</CardTitle>
              <CardDescription>
                Distribuição de agendamentos por dia da semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatorio.diasMaisMovimentados.map((item, index) => (
                  <Card key={item.dia} className={index < 3 ? "border-blue-500" : ""}>
                    <CardContent className="pt-6 text-center">
                      <span className="text-lg font-bold">{item.dia}</span>
                      <p className="text-2xl font-bold mt-2">{item.quantidade}</p>
                      <p className="text-xs text-muted-foreground">agendamentos</p>
                      {index < 3 && (
                        <Badge className="mt-2" variant="default">
                          Top {index + 1}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
