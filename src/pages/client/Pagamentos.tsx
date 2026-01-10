import { useCliente } from "@/context/ClienteContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";
import { CreditCard, Calendar, DollarSign, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StatusPagamento, MetodoPagamento } from "@/types/cliente";

const getStatusBadge = (status: StatusPagamento) => {
  const variants: Record<
    StatusPagamento,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    pendente: { label: "Pendente", variant: "outline" },
    processando: { label: "Processando", variant: "outline" },
    aprovado: { label: "Aprovado", variant: "default" },
    recusado: { label: "Recusado", variant: "destructive" },
    reembolsado: { label: "Reembolsado", variant: "secondary" },
  };

  const config = variants[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getMetodoLabel = (metodo: MetodoPagamento): string => {
  const labels: Record<MetodoPagamento, string> = {
    cartao_credito: "Cartão de Crédito",
    cartao_debito: "Cartão de Débito",
    pix: "PIX",
    boleto: "Boleto",
    dinheiro: "Dinheiro",
  };
  return labels[metodo];
};

export default function Pagamentos() {
  const { pagamentos, agendamentos } = useCliente();

  const pagamentosComAgendamento = pagamentos.map((pagamento) => {
    const agendamento = agendamentos.find(
      (a) => a.id === pagamento.agendamentoId
    );
    return { pagamento, agendamento };
  });

  const pagamentosOrdenados = [...pagamentosComAgendamento].sort((a, b) => {
    return (
      new Date(b.pagamento.createdAt).getTime() -
      new Date(a.pagamento.createdAt).getTime()
    );
  });

  const totalPago = pagamentos
    .filter((p) => p.status === "aprovado")
    .reduce((acc, p) => acc + p.valor, 0);

  const pagamentosPendentes = pagamentos.filter(
    (p) => p.status === "pendente" || p.status === "processando"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black uppercase">Pagamentos</h2>
        <p className="text-muted-foreground mt-1">
          Histórico completo dos seus pagamentos
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalPago.toFixed(2).replace(".", ",")}
            </div>
            <p className="text-xs text-muted-foreground">
              Em pagamentos aprovados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagamentosPendentes}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando processamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pagamentos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagamentos.length}</div>
            <p className="text-xs text-muted-foreground">
              Pagamentos realizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>
            Lista completa dos seus pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agendamento</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagamentosOrdenados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum pagamento encontrado.{" "}
                    <Link to="/client/agendar" className="text-primary hover:underline">
                      Faça seu primeiro agendamento
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                pagamentosOrdenados.map(({ pagamento, agendamento }) => (
                  <TableRow key={pagamento.id}>
                    <TableCell className="font-medium">
                      {agendamento ? (
                        <Link
                          to={`/client/agendamentos/${agendamento.id}`}
                          className="text-primary hover:underline"
                        >
                          {agendamento.servico.nome}
                        </Link>
                      ) : (
                        "Agendamento não encontrado"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        {getMetodoLabel(pagamento.metodo)}
                      </div>
                    </TableCell>
                    <TableCell>
                      R$ {pagamento.valor.toFixed(2).replace(".", ",")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(pagamento.createdAt), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(pagamento.status)}</TableCell>
                    <TableCell className="text-right">
                      {agendamento && (
                        <Link
                          to={`/client/agendamentos/${agendamento.id}`}
                          className="text-primary hover:underline text-sm"
                        >
                          Ver Detalhes
                        </Link>
                      )}
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

