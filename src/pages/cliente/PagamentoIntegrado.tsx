import { useState } from "react";
import { useCliente } from "@/context/ClienteContext";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Wallet, QrCode, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MetodoPagamento } from "@/types/cliente";

export default function PagamentoIntegrado() {
  const { agendamentos, realizarPagamento, cliente } = useCliente();
  const { toast } = useToast();
  const [metodoSelecionado, setMetodoSelecionado] = useState<MetodoPagamento>("pix");
  const [cupom, setCupom] = useState("");

  const agendamentosPendentes = agendamentos.filter(
    (a) => a.status === "aguardando_pagamento" || !a.pagamento
  );

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const handlePagar = (agendamentoId: string, valor: number) => {
    let valorFinal = valor;
    let desconto = 0;

    // Aplicar cupom se houver
    if (cupom === "BEMVINDO20") {
      desconto = valor * 0.2;
      valorFinal = valor - desconto;
    }

    // Aplicar créditos se houver
    if (cliente.creditos > 0 && metodoSelecionado === "creditos") {
      valorFinal = Math.max(0, valorFinal - cliente.creditos);
    }

    realizarPagamento(agendamentoId, {
      valor: valorFinal,
      metodo: metodoSelecionado,
      status: "pago",
      dataPagamento: new Date().toISOString(),
      cupomDesconto: cupom || undefined,
      cashbackGerado: valorFinal * 0.05, // 5% cashback
    });

    toast({
      title: "Pagamento realizado!",
      description: "Seu pagamento foi processado com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Pagamentos</h2>
        <p className="text-muted-foreground">
          Gerencie seus pagamentos de agendamentos
        </p>
      </div>

      {agendamentosPendentes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Nenhum pagamento pendente no momento
            </p>
          </CardContent>
        </Card>
      ) : (
        agendamentosPendentes.map((agendamento) => (
          <Card key={agendamento.id}>
            <CardHeader>
              <CardTitle>Agendamento #{agendamento.id.slice(0, 6)}</CardTitle>
              <CardDescription>
                {agendamento.servicoNome} • {agendamento.profissionalNome}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="text-lg font-medium">Valor Total:</span>
                <span className="text-2xl font-bold">
                  {formatarMoeda(agendamento.valor)}
                </span>
              </div>

              <div className="space-y-2">
                <Label>Cupom de Desconto</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite o cupom"
                    value={cupom}
                    onChange={(e) => setCupom(e.target.value.toUpperCase())}
                  />
                  <Button variant="outline">Aplicar</Button>
                </div>
                {cupom === "BEMVINDO20" && (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Cupom aplicado! 20% de desconto
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label>Método de Pagamento</Label>
                <RadioGroup
                  value={metodoSelecionado}
                  onValueChange={(value) => setMetodoSelecionado(value as MetodoPagamento)}
                >
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="pix" id="pix" />
                      <Label htmlFor="pix" className="flex-1 cursor-pointer flex items-center gap-2">
                        <QrCode className="h-4 w-4" />
                        PIX
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="cartao_credito" id="cartao" />
                      <Label htmlFor="cartao" className="flex-1 cursor-pointer flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Cartão de Crédito
                      </Label>
                    </div>
                    {cliente.creditos > 0 && (
                      <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                        <RadioGroupItem value="creditos" id="creditos" />
                        <Label htmlFor="creditos" className="flex-1 cursor-pointer flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          Créditos ({formatarMoeda(cliente.creditos)})
                        </Label>
                      </div>
                    )}
                  </div>
                </RadioGroup>
              </div>

              <Button
                className="w-full"
                onClick={() => handlePagar(agendamento.id, agendamento.valor)}
              >
                Pagar {formatarMoeda(agendamento.valor)}
              </Button>
            </CardContent>
          </Card>
        ))
      )}

      {/* Histórico de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {agendamentos
              .filter((a) => a.pagamento && a.pagamento.status === "pago")
              .map((agendamento) => (
                <div
                  key={agendamento.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{agendamento.servicoNome}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(agendamento.data).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatarMoeda(agendamento.pagamento!.valor)}</p>
                    <Badge variant="default" className="text-xs">
                      {agendamento.pagamento!.status}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



