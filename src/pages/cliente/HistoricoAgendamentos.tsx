import { useState } from "react";
import { useCliente } from "@/context/ClienteContext";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Star, CalendarCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusAgendamento } from "@/types/cliente";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HistoricoAgendamentos() {
  const { agendamentos, getAgendamentosPorStatus } = useCliente();
  const [filtroData, setFiltroData] = useState("");

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarData = (data: string, horario: string) => {
    try {
      return new Date(`${data}T${horario}`).toLocaleString("pt-BR");
    } catch {
      return `${data} ${horario}`;
    }
  };

  const statusConfig = {
    confirmado: { label: "Confirmado", variant: "default" as const },
    aguardando_pagamento: { label: "Aguardando Pagamento", variant: "secondary" as const },
    concluido: { label: "Concluído", variant: "outline" as const },
    cancelado: { label: "Cancelado", variant: "destructive" as const },
    reagendado: { label: "Reagendado", variant: "secondary" as const },
  };

  const agendamentosFiltrados = filtroData
    ? agendamentos.filter((a) => a.data === filtroData)
    : agendamentos;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Histórico de Agendamentos</h2>
          <p className="text-muted-foreground">
            Veja todos os seus agendamentos realizados
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
            placeholder="Filtrar por data"
            className="w-48"
          />
          <Button variant="outline" onClick={() => setFiltroData("")}>
            Limpar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="todos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="concluido">Concluídos</TabsTrigger>
          <TabsTrigger value="confirmado">Confirmados</TabsTrigger>
          <TabsTrigger value="cancelado">Cancelados</TabsTrigger>
        </TabsList>

        <TabsContent value="todos">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Horário</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agendamentosFiltrados.map((agendamento) => {
                    const status = statusConfig[agendamento.status];
                    return (
                      <TableRow key={agendamento.id}>
                        <TableCell>
                          {formatarData(agendamento.data, agendamento.horario)}
                        </TableCell>
                        <TableCell>{agendamento.servicoNome}</TableCell>
                        <TableCell>{agendamento.profissionalNome}</TableCell>
                        <TableCell>{formatarMoeda(agendamento.valor)}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {agendamento.status === "concluido" && !agendamento.avaliacao && (
                              <Button variant="ghost" size="icon" asChild>
                                <Link to={`/cliente/avaliacoes?agendamento=${agendamento.id}`}>
                                  <Star className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                            {agendamento.status === "concluido" && (
                              <Button variant="ghost" size="icon" asChild>
                                <Link to={`/cliente/agendar?reagendar=${agendamento.id}`}>
                                  <CalendarCheck className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {(["concluido", "confirmado", "cancelado"] as StatusAgendamento[]).map((status) => (
          <TabsContent key={status} value={status}>
            <Card>
              <CardHeader>
                <CardTitle>
                  {statusConfig[status].label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Horário</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getAgendamentosPorStatus(status).map((agendamento) => (
                      <TableRow key={agendamento.id}>
                        <TableCell>
                          {formatarData(agendamento.data, agendamento.horario)}
                        </TableCell>
                        <TableCell>{agendamento.servicoNome}</TableCell>
                        <TableCell>{agendamento.profissionalNome}</TableCell>
                        <TableCell>{formatarMoeda(agendamento.valor)}</TableCell>
                        <TableCell>
                          {agendamento.status === "concluido" && !agendamento.avaliacao && (
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/cliente/avaliacoes?agendamento=${agendamento.id}`}>
                                <Star className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

