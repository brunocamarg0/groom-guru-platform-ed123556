import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe, createPaymentIntent } from "@/lib/stripe";
import { useCliente } from "@/context/ClienteContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MetodoPagamento } from "@/types/cliente";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Componente do formulário de pagamento com Stripe
function CheckoutForm({ agendamentoId, valor }: { agendamentoId: string; valor: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { criarPagamento, atualizarStatusPagamento } = useCliente();
  const { toast } = useToast();

  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>("cartao_credito");
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    // Carregar client secret quando o método for cartão
    if (metodoPagamento === "cartao_credito" || metodoPagamento === "cartao_debito") {
      createPaymentIntent(valor, agendamentoId).then((secret) => {
        setClientSecret(secret);
      });
    }
  }, [metodoPagamento, valor, agendamentoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Para métodos que não são cartão (PIX, Boleto), criar pagamento direto
      if (metodoPagamento === "pix" || metodoPagamento === "boleto" || metodoPagamento === "dinheiro") {
        const pagamento = criarPagamento(agendamentoId, valor, metodoPagamento);
        
        toast({
          title: "Pagamento criado",
          description: metodoPagamento === "pix" 
            ? "QR Code PIX será gerado em breve" 
            : metodoPagamento === "boleto"
            ? "Boleto será gerado em breve"
            : "Pagamento será processado no estabelecimento",
        });

        navigate(`/client/agendamentos/${agendamentoId}`);
        return;
      }

      // Para pagamento com cartão via Stripe
      if (!stripe || !elements) {
        toast({
          title: "Erro",
          description: "Stripe não está carregado. Aguarde um momento.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        toast({
          title: "Erro",
          description: "Elemento de cartão não encontrado.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Se não temos clientSecret, criar um mock para desenvolvimento
      if (!clientSecret) {
        // Em modo de desenvolvimento, simular sucesso
        toast({
          title: "Modo de Desenvolvimento",
          description: "Backend não configurado. Simulando pagamento bem-sucedido.",
        });

        const pagamento = criarPagamento(agendamentoId, valor, metodoPagamento);
        atualizarStatusPagamento(pagamento.id, "aprovado");

        setTimeout(() => {
          navigate(`/client/agendamentos/${agendamentoId}`);
        }, 1500);
        setIsProcessing(false);
        return;
      }

      // Confirmar pagamento no Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            // Adicionar dados do cliente aqui se necessário
          },
        },
      });

      if (error) {
        toast({
          title: "Erro no pagamento",
          description: error.message,
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        const pagamento = criarPagamento(agendamentoId, valor, metodoPagamento);
        pagamento.stripePaymentIntentId = paymentIntent.id;
        atualizarStatusPagamento(pagamento.id, "aprovado");

        toast({
          title: "Pagamento aprovado!",
          description: "Seu agendamento foi confirmado.",
        });

        navigate(`/client/agendamentos/${agendamentoId}`);
      }
    } catch (error) {
      toast({
        title: "Erro ao processar pagamento",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="metodo">Método de Pagamento *</Label>
        <Select
          value={metodoPagamento}
          onValueChange={(value: MetodoPagamento) => setMetodoPagamento(value)}
          disabled={isProcessing}
        >
          <SelectTrigger id="metodo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
            <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="boleto">Boleto</SelectItem>
            <SelectItem value="dinheiro">Dinheiro (no local)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(metodoPagamento === "cartao_credito" || metodoPagamento === "cartao_debito") && (
        <div className="space-y-2">
          <Label>Dados do Cartão *</Label>
          <div className="p-4 border rounded-md bg-background">
            <CardElement options={cardElementOptions} />
          </div>
          <p className="text-xs text-muted-foreground">
            Use 4242 4242 4242 4242 para testes (qualquer data futura, qualquer CVC)
          </p>
        </div>
      )}

      {metodoPagamento === "pix" && (
        <Card className="bg-muted">
          <CardHeader>
            <CardTitle className="text-lg">Pagamento via PIX</CardTitle>
            <CardDescription>
              O QR Code será gerado após confirmar o pagamento
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {metodoPagamento === "boleto" && (
        <Card className="bg-muted">
          <CardHeader>
            <CardTitle className="text-lg">Pagamento via Boleto</CardTitle>
            <CardDescription>
              O boleto será gerado após confirmar o pagamento
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {metodoPagamento === "dinheiro" && (
        <Card className="bg-muted">
          <CardHeader>
            <CardTitle className="text-lg">Pagamento no Local</CardTitle>
            <CardDescription>
              Você pagará em dinheiro quando comparecer ao estabelecimento
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/client")}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="hero"
          disabled={isProcessing || (metodoPagamento.includes("cartao") && !clientSecret)}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Finalizar Pagamento
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// Componente principal do Checkout
export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgendamento } = useCliente();
  const { toast } = useToast();

  const [agendamento, setAgendamento] = useState(
    id ? getAgendamento(id) : undefined
  );

  useEffect(() => {
    if (id) {
      const agendamentoData = getAgendamento(id);
      if (!agendamentoData) {
        toast({
          title: "Agendamento não encontrado",
          description: "O agendamento solicitado não foi encontrado.",
          variant: "destructive",
        });
        navigate("/client");
        return;
      }

      if (agendamentoData.status !== "pagamento_pendente") {
        toast({
          title: "Pagamento já processado",
          description: "Este agendamento já possui pagamento processado.",
        });
        navigate(`/client/agendamentos/${id}`);
        return;
      }

      setAgendamento(agendamentoData);
    }
  }, [id, getAgendamento, navigate, toast]);

  if (!agendamento) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const valor = agendamento.servico.preco;
  const stripePromise = getStripe();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/client">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-black uppercase">Checkout</h2>
          <p className="text-muted-foreground mt-1">
            Finalize o pagamento do seu agendamento
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Resumo do Agendamento */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Agendamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Serviço</Label>
              <p className="font-medium">{agendamento.servico.nome}</p>
              {agendamento.servico.descricao && (
                <p className="text-sm text-muted-foreground mt-1">
                  {agendamento.servico.descricao}
                </p>
              )}
            </div>

            <div>
              <Label className="text-muted-foreground">Data</Label>
              <p className="font-medium">
                {format(new Date(agendamento.data), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>

            <div>
              <Label className="text-muted-foreground">Horário</Label>
              <p className="font-medium">{agendamento.hora}</p>
            </div>

            <div>
              <Label className="text-muted-foreground">Duração</Label>
              <p className="font-medium">{agendamento.servico.duracao} minutos</p>
            </div>

            {agendamento.observacoes && (
              <div>
                <Label className="text-muted-foreground">Observações</Label>
                <p className="font-medium">{agendamento.observacoes}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Total a pagar:</span>
                <span className="text-2xl font-black text-primary">
                  R$ {valor.toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle>Pagamento</CardTitle>
            <CardDescription>
              Escolha o método de pagamento e finalize sua compra
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise}>
              <CheckoutForm agendamentoId={agendamento.id} valor={valor} />
            </Elements>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

