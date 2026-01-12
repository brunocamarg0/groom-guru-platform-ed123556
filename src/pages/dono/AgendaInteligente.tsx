import { useState, useMemo } from "react";
import { useDono } from "@/context/DonoContext";
import { useBarbearias } from "@/context/BarbeariasContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Scissors, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  CheckCircle,
  XCircle,
  Filter,
  AlertCircle
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, addDays, subDays, startOfMonth, endOfMonth, eachWeekOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function AgendaInteligente() {
  const { agendamentos, profissionais, clientes, criarAgendamento, confirmarAgendamento, recusarAgendamento } = useDono();
  const { barbearias } = useBarbearias();
  const { toast } = useToast();
  const [visualizacao, setVisualizacao] = useState<"dia" | "semana" | "mes">("dia");
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [filtroProfissional, setFiltroProfissional] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [agendamentoParaRecusar, setAgendamentoParaRecusar] = useState<{ id: string; clienteNome: string } | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modalNovoAgendamento, setModalNovoAgendamento] = useState(false);
  const [formNovoAgendamento, setFormNovoAgendamento] = useState({
    clienteId: "",
    profissionalId: "",
    servicoId: "",
    data: format(new Date(), "yyyy-MM-dd"),
    horario: "",
    observacoes: "",
  });

  // Obter serviços da primeira barbearia (mock)
  const servicos = useMemo(() => {
    const barbearia = barbearias[0];
    return barbearia?.servicos?.filter(s => s.ativo) || [];
  }, [barbearias]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  // Gerar horários de 40 em 40 minutos (08:00 às 19:00)
  const gerarHorariosDisponiveis = (): string[] => {
    const horarios: string[] = [];
    let hora = 8; // 08:00
    let minuto = 0;

    while (hora < 19 || (hora === 19 && minuto === 0)) {
      const horarioFormatado = `${hora.toString().padStart(2, "0")}:${minuto.toString().padStart(2, "0")}`;
      horarios.push(horarioFormatado);

      minuto += 40;
      if (minuto >= 60) {
        hora += 1;
        minuto = minuto % 60;
      }
    }

    return horarios;
  };

  // Verificar se um horário está disponível para o profissional na data selecionada
  const verificarDisponibilidade = (horario: string, profissionalId: string, data: string, servicoId?: string): boolean => {
    if (!profissionalId || !data) return true;

    // Buscar agendamentos confirmados do profissional naquela data
    const agendamentosDoProfissional = agendamentos.filter(
      (a) =>
        a.profissionalId === profissionalId &&
        a.data === data &&
        (a.status === "confirmado" || a.status === "pendente")
    );

    if (agendamentosDoProfissional.length === 0) return true;

    // Converter horário para minutos para facilitar comparação
    const [horaStr, minutoStr] = horario.split(":");
    const horarioMinutos = parseInt(horaStr) * 60 + parseInt(minutoStr);

    // Duração do serviço selecionado (ou 40 minutos padrão)
    const duracaoServico = servicoId
      ? servicos.find((s) => s.id === servicoId)?.duracao || 40
      : 40;

    // Verificar conflitos com agendamentos existentes
    for (const agendamento of agendamentosDoProfissional) {
      const [agHoraStr, agMinutoStr] = agendamento.horario.split(":");
      const agHorarioMinutos = parseInt(agHoraStr) * 60 + parseInt(agMinutoStr);
      const agFimMinutos = agHorarioMinutos + agendamento.duracao;

      const novoFimMinutos = horarioMinutos + duracaoServico;

      // Verificar se há sobreposição
      if (
        (horarioMinutos >= agHorarioMinutos && horarioMinutos < agFimMinutos) ||
        (novoFimMinutos > agHorarioMinutos && novoFimMinutos <= agFimMinutos) ||
        (horarioMinutos <= agHorarioMinutos && novoFimMinutos >= agFimMinutos)
      ) {
        return false; // Conflito encontrado
      }
    }

    return true; // Horário disponível
  };

  // Obter horários disponíveis baseado na seleção atual
  const horariosDisponiveis = useMemo(() => {
    const todosHorarios = gerarHorariosDisponiveis();
    
    if (!formNovoAgendamento.profissionalId || !formNovoAgendamento.data) {
      return todosHorarios;
    }

    // Filtrar apenas horários disponíveis
    return todosHorarios.filter((horario) =>
      verificarDisponibilidade(
        horario,
        formNovoAgendamento.profissionalId,
        formNovoAgendamento.data,
        formNovoAgendamento.servicoId
      )
    );
  }, [formNovoAgendamento.profissionalId, formNovoAgendamento.data, formNovoAgendamento.servicoId, agendamentos, servicos]);

  // Filtrar agendamentos por profissional e status
  const agendamentosFiltrados = useMemo(() => {
    let filtrados = agendamentos;
    
    if (filtroProfissional !== "todos") {
      filtrados = filtrados.filter((a) => a.profissionalId === filtroProfissional);
    }
    
    if (filtroStatus !== "todos") {
      filtrados = filtrados.filter((a) => a.status === filtroStatus);
    }
    
    return filtrados;
  }, [agendamentos, filtroProfissional, filtroStatus]);

  // Contador de agendamentos pendentes
  const agendamentosPendentes = useMemo(() => {
    return agendamentos.filter((a) => a.status === "pendente").length;
  }, [agendamentos]);

  // Lista de agendamentos pendentes (ordenados por data e horário)
  const listaAgendamentosPendentes = useMemo(() => {
    return agendamentos
      .filter((a) => a.status === "pendente")
      .sort((a, b) => {
        // Ordenar por data primeiro, depois por horário
        if (a.data !== b.data) {
          return a.data.localeCompare(b.data);
        }
        return a.horario.localeCompare(b.horario);
      });
  }, [agendamentos]);

  // Funções de ação
  const handleConfirmar = async (id: string) => {
    setIsLoading(true);
    try {
      await confirmarAgendamento(id);
      toast({
        title: "Agendamento confirmado!",
        description: "O agendamento foi confirmado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao confirmar",
        description: error.message || "Não foi possível confirmar o agendamento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecusar = async () => {
    if (!agendamentoParaRecusar) return;
    
    setIsLoading(true);
    try {
      await recusarAgendamento(agendamentoParaRecusar.id, motivoRecusa);
      toast({
        title: "Agendamento recusado",
        description: "O agendamento foi recusado e o cliente será notificado.",
      });
      setAgendamentoParaRecusar(null);
      setMotivoRecusa("");
    } catch (error: any) {
      toast({
        title: "Erro ao recusar",
        description: error.message || "Não foi possível recusar o agendamento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCriarAgendamento = () => {
    // Validação
    if (!formNovoAgendamento.clienteId) {
      toast({
        title: "Erro",
        description: "Selecione um cliente.",
        variant: "destructive",
      });
      return;
    }
    if (!formNovoAgendamento.profissionalId) {
      toast({
        title: "Erro",
        description: "Selecione um profissional.",
        variant: "destructive",
      });
      return;
    }
    if (!formNovoAgendamento.servicoId) {
      toast({
        title: "Erro",
        description: "Selecione um serviço.",
        variant: "destructive",
      });
      return;
    }
    if (!formNovoAgendamento.horario) {
      toast({
        title: "Erro",
        description: "Informe o horário.",
        variant: "destructive",
      });
      return;
    }

    // Buscar dados do cliente, profissional e serviço
    const cliente = clientes.find(c => c.id === formNovoAgendamento.clienteId);
    const profissional = profissionais.find(p => p.id === formNovoAgendamento.profissionalId);
    const servico = servicos.find(s => s.id === formNovoAgendamento.servicoId);

    if (!cliente || !profissional || !servico) {
      toast({
        title: "Erro",
        description: "Dados inválidos. Verifique as seleções.",
        variant: "destructive",
      });
      return;
    }

    // Verificar disponibilidade do horário antes de criar
    if (!verificarDisponibilidade(
      formNovoAgendamento.horario,
      formNovoAgendamento.profissionalId,
      formNovoAgendamento.data,
      formNovoAgendamento.servicoId
    )) {
      toast({
        title: "Horário indisponível",
        description: "Este horário já está ocupado para o profissional selecionado. Escolha outro horário.",
        variant: "destructive",
      });
      return;
    }

    // Criar agendamento
    criarAgendamento({
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      clienteTelefone: cliente.telefone,
      profissionalId: profissional.id,
      profissionalNome: profissional.nome,
      servicoId: servico.id,
      servicoNome: servico.nome,
      data: formNovoAgendamento.data,
      horario: formNovoAgendamento.horario,
      duracao: servico.duracao,
      valor: servico.valor,
      status: "confirmado", // Novo agendamento criado pelo dono é confirmado automaticamente
      observacoes: formNovoAgendamento.observacoes || undefined,
    });

    toast({
      title: "Agendamento criado!",
      description: `Agendamento para ${cliente.nome} foi criado com sucesso.`,
    });

    // Limpar formulário e fechar modal
    setFormNovoAgendamento({
      clienteId: "",
      profissionalId: "",
      servicoId: "",
      data: format(new Date(), "yyyy-MM-dd"),
      horario: "",
      observacoes: "",
    });
    setModalNovoAgendamento(false);
    
    // Atualizar data selecionada para a data do novo agendamento
    setDataSelecionada(new Date(formNovoAgendamento.data));
  };

  // Agendamentos do dia selecionado
  const agendamentosDoDia = useMemo(() => {
    const dataFormatada = format(dataSelecionada, "yyyy-MM-dd");
    return agendamentosFiltrados
      .filter((a) => a.data === dataFormatada)
      .sort((a, b) => a.horario.localeCompare(b.horario));
  }, [agendamentosFiltrados, dataSelecionada]);

  // Agendamentos da semana
  const semanaInicio = startOfWeek(dataSelecionada, { weekStartsOn: 0 });
  const semanaFim = endOfWeek(dataSelecionada, { weekStartsOn: 0 });
  const diasDaSemana = eachDayOfInterval({ start: semanaInicio, end: semanaFim });

  const agendamentosDaSemana = useMemo(() => {
    return diasDaSemana.map((dia) => {
      const dataFormatada = format(dia, "yyyy-MM-dd");
      const agendamentosDia = agendamentosFiltrados
        .filter((a) => a.data === dataFormatada)
        .sort((a, b) => a.horario.localeCompare(b.horario));
      return {
        dia,
        agendamentos: agendamentosDia,
      };
    });
  }, [agendamentosFiltrados, diasDaSemana]);

  // Agendamentos do mês
  const mesInicio = startOfMonth(dataSelecionada);
  const mesFim = endOfMonth(dataSelecionada);
  const semanasDoMes = eachWeekOfInterval(
    { start: mesInicio, end: mesFim },
    { weekStartsOn: 0 }
  );

  const agendamentosDoMes = useMemo(() => {
    return semanasDoMes.map((semanaInicio) => {
      const semanaFim = endOfWeek(semanaInicio, { weekStartsOn: 0 });
      const dias = eachDayOfInterval({ start: semanaInicio, end: semanaFim });
      
      return dias.map((dia) => {
        const dataFormatada = format(dia, "yyyy-MM-dd");
        const agendamentosDia = agendamentosFiltrados.filter((a) => a.data === dataFormatada);
        return {
          dia,
          agendamentos: agendamentosDia,
          pertenceAoMes: isSameMonth(dia, dataSelecionada),
        };
      });
    });
  }, [agendamentosFiltrados, dataSelecionada, semanasDoMes]);

  const navegarData = (direcao: "anterior" | "proxima") => {
    if (visualizacao === "dia") {
      setDataSelecionada(direcao === "anterior" 
        ? subDays(dataSelecionada, 1) 
        : addDays(dataSelecionada, 1));
    } else if (visualizacao === "semana") {
      setDataSelecionada(direcao === "anterior" 
        ? subDays(dataSelecionada, 7) 
        : addDays(dataSelecionada, 7));
    } else {
      setDataSelecionada(direcao === "anterior" 
        ? subDays(dataSelecionada, 30) 
        : addDays(dataSelecionada, 30));
    }
  };

  const irParaHoje = () => {
    setDataSelecionada(new Date());
  };

  const getStatusColor = (status: string) => {
    const cores: Record<string, string> = {
      confirmado: "bg-green-100 text-green-800 border-green-300",
      pendente: "bg-yellow-100 text-yellow-800 border-yellow-300",
      cancelado: "bg-red-100 text-red-800 border-red-300",
      recusado: "bg-orange-100 text-orange-800 border-orange-300",
      concluido: "bg-blue-100 text-blue-800 border-blue-300",
      realizado: "bg-blue-100 text-blue-800 border-blue-300",
    };
    return cores[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  return (
    <div className="space-y-6">
      {/* Header com navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navegarData("anterior")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navegarData("proxima")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={irParaHoje}>
              Hoje
            </Button>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {visualizacao === "dia" && format(dataSelecionada, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              {visualizacao === "semana" && `${format(semanaInicio, "d 'de' MMM", { locale: ptBR })} - ${format(semanaFim, "d 'de' MMM 'de' yyyy", { locale: ptBR })}`}
              {visualizacao === "mes" && format(dataSelecionada, "MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {agendamentosDoDia.length} agendamento(s) no dia selecionado
              </p>
              {agendamentosPendentes > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  {agendamentosPendentes} pendente(s)
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setModalNovoAgendamento(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Seção de Agendamentos Pendentes */}
      {listaAgendamentosPendentes.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  Agendamentos Pendentes de Confirmação
                </CardTitle>
                <CardDescription>
                  {listaAgendamentosPendentes.length} agendamento(s) aguardando sua confirmação
                </CardDescription>
              </div>
              <Badge variant="destructive" className="text-lg px-3 py-1">
                {listaAgendamentosPendentes.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {listaAgendamentosPendentes.slice(0, 5).map((agendamento) => (
                <div
                  key={agendamento.id}
                  className="p-4 border border-yellow-300 rounded-lg bg-white hover:bg-yellow-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Data</span>
                        <span className="font-semibold">
                          {format(new Date(agendamento.data), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Horário</span>
                        <span className="font-semibold">{agendamento.horario}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Cliente</span>
                        <span className="font-semibold">{agendamento.clienteNome}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Profissional</span>
                        <span className="font-medium">{agendamento.profissionalNome}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Serviço</span>
                        <span className="font-medium">{agendamento.servicoNome}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Valor</span>
                        <span className="font-bold text-green-600">{formatarMoeda(agendamento.valor)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleConfirmar(agendamento.id)}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirmar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setAgendamentoParaRecusar({ id: agendamento.id, clienteNome: agendamento.clienteNome })}
                        disabled={isLoading}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Recusar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {listaAgendamentosPendentes.length > 5 && (
                <p className="text-sm text-center text-muted-foreground pt-2">
                  E mais {listaAgendamentosPendentes.length - 5} agendamento(s) pendente(s). 
                  Use os filtros para visualizar todos.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Painel de Data e Hora */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Data e Hora Atual</CardTitle>
              <CardDescription>
                Selecione uma data no calendário para ver os agendamentos
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {format(new Date(), "HH:mm")}
              </div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="border rounded-md p-3">
              <Calendar
                mode="single"
                selected={dataSelecionada}
                onSelect={(date) => date && setDataSelecionada(date)}
              />
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Filtrar por Profissional</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={filtroProfissional}
                    onChange={(e) => setFiltroProfissional(e.target.value)}
                  >
                    <option value="todos">Todos os profissionais</option>
                    {profissionais.map((prof) => (
                      <option key={prof.id} value={prof.id}>
                        {prof.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Filtrar por Status</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                  >
                    <option value="todos">Todos os status</option>
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="recusado">Recusado</option>
                    <option value="concluido">Concluído</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Agendamentos de {format(dataSelecionada, "dd/MM/yyyy")}</h3>
                {agendamentosDoDia.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum agendamento para este dia</p>
                ) : (
                  <div className="space-y-2">
                    {agendamentosDoDia.map((agendamento) => (
                      <div
                        key={agendamento.id}
                        className="p-3 border rounded-lg hover:bg-accent"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{agendamento.horario}</span>
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{agendamento.clienteNome}</span>
                            <Scissors className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{agendamento.servicoNome}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(agendamento.status)}>
                              {agendamento.status}
                            </Badge>
                            <span className="font-medium">{formatarMoeda(agendamento.valor)}</span>
                            {agendamento.status === "pendente" && (
                              <div className="flex gap-1 ml-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2"
                                  onClick={() => handleConfirmar(agendamento.id)}
                                  disabled={isLoading}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Confirmar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-red-600 hover:text-red-700"
                                  onClick={() => setAgendamentoParaRecusar({ id: agendamento.id, clienteNome: agendamento.clienteNome })}
                                  disabled={isLoading}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Recusar
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          Profissional: {agendamento.profissionalNome} • Duração: {agendamento.duracao}min
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Visualização */}
      <Tabs value={visualizacao} onValueChange={(v) => setVisualizacao(v as "dia" | "semana" | "mes")}>
        <TabsList>
          <TabsTrigger value="dia">Dia</TabsTrigger>
          <TabsTrigger value="semana">Semana</TabsTrigger>
          <TabsTrigger value="mes">Mês</TabsTrigger>
        </TabsList>

        <TabsContent value="dia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agenda do Dia</CardTitle>
              <CardDescription>
                {format(dataSelecionada, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agendamentosDoDia.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum agendamento para este dia</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {agendamentosDoDia.map((agendamento) => (
                    <div
                      key={agendamento.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{agendamento.horario}</span>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{agendamento.clienteNome}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Scissors className="h-4 w-4 text-muted-foreground" />
                          <span>{agendamento.servicoNome}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(agendamento.status)}>
                          {agendamento.status}
                        </Badge>
                        <span className="font-medium">{formatarMoeda(agendamento.valor)}</span>
                        {agendamento.status === "pendente" && (
                          <div className="flex gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2"
                              onClick={() => handleConfirmar(agendamento.id)}
                              disabled={isLoading}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Confirmar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-red-600 hover:text-red-700"
                              onClick={() => setAgendamentoParaRecusar({ id: agendamento.id, clienteNome: agendamento.clienteNome })}
                              disabled={isLoading}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Recusar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="semana" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agenda da Semana</CardTitle>
              <CardDescription>
                {format(semanaInicio, "d 'de' MMM", { locale: ptBR })} - {format(semanaFim, "d 'de' MMM 'de' yyyy", { locale: ptBR })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {agendamentosDaSemana.map(({ dia, agendamentos }) => (
                  <div
                    key={dia.toISOString()}
                    className={`border rounded-lg p-2 min-h-[200px] ${
                      isSameDay(dia, new Date()) ? "bg-blue-50 border-blue-300" : ""
                    } ${isSameDay(dia, dataSelecionada) ? "ring-2 ring-primary" : ""}`}
                  >
                    <div className="font-semibold text-sm mb-2">
                      {format(dia, "EEE", { locale: ptBR })}
                      <br />
                      <span className="text-lg">{format(dia, "d")}</span>
                    </div>
                    <div className="space-y-1">
                      {agendamentos.map((agendamento) => (
                        <div
                          key={agendamento.id}
                          className={`text-xs p-1 rounded ${getStatusColor(agendamento.status)} cursor-pointer hover:opacity-80`}
                          onClick={() => setDataSelecionada(dia)}
                        >
                          <div className="font-medium">{agendamento.horario}</div>
                          <div className="truncate">{agendamento.clienteNome}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agenda do Mês</CardTitle>
              <CardDescription>
                {format(dataSelecionada, "MMMM 'de' yyyy", { locale: ptBR })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Cabeçalho dos dias da semana */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
                    <div key={dia} className="text-center font-semibold text-sm text-muted-foreground">
                      {dia}
                    </div>
                  ))}
                </div>
                {/* Semanas do mês */}
                {agendamentosDoMes.map((semana, semanaIndex) => (
                  <div key={semanaIndex} className="grid grid-cols-7 gap-2">
                    {semana.map(({ dia, agendamentos, pertenceAoMes }) => (
                      <div
                        key={dia.toISOString()}
                        className={`border rounded-lg p-2 min-h-[120px] ${
                          !pertenceAoMes ? "opacity-40" : ""
                        } ${
                          isSameDay(dia, new Date()) ? "bg-blue-50 border-blue-300" : ""
                        } ${
                          isSameDay(dia, dataSelecionada) ? "ring-2 ring-primary" : ""
                        } cursor-pointer hover:bg-accent`}
                        onClick={() => {
                          setDataSelecionada(dia);
                          setVisualizacao("dia");
                        }}
                      >
                        <div className="font-semibold text-sm mb-1">
                          {format(dia, "d")}
                        </div>
                        <div className="space-y-1">
                          {agendamentos.slice(0, 3).map((agendamento) => (
                            <div
                              key={agendamento.id}
                              className={`text-xs p-1 rounded ${getStatusColor(agendamento.status)}`}
                            >
                              <div className="font-medium truncate">{agendamento.horario}</div>
                              <div className="truncate">{agendamento.clienteNome}</div>
                            </div>
                          ))}
                          {agendamentos.length > 3 && (
                            <div className="text-xs text-muted-foreground text-center">
                              +{agendamentos.length - 3} mais
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Novo Agendamento */}
      <Dialog open={modalNovoAgendamento} onOpenChange={setModalNovoAgendamento}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
            <DialogDescription>
              Crie um novo agendamento para um cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente *</Label>
                <Select
                  value={formNovoAgendamento.clienteId}
                  onValueChange={(value) =>
                    setFormNovoAgendamento({ ...formNovoAgendamento, clienteId: value })
                  }
                >
                  <SelectTrigger id="cliente">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome} {cliente.vip && "⭐"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profissional">Profissional *</Label>
                <Select
                  value={formNovoAgendamento.profissionalId}
                  onValueChange={(value) => {
                    setFormNovoAgendamento({ 
                      ...formNovoAgendamento, 
                      profissionalId: value,
                      horario: "" // Limpar horário ao mudar profissional
                    });
                  }}
                >
                  <SelectTrigger id="profissional">
                    <SelectValue placeholder="Selecione um profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {profissionais
                      .filter((p) => p.ativo)
                      .map((profissional) => (
                        <SelectItem key={profissional.id} value={profissional.id}>
                          {profissional.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servico">Serviço *</Label>
              <Select
                value={formNovoAgendamento.servicoId}
                onValueChange={(value) => {
                  setFormNovoAgendamento({ 
                    ...formNovoAgendamento, 
                    servicoId: value,
                    horario: "" // Limpar horário ao mudar serviço (pode mudar duração)
                  });
                }}
              >
                <SelectTrigger id="servico">
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {servicos.map((servico) => (
                    <SelectItem key={servico.id} value={servico.id}>
                      {servico.nome} - {formatarMoeda(servico.valor)} ({servico.duracao}min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formNovoAgendamento.data}
                  onChange={(e) => {
                    setFormNovoAgendamento({ 
                      ...formNovoAgendamento, 
                      data: e.target.value,
                      horario: "" // Limpar horário ao mudar data
                    });
                  }}
                  min={format(new Date(), "yyyy-MM-dd")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horario">Horário *</Label>
                <Select
                  value={formNovoAgendamento.horario}
                  onValueChange={(value) =>
                    setFormNovoAgendamento({ ...formNovoAgendamento, horario: value })
                  }
                  disabled={!formNovoAgendamento.profissionalId || !formNovoAgendamento.data}
                >
                  <SelectTrigger id="horario">
                    <SelectValue placeholder={
                      !formNovoAgendamento.profissionalId || !formNovoAgendamento.data
                        ? "Selecione profissional e data primeiro"
                        : horariosDisponiveis.length === 0
                        ? "Nenhum horário disponível"
                        : "Selecione um horário"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {horariosDisponiveis.length === 0 ? (
                      <SelectItem value="" disabled>
                        Nenhum horário disponível para este profissional nesta data
                      </SelectItem>
                    ) : (
                      horariosDisponiveis.map((horario) => (
                        <SelectItem key={horario} value={horario}>
                          {horario}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formNovoAgendamento.profissionalId && formNovoAgendamento.data && (
                  <p className="text-xs text-muted-foreground">
                    {horariosDisponiveis.length} horário(s) disponível(is) de 40 em 40 minutos
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações (Opcional)</Label>
              <Textarea
                id="observacoes"
                placeholder="Observações sobre o agendamento..."
                value={formNovoAgendamento.observacoes}
                onChange={(e) =>
                  setFormNovoAgendamento({ ...formNovoAgendamento, observacoes: e.target.value })
                }
                rows={3}
              />
            </div>

            {formNovoAgendamento.servicoId && (
              <div className="p-3 bg-muted rounded-md">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Serviço selecionado:</span>
                    <span className="font-medium">
                      {servicos.find((s) => s.id === formNovoAgendamento.servicoId)?.nome}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duração:</span>
                    <span className="font-medium">
                      {servicos.find((s) => s.id === formNovoAgendamento.servicoId)?.duracao} minutos
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor:</span>
                    <span className="font-bold text-lg">
                      {formatarMoeda(servicos.find((s) => s.id === formNovoAgendamento.servicoId)?.valor || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setModalNovoAgendamento(false);
                setFormNovoAgendamento({
                  clienteId: "",
                  profissionalId: "",
                  servicoId: "",
                  data: format(new Date(), "yyyy-MM-dd"),
                  horario: "",
                  observacoes: "",
                });
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCriarAgendamento}>
              Criar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Recusar Agendamento */}
      <Dialog open={!!agendamentoParaRecusar} onOpenChange={(open) => !open && setAgendamentoParaRecusar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar Agendamento</DialogTitle>
            <DialogDescription>
              Você está prestes a recusar o agendamento de {agendamentoParaRecusar?.clienteNome}. 
              O cliente será notificado sobre a recusa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo da Recusa (Opcional)</Label>
              <Textarea
                id="motivo"
                placeholder="Ex: Horário indisponível, Profissional ausente, etc."
                value={motivoRecusa}
                onChange={(e) => setMotivoRecusa(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAgendamentoParaRecusar(null);
                setMotivoRecusa("");
              }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRecusar}
              disabled={isLoading}
            >
              {isLoading ? "Recusando..." : "Confirmar Recusa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
