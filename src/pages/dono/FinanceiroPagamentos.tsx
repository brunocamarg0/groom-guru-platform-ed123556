import { useState, useMemo } from "react";
import { format } from "date-fns";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  DollarSign,
  CreditCard,
  Wallet,
  QrCode,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Plus,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function FinanceiroPagamentos() {
  const { pagamentos, agendamentos, registrarPagamentoManual } = useDono();
  const [dataInicio, setDataInicio] = useState(
    new Date(new Date().setDate(1)).toISOString().split("T")[0]
  );
  const [dataFim, setDataFim] = useState(new Date().toISOString().split("T")[0]);
  const [filtroMetodo, setFiltroMetodo] = useState("todos");
  const [modalPagamento, setModalPagamento] = useState(false);
  const [isRegistrando, setIsRegistrando] = useState(false);
  const [formPagamento, setFormPagamento] = useState({
    agendamentoId: "",
    valor: "",
    metodo: "dinheiro" as "dinheiro" | "pix" | "cartao_credito" | "cartao_debito",
    observacao: "",
  });

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  // Evita bug de fuso: `new Date('YYYY-MM-DD')` é interpretado como UTC e pode voltar 1 dia no Brasil.
  const parseDateOnlyToSafeDate = (value: string) => {
    if (!value) return new Date(NaN);
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [ano, mes, dia] = value.split("-").map(Number);
      return new Date(Date.UTC(ano, mes - 1, dia, 12, 0, 0));
    }
    return new Date(value);
  };

  // Agendamentos sem pagamento (para o modal)
  // Filtra apenas agendamentos com id válido para evitar erro no Select.Item
  const agendamentosSemPagamento = useMemo(() => {
    console.log('📋 [FINANCEIRO] Total de agendamentos no contexto:', agendamentos.length);
    console.log('📋 [FINANCEIRO] Agendamentos:', agendamentos.map(a => ({ id: a.id, status: a.status, cliente: a.clienteNome, valor: a.valor })));
    console.log('💰 [FINANCEIRO] Total de pagamentos:', pagamentos.length);
    
    const agendamentosComPagamento = new Set(pagamentos.map(p => p.agendamentoId));
    console.log('💰 [FINANCEIRO] IDs de agendamentos com pagamento:', Array.from(agendamentosComPagamento));
    
    const filtrados = agendamentos.filter(a => 
      a.id && // Garante que o id existe e não é vazio
      a.id.trim() !== '' && // Garante que o id não é string vazia
      !agendamentosComPagamento.has(a.id) && 
      (a.status === "confirmado" || a.status === "concluido" || a.status === "pendente")
    );
    
    console.log('✅ [FINANCEIRO] Agendamentos sem pagamento (filtrados):', filtrados.length);
    console.log('✅ [FINANCEIRO] Detalhes:', filtrados.map(a => ({ id: a.id, status: a.status, cliente: a.clienteNome, servico: a.servicoNome, valor: a.valor })));
    
    return filtrados;
  }, [agendamentos, pagamentos]);

  const handleRegistrarPagamento = async () => {
    // Validações
    if (!formPagamento.agendamentoId) {
      toast.error("Selecione um agendamento");
      return;
    }
    if (!formPagamento.valor || parseFloat(formPagamento.valor) <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    setIsRegistrando(true);
    try {
      await registrarPagamentoManual(
        formPagamento.agendamentoId,
        parseFloat(formPagamento.valor),
        formPagamento.metodo,
        formPagamento.observacao || undefined
      );
      
      // Limpar formulário e fechar modal
      setFormPagamento({
        agendamentoId: "",
        valor: "",
        metodo: "dinheiro",
        observacao: "",
      });
      setModalPagamento(false);
    } catch (error: any) {
      // Erro já foi tratado no contexto
      console.error("Erro ao registrar pagamento:", error);
    } finally {
      setIsRegistrando(false);
    }
  };

  // Quando selecionar um agendamento, preencher o valor automaticamente
  const handleAgendamentoChange = (agendamentoId: string) => {
    const agendamento = agendamentos.find(a => a.id === agendamentoId);
    if (agendamento) {
      setFormPagamento({
        ...formPagamento,
        agendamentoId,
        valor: agendamento.valor.toString(),
      });
    } else {
      setFormPagamento({
        ...formPagamento,
        agendamentoId,
        valor: "",
      });
    }
  };

  // Filtrar pagamentos por período
  const pagamentosFiltrados = useMemo(() => {
    let filtrados = pagamentos.filter((p) => {
      const dataPagamento = p.dataPagamento ? p.dataPagamento.split("T")[0] : null;
      if (!dataPagamento) return true;
      return dataPagamento >= dataInicio && dataPagamento <= dataFim;
    });

    if (filtroMetodo !== "todos") {
      filtrados = filtrados.filter((p) => p.metodo === filtroMetodo);
    }

    return filtrados;
  }, [pagamentos, dataInicio, dataFim, filtroMetodo]);

  // Totais por método
  const pagamentosPix = pagamentosFiltrados.filter((p) => p.metodo === "pix");
  const pagamentosCartaoCredito = pagamentosFiltrados.filter((p) => p.metodo === "cartao_credito");
  const pagamentosCartaoDebito = pagamentosFiltrados.filter((p) => p.metodo === "cartao_debito");
  const pagamentosDinheiro = pagamentosFiltrados.filter((p) => p.metodo === "dinheiro");
  const pagamentosPendentes = pagamentosFiltrados.filter((p) => p.status === "pendente");

  // Calcular totais reais dos pagamentos
  const totalPix = pagamentosPix.reduce((sum, p) => sum + p.valor, 0);
  const totalCartaoCredito = pagamentosCartaoCredito.reduce((sum, p) => sum + p.valor, 0);
  const totalCartaoDebito = pagamentosCartaoDebito.reduce((sum, p) => sum + p.valor, 0);
  const totalDinheiro = pagamentosDinheiro.reduce((sum, p) => sum + p.valor, 0);
  const totalGeral = totalPix + totalCartaoCredito + totalCartaoDebito + totalDinheiro;
  const totalPendente = pagamentosPendentes.reduce((sum, p) => sum + p.valor, 0);

  // Taxa de gateway estimada
  const taxaGatewayTotal = pagamentosFiltrados.reduce((sum, p) => sum + (p.taxaGateway || 0), 0);

  const handleExportarCSV = () => {
    const headers = ["Data", "Método", "Valor", "Status", "Taxa Gateway"];
    const rows = pagamentosFiltrados.map((p) => [
      p.dataPagamento ? new Date(p.dataPagamento).toLocaleDateString("pt-BR") : "-",
      p.metodo,
      p.valor.toFixed(2),
      p.status,
      (p.taxaGateway || 0).toFixed(2),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `financeiro_${dataInicio}_${dataFim}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Relatório exportado com sucesso!");
  };

  const renderTabela = (pagamentosLista: typeof pagamentos) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Método</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Taxa Gateway</TableHead>
          <TableHead>Líquido</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pagamentosLista.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              Nenhum pagamento encontrado
            </TableCell>
          </TableRow>
        ) : (
          pagamentosLista.map((pagamento) => (
            <TableRow key={pagamento.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {pagamento.dataPagamento
                    ? new Date(pagamento.dataPagamento).toLocaleDateString("pt-BR")
                    : "-"}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="gap-1">
                  {pagamento.metodo === "pix" && <QrCode className="h-3 w-3" />}
                  {pagamento.metodo === "cartao_credito" && <CreditCard className="h-3 w-3" />}
                  {pagamento.metodo === "cartao_debito" && <CreditCard className="h-3 w-3" />}
                  {pagamento.metodo === "dinheiro" && <Wallet className="h-3 w-3" />}
                  {pagamento.metodo === "pix" ? "PIX" :
                    pagamento.metodo === "cartao_credito" ? "Crédito" :
                      pagamento.metodo === "cartao_debito" ? "Débito" : "Dinheiro"}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                {formatarMoeda(pagamento.valor)}
              </TableCell>
              <TableCell className="text-red-600">
                {pagamento.taxaGateway ? `-${formatarMoeda(pagamento.taxaGateway)}` : "-"}
              </TableCell>
              <TableCell className="font-medium text-green-600">
                {formatarMoeda(pagamento.valor - (pagamento.taxaGateway || 0))}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    pagamento.status === "pago"
                      ? "default"
                      : pagamento.status === "pendente"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {pagamento.status === "pago" ? "Pago" :
                    pagamento.status === "pendente" ? "Pendente" : "Reembolsado"}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Financeiro & Pagamentos</h2>
          <p className="text-muted-foreground">
            Controle financeiro completo da sua barbearia
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setModalPagamento(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Pagamento
          </Button>
          <Button variant="outline" onClick={handleExportarCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="space-y-2">
              <Label>Método de Pagamento</Label>
              <Select value={filtroMetodo} onValueChange={setFiltroMetodo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setDataInicio(new Date(new Date().setDate(1)).toISOString().split("T")[0]);
                  setDataFim(new Date().toISOString().split("T")[0]);
                  setFiltroMetodo("todos");
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(totalGeral)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pagamentosFiltrados.length} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PIX</CardTitle>
            <QrCode className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatarMoeda(totalPix)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pagamentosPix.length} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cartão</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatarMoeda(totalCartaoCredito + totalCartaoDebito)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pagamentosCartaoCredito.length + pagamentosCartaoDebito.length} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dinheiro</CardTitle>
            <Wallet className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatarMoeda(totalDinheiro)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pagamentosDinheiro.length} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatarMoeda(totalPendente)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pagamentosPendentes.length} pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Líquido */}
      {taxaGatewayTotal > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Bruto</p>
                <p className="text-2xl font-bold">{formatarMoeda(totalGeral)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxas de Gateway</p>
                <p className="text-2xl font-bold text-red-600">-{formatarMoeda(taxaGatewayTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Líquido</p>
                <p className="text-2xl font-bold text-green-600">{formatarMoeda(totalGeral - taxaGatewayTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabelas por Aba */}
      <Tabs defaultValue="todos">
        <TabsList>
          <TabsTrigger value="todos">
            Todos ({pagamentosFiltrados.length})
          </TabsTrigger>
          <TabsTrigger value="pix">
            PIX ({pagamentosPix.length})
          </TabsTrigger>
          <TabsTrigger value="cartao">
            Cartão ({pagamentosCartaoCredito.length + pagamentosCartaoDebito.length})
          </TabsTrigger>
          <TabsTrigger value="dinheiro">
            Dinheiro ({pagamentosDinheiro.length})
          </TabsTrigger>
          <TabsTrigger value="pendentes">
            Pendentes ({pagamentosPendentes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todos">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
              <CardDescription>
                Todos os pagamentos no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTabela(pagamentosFiltrados)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pix">
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos PIX</CardTitle>
              <CardDescription>
                Total: {formatarMoeda(totalPix)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTabela(pagamentosPix)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cartao">
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos Cartão</CardTitle>
              <CardDescription>
                Total: {formatarMoeda(totalCartaoCredito + totalCartaoDebito)} (Crédito: {formatarMoeda(totalCartaoCredito)} | Débito: {formatarMoeda(totalCartaoDebito)})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTabela([...pagamentosCartaoCredito, ...pagamentosCartaoDebito])}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dinheiro">
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos em Dinheiro</CardTitle>
              <CardDescription>
                Total: {formatarMoeda(totalDinheiro)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTabela(pagamentosDinheiro)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pendentes">
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos Pendentes</CardTitle>
              <CardDescription>
                Total pendente: {formatarMoeda(totalPendente)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTabela(pagamentosPendentes)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Registrar Pagamento Manual */}
      <Dialog open={modalPagamento} onOpenChange={setModalPagamento}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento Presencial</DialogTitle>
            <DialogDescription>
              Registre um pagamento feito presencialmente na barbearia (dinheiro, PIX, cartão)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="agendamento">Agendamento *</Label>
              <Select
                value={formPagamento.agendamentoId}
                onValueChange={handleAgendamentoChange}
              >
                <SelectTrigger id="agendamento">
                  <SelectValue placeholder="Selecione um agendamento" />
                </SelectTrigger>
                <SelectContent>
                  {agendamentosSemPagamento.length === 0 ? (
                    <SelectItem value="__empty__" disabled>
                      Nenhum agendamento sem pagamento encontrado
                    </SelectItem>
                  ) : (
                    agendamentosSemPagamento.map((agendamento) => (
                      <SelectItem key={agendamento.id} value={agendamento.id}>
                        {agendamento.clienteNome} - {agendamento.servicoNome} - {format(parseDateOnlyToSafeDate(agendamento.data), "dd/MM/yyyy")} às {agendamento.horario} - {formatarMoeda(agendamento.valor)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {agendamentosSemPagamento.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Todos os agendamentos já possuem pagamento registrado
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$) *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formPagamento.valor}
                  onChange={(e) => setFormPagamento({ ...formPagamento, valor: e.target.value })}
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metodo">Método de Pagamento *</Label>
                <Select
                  value={formPagamento.metodo}
                  onValueChange={(value) => setFormPagamento({ ...formPagamento, metodo: value as typeof formPagamento.metodo })}
                >
                  <SelectTrigger id="metodo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Dinheiro
                      </div>
                    </SelectItem>
                    <SelectItem value="pix">
                      <div className="flex items-center gap-2">
                        <QrCode className="h-4 w-4" />
                        PIX
                      </div>
                    </SelectItem>
                    <SelectItem value="cartao_debito">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Cartão Débito
                      </div>
                    </SelectItem>
                    <SelectItem value="cartao_credito">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Cartão Crédito
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacao">Observação (Opcional)</Label>
              <Textarea
                id="observacao"
                value={formPagamento.observacao}
                onChange={(e) => setFormPagamento({ ...formPagamento, observacao: e.target.value })}
                placeholder="Ex: Pagamento recebido em dinheiro, troco de R$ 5,00..."
                rows={3}
              />
            </div>

            {formPagamento.agendamentoId && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium mb-1">Resumo do Agendamento:</p>
                {(() => {
                  const agendamento = agendamentos.find(a => a.id === formPagamento.agendamentoId);
                  if (!agendamento) return null;
                  return (
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p>Cliente: {agendamento.clienteNome}</p>
                      <p>Serviço: {agendamento.servicoNome}</p>
                      <p>Data: {format(parseDateOnlyToSafeDate(agendamento.data), "dd/MM/yyyy")} às {agendamento.horario}</p>
                      <p className="font-semibold text-foreground">Valor do Serviço: {formatarMoeda(agendamento.valor)}</p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setModalPagamento(false);
                setFormPagamento({
                  agendamentoId: "",
                  valor: "",
                  metodo: "dinheiro",
                  observacao: "",
                });
              }}
              disabled={isRegistrando}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRegistrarPagamento}
              disabled={isRegistrando || !formPagamento.agendamentoId || !formPagamento.valor}
            >
              {isRegistrando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Pagamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
