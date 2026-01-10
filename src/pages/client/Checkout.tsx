import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { mercadopagoService, PaymentItem, CustomerData } from "@/services/mercadopagoService";
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
import { ArrowLeft, CreditCard, Loader2, QrCode, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MetodoPagamento } from "@/types/cliente";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Componente do formulário de pagamento com Mercado Pago
function CheckoutForm({ agendamentoId, valor }: { agendamentoId: string; valor: number }) {
  const navigate = useNavigate();
  const { criarPagamento, atualizarStatusPagamento, getAgendamento, cliente } = useCliente();
  const { toast } = useToast();

  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>("cartao_credito");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixBase64, setPixBase64] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const agendamento = getAgendamento(agendamentoId);

  // Verificar se Mercado Pago está configurado
  const isConfigured = mercadopagoService.isConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      if (!agendamento || !cliente) {
        toast({
          title: "Erro",
          description: "Dados do agendamento ou cliente não encontrados.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (!isConfigured) {
        toast({
          title: "Mercado Pago não configurado",
          description: "Configure VITE_MERCADOPAGO_ACCESS_TOKEN nas variáveis de ambiente.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Preparar dados do cliente
      const customerData: CustomerData = {
        name: cliente.nome,
        email: cliente.email,
        phone: cliente.telefone,
        address: "", // Pode ser preenchido se disponível
        city: "",
        zipCode: "",
      };

      // Preparar itens para pagamento
      const items: PaymentItem[] = [
        {
          id: agendamento.servicoId,
          title: agendamento.servico.nome,
          quantity: 1,
          unit_price: valor,
          currency_id: "BRL",
          description: agendamento.servico.descricao,
        },
      ];

      // Se for PIX, gerar QR Code
      if (metodoPagamento === "pix") {
        toast({
          title: "Gerando QR Code PIX...",
          description: "Aguarde um momento.",
        });

        const pixResponse = await mercadopagoService.generatePixPayment(
          valor,
          customerData,
          agendamentoId
        );

        if (!pixResponse.success || !pixResponse.qrCode) {
          throw new Error(pixResponse.error || "Erro ao gerar QR Code PIX");
        }

        // Criar registro de pagamento local
        const pagamento = criarPagamento(agendamentoId, valor, "pix");
        pagamento.pixQrCode = pixResponse.qrCode;
        pagamento.pixExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutos

        setPixQrCode(pixResponse.qrCode);
        setPixBase64(pixResponse.qrCodeBase64 || null);

        toast({
          title: "QR Code PIX gerado!",
          description: "Escaneie o QR Code para pagar.",
        });

        setIsProcessing(false);
        return;
      }

      // Se for dinheiro, criar registro local
      if (metodoPagamento === "dinheiro") {
        criarPagamento(agendamentoId, valor, "dinheiro");
        toast({
          title: "Agendamento confirmado",
          description: "Você pagará em dinheiro no estabelecimento.",
        });
        navigate(`/client/agendamentos/${agendamentoId}`);
        setIsProcessing(false);
        return;
      }

      // Para cartão de crédito/débito ou boleto, criar preferência de pagamento
      toast({
        title: "Redirecionando para o Mercado Pago...",
        description: "Você será redirecionado para finalizar o pagamento.",
      });

      const paymentResponse = await mercadopagoService.createPaymentPreference(
        items,
        customerData,
        agendamentoId
      );

      if (!paymentResponse.success || !paymentResponse.initPoint) {
        throw new Error(paymentResponse.error || "Erro ao criar pagamento");
      }

      // Criar registro de pagamento local
      const pagamento = criarPagamento(agendamentoId, valor, metodoPagamento);
      
      // Redirecionar para o checkout do Mercado Pago
      setPaymentUrl(paymentResponse.initPoint);
      
      // Redirecionar após um breve delay
      setTimeout(() => {
        window.location.href = paymentResponse.initPoint!;
      }, 1500);

    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      toast({
        title: "Erro ao processar pagamento",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  // Se PIX foi gerado, mostrar QR Code
  if (pixQrCode) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              PIX - Pagamento Instantâneo
            </CardTitle>
            <CardDescription>
              Escaneie o QR Code com o app do seu banco para pagar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pixBase64 ? (
              <div className="flex justify-center">
                <img
                  src={`data:image/png;base64,${pixBase64}`}
                  alt="QR Code PIX"
                  className="border-2 border-border rounded-lg p-4 bg-white max-w-xs"
                />
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-border rounded-lg text-center">
                <p className="font-mono text-sm break-all bg-muted p-4 rounded">
                  {pixQrCode}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Copie o código acima e cole no app do seu banco
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Valor</Label>
              <p className="text-2xl font-black text-primary">
                R$ {valor.toFixed(2).replace(".", ",")}
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setPixQrCode(null);
                  setPixBase64(null);
                }}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={() => navigate(`/client/agendamentos/${agendamentoId}`)}
                className="flex-1"
              >
                Ver Agendamento
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se payment URL foi criada, mostrar mensagem de redirecionamento
  if (paymentUrl) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Redirecionando para o Mercado Pago...</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Você será redirecionado em instantes para finalizar o pagamento.
            </p>
            <Button
              onClick={() => (window.location.href = paymentUrl)}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Ir para o Mercado Pago agora
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!isConfigured && (
        <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Mercado Pago não configurado:</strong> Configure a variável{" "}
              <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">
                VITE_MERCADOPAGO_ACCESS_TOKEN
              </code>{" "}
              para ativar pagamentos reais.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <Label htmlFor="metodo">Método de Pagamento *</Label>
        <Select
          value={metodoPagamento}
          onValueChange={(value: MetodoPagamento) => setMetodoPagamento(value)}
          disabled={isProcessing || !isConfigured}
        >
          <SelectTrigger id="metodo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cartao_credito">Cartão de Crédito (Mercado Pago)</SelectItem>
            <SelectItem value="cartao_debito">Cartão de Débito (Mercado Pago)</SelectItem>
            <SelectItem value="pix">PIX (Pagamento Instantâneo)</SelectItem>
            <SelectItem value="boleto">Boleto Bancário (Mercado Pago)</SelectItem>
            <SelectItem value="dinheiro">Dinheiro (no local)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(metodoPagamento === "cartao_credito" || metodoPagamento === "cartao_debito") && (
        <Card className="bg-muted">
          <CardHeader>
            <CardTitle className="text-lg">Pagamento com Cartão</CardTitle>
            <CardDescription>
              Você será redirecionado para o checkout seguro do Mercado Pago
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✅ Pagamento 100% seguro</li>
              <li>✅ Aceita cartões de crédito e débito</li>
              <li>✅ Parcelamento em até 12x</li>
              <li>✅ Confirmação imediata</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {metodoPagamento === "pix" && (
        <Card className="bg-muted">
          <CardHeader>
            <CardTitle className="text-lg">Pagamento via PIX</CardTitle>
            <CardDescription>
              Um QR Code será gerado para você pagar instantaneamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✅ Pagamento instantâneo</li>
              <li>✅ Sem taxas para você</li>
              <li>✅ Confirmação automática</li>
              <li>✅ QR Code válido por 30 minutos</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {metodoPagamento === "boleto" && (
        <Card className="bg-muted">
          <CardHeader>
            <CardTitle className="text-lg">Pagamento via Boleto</CardTitle>
            <CardDescription>
              Um boleto será gerado para você pagar no banco ou app do banco
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✅ Vencimento em 3 dias úteis</li>
              <li>✅ Pode ser pago em qualquer banco</li>
              <li>✅ Confirmação após compensação</li>
            </ul>
          </CardContent>
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
          disabled={isProcessing || !isConfigured}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : metodoPagamento === "pix" ? (
            <>
              <QrCode className="h-4 w-4 mr-2" />
              Gerar QR Code PIX
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
            <CheckoutForm agendamentoId={agendamento.id} valor={valor} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
