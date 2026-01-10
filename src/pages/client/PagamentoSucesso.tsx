import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useCliente } from "@/context/ClienteContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Calendar, ArrowRight, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PagamentoSucesso() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getAgendamento, atualizarStatusPagamento, pagamentos } = useCliente();
  const { toast } = useToast();

  const agendamentoId = searchParams.get("agendamento");
  const paymentId = searchParams.get("payment_id");
  const status = searchParams.get("status");

  const [agendamento, setAgendamento] = useState(
    agendamentoId ? getAgendamento(agendamentoId) : undefined
  );

  useEffect(() => {
    if (agendamentoId) {
      const agendamentoData = getAgendamento(agendamentoId);
      if (agendamentoData) {
        setAgendamento(agendamentoData);

        // Atualizar status do pagamento se necessário
        if (paymentId && status === "approved") {
          const pagamento = pagamentos.find((p) => p.agendamentoId === agendamentoId);
          if (pagamento) {
            atualizarStatusPagamento(pagamento.id, "aprovado");
          }
        }
      }
    }
  }, [agendamentoId, paymentId, status, getAgendamento, pagamentos, atualizarStatusPagamento]);

  if (!agendamento) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Agendamento não encontrado
            </p>
            <Button asChild>
              <Link to="/client">Voltar para Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Pagamento Aprovado!</CardTitle>
          <CardDescription>
            Seu pagamento foi processado com sucesso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Serviço</p>
              <p className="font-medium">{agendamento.servico.nome}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Data</p>
              <p className="font-medium">
                {new Date(agendamento.data).toLocaleDateString("pt-BR")} às {agendamento.hora}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Valor Pago</p>
              <p className="text-2xl font-black text-primary">
                R$ {agendamento.servico.preco.toFixed(2).replace(".", ",")}
              </p>
            </div>
          </div>

          {paymentId && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">ID do Pagamento</p>
              <p className="text-sm font-mono">{paymentId}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/client">
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button className="flex-1" asChild>
              <Link to={`/client/agendamentos/${agendamento.id}`}>
                Ver Agendamento
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

