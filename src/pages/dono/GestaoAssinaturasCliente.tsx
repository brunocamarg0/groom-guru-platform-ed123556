import { useState, useEffect } from "react";
import { useDono } from "@/context/DonoContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Eye, 
  Calendar, 
  CreditCard, 
  User, 
  Package,
  TrendingUp,
  XCircle,
  CheckCircle,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/services/api";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";

interface AssinaturaCliente {
  id: string;
  status: string;
  dataInicio: string;
  dataVencimento: string;
  proximoVencimento: string;
  pagamentoRecorrente: boolean;
  cliente: {
    id: string;
    nome: string;
    email: string;
    telefone: string;
  };
  plano: {
    id: string;
    nome: string;
    valor: number;
    duracaoMeses: number;
  };
  profissional?: {
    id: string;
    nome: string;
    comissaoAssinatura: number;
  };
  _count: {
    pagamentos: number;
    comissoes: number;
  };
}

interface PagamentoAssinatura {
  id: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: string;
  metodoPagamento?: string;
  linkPagamento?: string;
  qrCodePix?: string;
}

export default function GestaoAssinaturasCliente() {
  const { barbeariaId, profissionais, clientes } = useDono();
  const { toast } = useToast();
  const [assinaturas, setAssinaturas] = useState<AssinaturaCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroProfissional, setFiltroProfissional] = useState<string>("todos");
  const [assinaturaSelecionada, setAssinaturaSelecionada] = useState<AssinaturaCliente | null>(null);
  const [pagamentos, setPagamentos] = useState<PagamentoAssinatura[]>([]);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [loadingPagamentos, setLoadingPagamentos] = useState(false);
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [planos, setPlanos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [formCriar, setFormCriar] = useState({
    clienteId: "",
    planoId: "",
    profissionalId: "",
  });

  useEffect(() => {
    if (barbeariaId) {
      carregarAssinaturas();
      carregarPlanos();
      carregarClientes();
    }
  }, [barbeariaId, filtroStatus, filtroProfissional]);

  const carregarPlanos = async () => {
    try {
      const data = await apiGet<any[]>("/dono/planos-cliente");
      setPlanos(data.filter((p) => p.ativo));
    } catch (error) {
      console.error("Erro ao carregar planos:", error);
    }
  };

  const carregarClientes = () => {
    // Usar a lista de clientes do contexto
    setClientes(clientes || []);
  };

  const carregarAssinaturas = async () => {
    if (!barbeariaId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroStatus !== "todos") {
        params.append("status", filtroStatus);
      }
      if (filtroProfissional !== "todos") {
        params.append("profissionalId", filtroProfissional);
      }

      const queryString = params.toString();
      const endpoint = `/dono/assinaturas-cliente${queryString ? `?${queryString}` : ""}`;
      const data = await apiGet<AssinaturaCliente[]>(endpoint);
      setAssinaturas(data);
    } catch (error: any) {
      console.error("Erro ao carregar assinaturas:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar assinaturas de clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const carregarPagamentos = async (assinaturaId: string) => {
    setLoadingPagamentos(true);
    try {
      const data = await apiGet<PagamentoAssinatura[]>(`/dono/pagamentos-assinatura?assinaturaId=${assinaturaId}`);
      setPagamentos(data);
    } catch (error: any) {
      console.error("Erro ao carregar pagamentos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pagamentos",
        variant: "destructive",
      });
    } finally {
      setLoadingPagamentos(false);
    }
  };

  const handleVerDetalhes = async (assinatura: AssinaturaCliente) => {
    setAssinaturaSelecionada(assinatura);
    setModalDetalhesAberto(true);
    await carregarPagamentos(assinatura.id);
  };

  const handleCriarAssinatura = async () => {
    if (!formCriar.clienteId || !formCriar.planoId) {
      toast({
        title: "Erro",
        description: "Selecione um cliente e um plano",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiPost("/dono/assinaturas-cliente", {
        clienteId: formCriar.clienteId,
        planoId: formCriar.planoId,
        profissionalId: formCriar.profissionalId || null,
      });

      toast({
        title: "Sucesso",
        description: "Assinatura criada com sucesso!",
      });

      setModalCriarAberto(false);
      setFormCriar({ clienteId: "", planoId: "", profissionalId: "" });
      carregarAssinaturas();
    } catch (error: any) {
      console.error("Erro ao criar assinatura:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar assinatura",
        variant: "destructive",
      });
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR");
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      ativa: { label: "Ativa", variant: "default" },
      suspensa: { label: "Suspensa", variant: "secondary" },
      cancelada: { label: "Cancelada", variant: "destructive" },
      vencida: { label: "Vencida", variant: "destructive" },
    };
    return configs[status] || { label: status, variant: "default" };
  };

  const assinaturasFiltradas = assinaturas.filter((assinatura) => {
    const matchBusca =
      assinatura.cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
      assinatura.cliente.email.toLowerCase().includes(busca.toLowerCase()) ||
      assinatura.plano.nome.toLowerCase().includes(busca.toLowerCase());
    return matchBusca;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando assinaturas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Assinaturas de Clientes
        </h2>
        <p className="text-muted-foreground">
          Gerencie as assinaturas e pagamentos dos seus clientes
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assinaturas</CardTitle>
              <CardDescription>
                {assinaturasFiltradas.length} assinatura(s) encontrada(s)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente ou plano..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button onClick={() => setModalCriarAberto(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Assinatura
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ativa">Ativas</SelectItem>
                <SelectItem value="suspensa">Suspensas</SelectItem>
                <SelectItem value="cancelada">Canceladas</SelectItem>
                <SelectItem value="vencida">Vencidas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroProfissional} onValueChange={setFiltroProfissional}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtrar por profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os profissionais</SelectItem>
                {profissionais.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {assinaturasFiltradas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma assinatura encontrada.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assinaturasFiltradas.map((assinatura) => {
                  const statusConfig = getStatusConfig(assinatura.status);
                  return (
                    <TableRow key={assinatura.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assinatura.cliente.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            {assinatura.cliente.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assinatura.plano.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            {assinatura.plano.duracaoMeses} {assinatura.plano.duracaoMeses === 1 ? "mês" : "meses"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {assinatura.profissional ? (
                          <div>
                            <div className="font-medium">{assinatura.profissional.nome}</div>
                            <div className="text-sm text-muted-foreground">
                              Comissão: {formatarMoeda(assinatura.profissional.comissaoAssinatura)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Não atribuído</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatarMoeda(assinatura.plano.valor)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.variant}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatarData(assinatura.dataVencimento)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleVerDetalhes(assinatura)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={modalDetalhesAberto} onOpenChange={setModalDetalhesAberto}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Assinatura</DialogTitle>
            <DialogDescription>
              Informações completas da assinatura e histórico de pagamentos
            </DialogDescription>
          </DialogHeader>
          {assinaturaSelecionada && (
            <div className="space-y-6">
              <Tabs defaultValue="info" className="w-full">
                <TabsList>
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
                </TabsList>
                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Cliente
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          <p className="font-medium">{assinaturaSelecionada.cliente.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {assinaturaSelecionada.cliente.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {assinaturaSelecionada.cliente.telefone}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Plano
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          <p className="font-medium">{assinaturaSelecionada.plano.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {assinaturaSelecionada.plano.duracaoMeses} {assinaturaSelecionada.plano.duracaoMeses === 1 ? "mês" : "meses"}
                          </p>
                          <p className="text-lg font-bold text-primary">
                            {formatarMoeda(assinaturaSelecionada.plano.valor)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Datas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Início:</span>
                            <span>{formatarData(assinaturaSelecionada.dataInicio)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Vencimento:</span>
                            <span>{formatarData(assinaturaSelecionada.dataVencimento)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Próximo:</span>
                            <span>{formatarData(assinaturaSelecionada.proximoVencimento)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Badge variant={getStatusConfig(assinaturaSelecionada.status).variant}>
                            {getStatusConfig(assinaturaSelecionada.status).label}
                          </Badge>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Pagamentos:</span>
                              <span>{assinaturaSelecionada._count.pagamentos}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Comissões:</span>
                              <span>{assinaturaSelecionada._count.comissoes}</span>
                            </div>
                            {assinaturaSelecionada.profissional && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Comissão/Assinatura:</span>
                                <span className="font-medium">
                                  {formatarMoeda(assinaturaSelecionada.profissional.comissaoAssinatura)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent value="pagamentos" className="space-y-4">
                  {loadingPagamentos ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Carregando pagamentos...</p>
                    </div>
                  ) : pagamentos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum pagamento registrado ainda.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pagamentos.map((pagamento) => (
                        <Card key={pagamento.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">
                                    {formatarMoeda(pagamento.valor)}
                                  </p>
                                  <Badge
                                    variant={
                                      pagamento.status === "paga"
                                        ? "default"
                                        : pagamento.status === "vencida"
                                        ? "destructive"
                                        : "secondary"
                                    }
                                  >
                                    {pagamento.status === "paga"
                                      ? "Paga"
                                      : pagamento.status === "vencida"
                                      ? "Vencida"
                                      : "Pendente"}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <p>Vencimento: {formatarData(pagamento.dataVencimento)}</p>
                                  {pagamento.dataPagamento && (
                                    <p>Pagamento: {formatarData(pagamento.dataPagamento)}</p>
                                  )}
                                  {pagamento.metodoPagamento && (
                                    <p>Método: {pagamento.metodoPagamento}</p>
                                  )}
                                </div>
                              </div>
                              <div>
                                {pagamento.status === "paga" ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Criar Assinatura */}
      <Dialog open={modalCriarAberto} onOpenChange={setModalCriarAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Assinatura</DialogTitle>
            <DialogDescription>
              Crie uma nova assinatura para um cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <Select
                value={formCriar.clienteId}
                onValueChange={(value) =>
                  setFormCriar({ ...formCriar, clienteId: value })
                }
              >
                <SelectTrigger id="cliente">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome} - {cliente.email || cliente.telefone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plano">Plano *</Label>
              <Select
                value={formCriar.planoId}
                onValueChange={(value) =>
                  setFormCriar({ ...formCriar, planoId: value })
                }
              >
                <SelectTrigger id="plano">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {planos.map((plano) => (
                    <SelectItem key={plano.id} value={plano.id}>
                      {plano.nome} - {formatarMoeda(plano.valor)}/mês
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profissional">Profissional (Opcional)</Label>
              <Select
                value={formCriar.profissionalId}
                onValueChange={(value) =>
                  setFormCriar({ ...formCriar, profissionalId: value })
                }
              >
                <SelectTrigger id="profissional">
                  <SelectValue placeholder="Selecione um profissional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {profissionais.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setModalCriarAberto(false);
                setFormCriar({ clienteId: "", planoId: "", profissionalId: "" });
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCriarAssinatura}>Criar Assinatura</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

