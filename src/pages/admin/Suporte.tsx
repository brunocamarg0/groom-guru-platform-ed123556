import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, RefreshCw, Eye, Mail, Phone, Loader2, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  listarTicketsAdmin, 
  responderTicketAdmin, 
  atualizarStatusTicket,
  getTicketEstatisticas,
  TicketSuporte,
  TicketEstatisticas 
} from "@/services/adminApi";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Suporte() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<TicketSuporte[]>([]);
  const [estatisticas, setEstatisticas] = useState<TicketEstatisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  
  // Modal de detalhes/resposta
  const [ticketSelecionado, setTicketSelecionado] = useState<TicketSuporte | null>(null);
  const [resposta, setResposta] = useState("");
  const [enviandoResposta, setEnviandoResposta] = useState(false);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [ticketsData, statsData] = await Promise.all([
        listarTicketsAdmin(filtroStatus === "todos" ? undefined : filtroStatus),
        getTicketEstatisticas(),
      ]);
      setTickets(ticketsData);
      setEstatisticas(statsData);
    } catch (error: any) {
      console.error("Erro ao carregar tickets:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível carregar os tickets.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [filtroStatus]);

  const handleResponder = async () => {
    if (!ticketSelecionado || !resposta.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma resposta.",
        variant: "destructive",
      });
      return;
    }

    setEnviandoResposta(true);
    try {
      await responderTicketAdmin(ticketSelecionado.id, resposta, "Admin");
      toast({
        title: "Resposta enviada!",
        description: "O cliente receberá a resposta por email.",
      });
      setTicketSelecionado(null);
      setResposta("");
      carregarDados();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar a resposta.",
        variant: "destructive",
      });
    } finally {
      setEnviandoResposta(false);
    }
  };

  const handleAtualizarStatus = async (ticket: TicketSuporte, novoStatus: string) => {
    try {
      await atualizarStatusTicket(ticket.id, novoStatus);
      toast({
        title: "Status atualizado",
        description: `Ticket marcado como ${novoStatus}.`,
      });
      carregarDados();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: typeof AlertCircle }> = {
    aberto: { label: "Aberto", variant: "destructive", icon: AlertCircle },
    em_andamento: { label: "Em Andamento", variant: "secondary", icon: Clock },
    resolvido: { label: "Resolvido", variant: "default", icon: CheckCircle },
    fechado: { label: "Fechado", variant: "outline", icon: XCircle },
  };

  const prioridadeConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    baixa: { label: "Baixa", variant: "secondary" },
    media: { label: "Média", variant: "default" },
    alta: { label: "Alta", variant: "destructive" },
    urgente: { label: "Urgente", variant: "destructive" },
  };

  const categoriaLabels: Record<string, string> = {
    agendamento: "Agendamento",
    pagamento: "Pagamento",
    fidelidade: "Fidelidade",
    conta: "Conta",
    outro: "Outro",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Suporte & Atendimento</h2>
          <p className="text-muted-foreground">
            Gerencie tickets de suporte dos clientes
          </p>
        </div>
        <Button variant="outline" onClick={carregarDados} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Cards de estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-2xl">{estatisticas.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardHeader className="pb-2">
              <CardDescription>Abertos</CardDescription>
              <CardTitle className="text-2xl text-red-600">{estatisticas.abertos}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <CardHeader className="pb-2">
              <CardDescription>Em Andamento</CardDescription>
              <CardTitle className="text-2xl text-yellow-600">{estatisticas.emAndamento}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardHeader className="pb-2">
              <CardDescription>Resolvidos</CardDescription>
              <CardTitle className="text-2xl text-green-600">{estatisticas.resolvidos}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filtro */}
      <div className="flex items-center gap-4">
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="aberto">Abertos</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="resolvido">Resolvidos</SelectItem>
            <SelectItem value="fechado">Fechados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets de Suporte</CardTitle>
          <CardDescription>
            {tickets.length === 0 
              ? "Nenhum ticket encontrado" 
              : `${tickets.length} ticket(s) encontrado(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum ticket de suporte encontrado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => {
                  const status = statusConfig[ticket.status] || statusConfig.aberto;
                  const prioridade = prioridadeConfig[ticket.prioridade] || prioridadeConfig.media;
                  const StatusIcon = status.icon;
                  
                  return (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ticket.clienteNome}</p>
                          <p className="text-xs text-muted-foreground">{ticket.clienteEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{categoriaLabels[ticket.categoria] || ticket.categoria}</TableCell>
                      <TableCell className="max-w-48 truncate">{ticket.assunto}</TableCell>
                      <TableCell>
                        <Badge variant={prioridade.variant}>{prioridade.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <p>{format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm")}</p>
                          <p className="text-muted-foreground">
                            {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setTicketSelecionado(ticket);
                              setResposta(ticket.resposta || "");
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {ticket.status === "aberto" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAtualizarStatus(ticket, "resolvido")}
                              title="Marcar como resolvido"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalhes/resposta */}
      <Dialog open={!!ticketSelecionado} onOpenChange={(open) => !open && setTicketSelecionado(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Ticket</DialogTitle>
            <DialogDescription>
              {ticketSelecionado && (
                <span>Aberto em {format(new Date(ticketSelecionado.createdAt), "dd/MM/yyyy 'às' HH:mm")}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {ticketSelecionado && (
            <div className="space-y-4">
              {/* Informações do cliente */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{ticketSelecionado.clienteNome}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <p className="font-medium">{categoriaLabels[ticketSelecionado.categoria]}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`mailto:${ticketSelecionado.clienteEmail}`}
                    className="text-primary hover:underline"
                  >
                    {ticketSelecionado.clienteEmail}
                  </a>
                </div>
                {ticketSelecionado.cliente?.telefone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`https://wa.me/55${ticketSelecionado.cliente.telefone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:underline"
                    >
                      {ticketSelecionado.cliente.telefone}
                    </a>
                  </div>
                )}
              </div>

              {/* Mensagem do cliente */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Assunto</p>
                <p className="font-medium">{ticketSelecionado.assunto}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Mensagem</p>
                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                  {ticketSelecionado.mensagem}
                </div>
              </div>

              {/* Resposta anterior (se houver) */}
              {ticketSelecionado.resposta && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Resposta anterior ({ticketSelecionado.respondidoPor} - {ticketSelecionado.respondidoEm && format(new Date(ticketSelecionado.respondidoEm), "dd/MM/yyyy HH:mm")})
                  </p>
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 whitespace-pre-wrap">
                    {ticketSelecionado.resposta}
                  </div>
                </div>
              )}

              {/* Campo de resposta */}
              {ticketSelecionado.status !== "fechado" && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {ticketSelecionado.resposta ? "Adicionar nova resposta" : "Responder"}
                  </p>
                  <Textarea
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    placeholder="Digite sua resposta..."
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {ticketSelecionado && ticketSelecionado.status !== "fechado" && (
              <>
                <div className="flex gap-2 flex-1">
                  <Select 
                    value={ticketSelecionado.status}
                    onValueChange={(value) => {
                      handleAtualizarStatus(ticketSelecionado, value);
                      setTicketSelecionado({ ...ticketSelecionado, status: value });
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aberto">Aberto</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="resolvido">Resolvido</SelectItem>
                      <SelectItem value="fechado">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleResponder} 
                  disabled={enviandoResposta || !resposta.trim()}
                >
                  {enviandoResposta ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar Resposta
                    </>
                  )}
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setTicketSelecionado(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
