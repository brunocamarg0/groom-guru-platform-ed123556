import { useParams, Link, useNavigate } from "react-router-dom";
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
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calendar, Clock, DollarSign, MapPin, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { StatusAgendamento } from "@/types/cliente";
import { useBarbearias } from "@/context/BarbeariasContext";

const getStatusBadge = (status: StatusAgendamento) => {
  const variants: Record<
    StatusAgendamento,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
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

export default function DetalhesAgendamento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgendamento, cancelarAgendamento } = useCliente();
  const { getBarbearia } = useBarbearias();
  const { toast } = useToast();

  const agendamento = id ? getAgendamento(id) : undefined;

  if (!agendamento) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/cliente">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-black uppercase">Agendamento não encontrado</h2>
          </div>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            O agendamento solicitado não foi encontrado.
          </CardContent>
        </Card>
      </div>
    );
  }

  const barbearia = getBarbearia(agendamento.barbeariaId);
  const pagamento = useCliente().pagamentos.find((p) => p.agendamentoId === agendamento.id);

  const handleCancelar = () => {
    if (window.confirm("Tem certeza que deseja cancelar este agendamento?")) {
      cancelarAgendamento(agendamento.id);
      toast({
        title: "Agendamento cancelado",
        description: "Seu agendamento foi cancelado com sucesso.",
      });
      navigate("/cliente");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/cliente">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-black uppercase">Detalhes do Agendamento</h2>
            <p className="text-muted-foreground mt-1">
              Informações completas do seu agendamento
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {agendamento.status === "pagamento_pendente" && (
            <Button asChild>
              <Link to={`/cliente/checkout/${agendamento.id}`}>
                Finalizar Pagamento
              </Link>
            </Button>
          )}
          {(agendamento.status === "pendente" ||
            agendamento.status === "confirmado" ||
            agendamento.status === "pagamento_pendente") && (
            <Button variant="destructive" onClick={handleCancelar}>
              Cancelar Agendamento
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Informações do Agendamento */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Agendamento</CardTitle>
            <CardDescription>Detalhes do serviço agendado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label className="text-muted-foreground">Status</Label>
              </div>
              {getStatusBadge(agendamento.status)}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Label className="text-muted-foreground">Serviço</Label>
              </div>
              <p className="font-medium text-lg">{agendamento.servico.nome}</p>
              {agendamento.servico.descricao && (
                <p className="text-sm text-muted-foreground mt-1">
                  {agendamento.servico.descricao}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label className="text-muted-foreground">Data</Label>
              </div>
              <p className="font-medium">
                {format(new Date(agendamento.data), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label className="text-muted-foreground">Horário</Label>
              </div>
              <p className="font-medium">{agendamento.hora}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label className="text-muted-foreground">Duração</Label>
              </div>
              <p className="font-medium">{agendamento.servico.duracao} minutos</p>
            </div>

            {agendamento.observacoes && (
              <div>
                <Label className="text-muted-foreground">Observações</Label>
                <p className="font-medium mt-1">{agendamento.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações da Barbearia e Pagamento */}
        <div className="space-y-6">
          {/* Barbearia */}
          <Card>
            <CardHeader>
              <CardTitle>Barbearia</CardTitle>
              <CardDescription>Local do atendimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {barbearia ? (
                <>
                  <div>
                    <Label className="text-muted-foreground">Nome</Label>
                    <p className="font-medium">{barbearia.nome}</p>
                  </div>
                  {barbearia.endereco && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-muted-foreground">Endereço</Label>
                      </div>
                      <p className="font-medium">{barbearia.endereco}</p>
                    </div>
                  )}
                  {barbearia.telefone && (
                    <div>
                      <Label className="text-muted-foreground">Telefone</Label>
                      <p className="font-medium">{barbearia.telefone}</p>
                    </div>
                  )}
                  {barbearia.email && (
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{barbearia.email}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">Barbearia não encontrada</p>
              )}
            </CardContent>
          </Card>

          {/* Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Pagamento</CardTitle>
              <CardDescription>Informações do pagamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-muted-foreground">Valor</Label>
                </div>
                <p className="text-2xl font-black text-primary">
                  R$ {agendamento.servico.preco.toFixed(2).replace(".", ",")}
                </p>
              </div>

              {pagamento ? (
                <>
                  <div>
                    <Label className="text-muted-foreground">Método</Label>
                    <p className="font-medium capitalize">
                      {pagamento.metodo.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status do Pagamento</Label>
                    <Badge
                      variant={
                        pagamento.status === "aprovado"
                          ? "default"
                          : pagamento.status === "recusado"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {pagamento.status.charAt(0).toUpperCase() +
                        pagamento.status.slice(1)}
                    </Badge>
                  </div>
                </>
              ) : agendamento.status === "pagamento_pendente" ? (
                <div className="pt-4">
                  <Button asChild className="w-full">
                    <Link to={`/cliente/checkout/${agendamento.id}`}>
                      Finalizar Pagamento
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Pagamento não encontrado
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

