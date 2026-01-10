import { useState } from "react";
import { Link } from "react-router-dom";
import { useCliente } from "@/context/ClienteContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, Clock, DollarSign, MoreVertical, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { StatusAgendamento } from "@/types/cliente";

const getStatusBadge = (status: StatusAgendamento) => {
  const variants: Record<StatusAgendamento, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pendente: { label: "Pendente", variant: "outline" },
    confirmado: { label: "Confirmado", variant: "default" },
    concluido: { label: "Concluído", variant: "secondary" },
    cancelado: { label: "Cancelado", variant: "destructive" },
    pagamento_pendente: { label: "Pagamento Pendente", variant: "outline" },
    pago: { label: "Pago", variant: "default" },
  };

  const config = variants[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function ClientDashboard() {
  const { agendamentos, cliente, cancelarAgendamento } = useCliente();
  const { toast } = useToast();

  const agendamentosOrdenados = [...agendamentos].sort((a, b) => {
    const dataA = new Date(`${a.data}T${a.hora}`);
    const dataB = new Date(`${b.data}T${b.hora}`);
    return dataB.getTime() - dataA.getTime();
  });

  const proximosAgendamentos = agendamentosOrdenados.filter(
    (a) => a.status !== "cancelado" && a.status !== "concluido"
  ).slice(0, 3);

  const handleCancelarAgendamento = (id: string) => {
    cancelarAgendamento(id);
    toast({
      title: "Agendamento cancelado",
      description: "Seu agendamento foi cancelado com sucesso.",
    });
  };

  const totalGasto = agendamentos
    .filter((a) => a.status === "concluido" || a.status === "confirmado")
    .reduce((acc, a) => acc + a.servico.preco, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black uppercase">Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Bem-vindo, {cliente?.nome}
          </p>
        </div>
        <Button asChild>
          <Link to="/client/agendar">
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Link>
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Agendamentos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proximosAgendamentos.length}</div>
            <p className="text-xs text-muted-foreground">
              Agendamentos confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalGasto.toFixed(2).replace(".", ",")}
            </div>
            <p className="text-xs text-muted-foreground">
              Em serviços realizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agendamentos.length}</div>
            <p className="text-xs text-muted-foreground">
              Agendamentos realizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Agendamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Meus Agendamentos</CardTitle>
          <CardDescription>
            Veja todos os seus agendamentos e gerencie-os
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agendamentosOrdenados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum agendamento encontrado.{" "}
                    <Link to="/client/agendar" className="text-primary hover:underline">
                      Faça seu primeiro agendamento
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                agendamentosOrdenados.map((agendamento) => (
                  <TableRow key={agendamento.id}>
                    <TableCell className="font-medium">
                      {agendamento.servico.nome}
                    </TableCell>
                    <TableCell>
                      {format(new Date(agendamento.data), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>{agendamento.hora}</TableCell>
                    <TableCell>
                      R$ {agendamento.servico.preco.toFixed(2).replace(".", ",")}
                    </TableCell>
                    <TableCell>{getStatusBadge(agendamento.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/client/agendamentos/${agendamento.id}`}>
                              Ver Detalhes
                            </Link>
                          </DropdownMenuItem>
                          {agendamento.status === "pagamento_pendente" && (
                            <DropdownMenuItem asChild>
                              <Link to={`/client/checkout/${agendamento.id}`}>
                                Finalizar Pagamento
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {(agendamento.status === "pendente" ||
                            agendamento.status === "confirmado" ||
                            agendamento.status === "pagamento_pendente") && (
                            <DropdownMenuItem
                              onClick={() => handleCancelarAgendamento(agendamento.id)}
                              className="text-destructive"
                            >
                              Cancelar Agendamento
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

