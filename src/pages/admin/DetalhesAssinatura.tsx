import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { usePlanos } from "@/context/PlanosContext";
import { useBarbearias } from "@/context/BarbeariasContext";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Calendar, DollarSign, CreditCard, RefreshCw } from "lucide-react";
import { StatusAssinatura, Pagamento } from "@/types/plano";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<
  StatusAssinatura,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  em_dia: { label: "Em Dia", variant: "default" },
  atrasado: { label: "Atrasado", variant: "destructive" },
  cancelado: { label: "Cancelado", variant: "outline" },
  vencido: { label: "Vencido", variant: "destructive" },
};

export default function DetalhesAssinatura() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAssinatura, atualizarStatusAssinatura, trocarPlano, adicionarPagamento, planos } =
    usePlanos();
  const { getBarbearia } = useBarbearias();
  const toast = useToast();
  const [isDialogPagamentoOpen, setIsDialogPagamentoOpen] = useState(false);
  const [isDialogTrocaPlanoOpen, setIsDialogTrocaPlanoOpen] = useState(false);
  const [pagamentoData, setPagamentoData] = useState({
    valor: 0,
    dataPagamento: new Date().toISOString().split("T")[0],
    dataVencimento: "",
    metodoPagamento: "",
  });
  const [novoPlanoId, setNovoPlanoId] = useState("");

  const assinatura = id ? getAssinatura(id) : undefined;
  const barbearia = assinatura ? getBarbearia(assinatura.barbeariaId) : undefined;

  useEffect(() => {
    if (assinatura) {
      setPagamentoData({
        ...pagamentoData,
        valor: assinatura.valorMensal,
        dataVencimento: assinatura.proximoVencimento,
      });
    }
  }, [assinatura]);

  if (!assinatura) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Assinatura não encontrada</p>
          <Button onClick={() => navigate("/admin/assinaturas")} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarData = (data: string) => {
    try {
      return new Date(data).toLocaleDateString("pt-BR");
    } catch {
      return data;
    }
  };

  const handleAtualizarStatus = (status: StatusAssinatura) => {
    atualizarStatusAssinatura(assinatura.id, status);
    toast({
      title: "Status atualizado",
      description: `Assinatura ${statusConfig[status].label.toLowerCase()} com sucesso.`,
    });
  };

  const handleAdicionarPagamento = () => {
    adicionarPagamento(assinatura.id, {
      valor: pagamentoData.valor,
      dataPagamento: pagamentoData.dataPagamento,
      dataVencimento: pagamentoData.dataVencimento,
      status: "pago",
      metodoPagamento: pagamentoData.metodoPagamento,
    });
    toast({
      title: "Pagamento registrado",
      description: "Pagamento adicionado com sucesso.",
    });
    setIsDialogPagamentoOpen(false);
    setPagamentoData({
      valor: assinatura.valorMensal,
      dataPagamento: new Date().toISOString().split("T")[0],
      dataVencimento: assinatura.proximoVencimento,
      metodoPagamento: "",
    });
  };

  const handleTrocarPlano = () => {
    if (!novoPlanoId) {
      toast({
        title: "Erro",
        description: "Selecione um plano.",
        variant: "destructive",
      });
      return;
    }

    trocarPlano({
      assinaturaId: assinatura.id,
      novoPlanoId,
      dataEfetivacao: new Date().toISOString().split("T")[0],
    });
    toast({
      title: "Plano alterado",
      description: "Plano alterado com sucesso.",
    });
    setIsDialogTrocaPlanoOpen(false);
    setNovoPlanoId("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/assinaturas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Detalhes da Assinatura
          </h2>
          <p className="text-muted-foreground">
            Informações completas da assinatura
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações da Assinatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Barbearia</Label>
              <p className="font-medium">{assinatura.barbeariaNome}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Plano Atual</Label>
              <p className="font-medium">{assinatura.planoNome}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">
                <Badge variant={statusConfig[assinatura.status].variant}>
                  {statusConfig[assinatura.status].label}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Valor Mensal</Label>
              <p className="font-medium text-lg">
                {formatarMoeda(assinatura.valorMensal)}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Data de Início</Label>
              <p className="font-medium">{formatarData(assinatura.dataInicio)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Próximo Vencimento</Label>
              <p className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatarData(assinatura.proximoVencimento)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Dialog
              open={isDialogPagamentoOpen}
              onOpenChange={setIsDialogPagamentoOpen}
            >
              <DialogTrigger asChild>
                <Button className="w-full" variant="default">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Registrar Pagamento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Pagamento</DialogTitle>
                  <DialogDescription>
                    Adicione um novo pagamento para esta assinatura
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      value={pagamentoData.valor}
                      onChange={(e) =>
                        setPagamentoData({
                          ...pagamentoData,
                          valor: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataPagamento">Data do Pagamento</Label>
                    <Input
                      id="dataPagamento"
                      type="date"
                      value={pagamentoData.dataPagamento}
                      onChange={(e) =>
                        setPagamentoData({
                          ...pagamentoData,
                          dataPagamento: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataVencimento">Data de Vencimento</Label>
                    <Input
                      id="dataVencimento"
                      type="date"
                      value={pagamentoData.dataVencimento}
                      onChange={(e) =>
                        setPagamentoData({
                          ...pagamentoData,
                          dataVencimento: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metodoPagamento">Método de Pagamento</Label>
                    <Input
                      id="metodoPagamento"
                      value={pagamentoData.metodoPagamento}
                      onChange={(e) =>
                        setPagamentoData({
                          ...pagamentoData,
                          metodoPagamento: e.target.value,
                        })
                      }
                      placeholder="Ex: Cartão de Crédito, PIX, Boleto..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogPagamentoOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleAdicionarPagamento}>
                    Registrar Pagamento
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isDialogTrocaPlanoOpen}
              onOpenChange={setIsDialogTrocaPlanoOpen}
            >
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Trocar Plano
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Trocar Plano</DialogTitle>
                  <DialogDescription>
                    Selecione o novo plano para esta assinatura
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="novoPlano">Novo Plano</Label>
                    <Select value={novoPlanoId} onValueChange={setNovoPlanoId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um plano" />
                      </SelectTrigger>
                      <SelectContent>
                        {planos
                          .filter((p) => p.id !== assinatura.planoId && p.ativo)
                          .map((plano) => (
                            <SelectItem key={plano.id} value={plano.id}>
                              {plano.nome} - {formatarMoeda(plano.valorMensal)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogTrocaPlanoOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleTrocarPlano}>Confirmar Troca</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="space-y-2">
              <Label>Alterar Status</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(statusConfig) as StatusAssinatura[]).map(
                  (status) => (
                    <Button
                      key={status}
                      variant={
                        assinatura.status === status ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleAtualizarStatus(status)}
                    >
                      {statusConfig[status].label}
                    </Button>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>
            Lista de todos os pagamentos realizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data do Pagamento</TableHead>
                <TableHead>Data de Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assinatura.pagamentos.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    Nenhum pagamento registrado
                  </TableCell>
                </TableRow>
              ) : (
                assinatura.pagamentos.map((pagamento) => (
                  <TableRow key={pagamento.id}>
                    <TableCell>{formatarData(pagamento.dataPagamento)}</TableCell>
                    <TableCell>{formatarData(pagamento.dataVencimento)}</TableCell>
                    <TableCell>{formatarMoeda(pagamento.valor)}</TableCell>
                    <TableCell>{pagamento.metodoPagamento || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          pagamento.status === "pago"
                            ? "default"
                            : pagamento.status === "atrasado"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {pagamento.status === "pago"
                          ? "Pago"
                          : pagamento.status === "atrasado"
                          ? "Atrasado"
                          : pagamento.status === "pendente"
                          ? "Pendente"
                          : "Cancelado"}
                      </Badge>
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

