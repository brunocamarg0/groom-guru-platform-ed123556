import { useState, useEffect, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Scissors, User, Clock, CheckCircle, ArrowLeft, MapPin, Phone, AlertCircle, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { NovoAgendamento } from "@/types/cliente";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { SelecaoFormaPagamento } from "@/components/pagamento/SelecaoFormaPagamento";

// Gerar horários de 40 em 40 minutos (08:00 às 19:00)
const gerarTodosHorarios = (): string[] => {
  const horarios: string[] = [];
  let hora = 8;
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

const todosHorarios = gerarTodosHorarios();

export default function AgendamentoOnline() {
  const { criarAgendamento, buscarBarbeariaPorId, barbearias, buscarBarbearias } = useCliente();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [barbearia, setBarbearia] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [agendamentoIdAtual, setAgendamentoIdAtual] = useState<string | null>(null);
  const [buscandoBarbearias, setBuscandoBarbearias] = useState(false);
  const [buscaTexto, setBuscaTexto] = useState("");
  const [buscaCidade, setBuscaCidade] = useState("");
  const [buscaBairro, setBuscaBairro] = useState("");
  const [formData, setFormData] = useState<Partial<NovoAgendamento>>({
    barbeariaId: searchParams.get("barbearia") || "",
    servicoId: "",
    data: "",
    hora: "",
    observacoes: "",
  });

  // Carregar todas as barbearias ao montar o componente
  useEffect(() => {
    if (!formData.barbeariaId) {
      console.log('🔍 [AGENDAMENTO] Carregando todas as barbearias...');
      buscarBarbearias(undefined, undefined, undefined).catch((err) => {
        console.warn('Erro ao carregar barbearias iniciais:', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carregar barbearia quando barbeariaId mudar
  useEffect(() => {
    const loadBarbearia = async () => {
      if (formData.barbeariaId) {
        setLoading(true);
        try {
          const barbeariaData = await buscarBarbeariaPorId(formData.barbeariaId);
          setBarbearia(barbeariaData);
        } catch (error) {
          toast({
            title: "Erro",
            description: "Não foi possível carregar a barbearia. Tente novamente.",
            variant: "destructive",
          });
          // Limpar barbeariaId para mostrar lista novamente
          setFormData({ ...formData, barbeariaId: "" });
        } finally {
          setLoading(false);
        }
      }
    };

    loadBarbearia();
  }, [formData.barbeariaId]);

  // Carregar horários ocupados quando data mudar
  useEffect(() => {
    const carregarHorariosOcupados = async () => {
      if (!formData.barbeariaId || !formData.data) {
        setHorariosOcupados([]);
        return;
      }

      setLoadingHorarios(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'https://groom-guru-platform-production.up.railway.app/api';
        const response = await fetch(
          `${API_URL}/barbearias/${formData.barbeariaId}/horarios-ocupados?data=${formData.data}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setHorariosOcupados(data.horariosOcupados || []);
        } else {
          // Se não encontrar endpoint, usar array vazio (compatibilidade)
          setHorariosOcupados([]);
        }
      } catch (error) {
        console.warn('Não foi possível carregar horários ocupados:', error);
        setHorariosOcupados([]);
      } finally {
        setLoadingHorarios(false);
      }
    };

    carregarHorariosOcupados();
  }, [formData.barbeariaId, formData.data]);

  // Calcular horários disponíveis
  const horariosDisponiveis = useMemo(() => {
    return todosHorarios.filter(horario => !horariosOcupados.includes(horario));
  }, [horariosOcupados]);

  const servicosDisponiveis = barbearia?.servicos || [];
  const profissionaisDisponiveis = barbearia?.profissionais || [];

  const servicoSelecionado = servicosDisponiveis.find((s: any) => s.id === formData.servicoId);
  const profissionalSelecionado = profissionaisDisponiveis.find((p: any) => p.id === formData.profissionalId);

  const handleSubmit = async () => {
    if (!formData.servicoId || !formData.data || !formData.hora) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const novoAgendamento = await criarAgendamento({
        barbeariaId: formData.barbeariaId!,
        servicoId: formData.servicoId!,
        profissionalId: formData.profissionalId,
        data: formData.data!,
        hora: formData.hora!,
        observacoes: formData.observacoes,
      });

      toast({
        title: "Agendamento criado!",
        description: "Escolha a forma de pagamento...",
      });

      // Ir para step 5 (seleção de forma de pagamento)
      setAgendamentoIdAtual(novoAgendamento.id);
      setStep(5);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o agendamento.",
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

  // Evita bug de fuso: `new Date('YYYY-MM-DD')` é interpretado como UTC e pode voltar 1 dia no Brasil.
  const formatarDataBR = (dataISO?: string) => {
    if (!dataISO) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataISO)) {
      const [ano, mes, dia] = dataISO.split("-");
      return `${dia}/${mes}/${ano}`;
    }
    return new Date(dataISO).toLocaleDateString("pt-BR");
  };

  const handleBuscarBarbearias = async () => {
    setBuscandoBarbearias(true);
    try {
      await buscarBarbearias(
        buscaTexto.trim() || undefined,
        buscaCidade.trim() || undefined,
        buscaBairro.trim() || undefined
      );
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível buscar barbearias. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setBuscandoBarbearias(false);
    }
  };

  const handleSelecionarBarbearia = (barbeariaId: string) => {
    setFormData({ ...formData, barbeariaId });
    setStep(1);
  };

  const handleVoltarParaLista = () => {
    setFormData({ ...formData, barbeariaId: "", servicoId: "", data: "", hora: "", observacoes: "" });
    setBarbearia(null);
    setStep(1);
  };

  // Se não tiver barbearia selecionada, mostrar lista de barbearias com busca
  if (!barbearia && !formData.barbeariaId) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agendar Serviço</h2>
          <p className="text-muted-foreground">
            Escolha uma barbearia para começar seu agendamento
          </p>
        </div>

        {/* Barra de busca */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome..."
                    value={buscaTexto}
                    onChange={(e) => setBuscaTexto(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleBuscarBarbearias();
                      }
                    }}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleBuscarBarbearias} disabled={buscandoBarbearias} variant="default">
                  <Search className="h-4 w-4 mr-2" />
                  {buscandoBarbearias ? "Buscando..." : "Buscar"}
                </Button>
                {(buscaTexto || buscaCidade || buscaBairro) && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setBuscaTexto("");
                      setBuscaCidade("");
                      setBuscaBairro("");
                      buscarBarbearias(undefined, undefined, undefined);
                    }}
                  >
                    Limpar
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cidade..."
                    value={buscaCidade}
                    onChange={(e) => setBuscaCidade(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleBuscarBarbearias();
                      }
                    }}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Bairro..."
                    value={buscaBairro}
                    onChange={(e) => setBuscaBairro(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleBuscarBarbearias();
                      }
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de barbearias */}
        {buscandoBarbearias ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Buscando barbearias...</p>
          </div>
        ) : barbearias.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Scissors className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-2">
                Nenhuma barbearia encontrada
              </p>
              <p className="text-sm text-muted-foreground">
                Tente uma busca diferente ou limpe os filtros para ver todas as barbearias
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setBuscaTexto("");
                  setBuscaCidade("");
                  setBuscaBairro("");
                  buscarBarbearias(undefined, undefined, undefined);
                }}
              >
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {barbearias.length} {barbearias.length === 1 ? 'barbearia encontrada' : 'barbearias encontradas'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {barbearias.map((barbeariaItem: any) => (
                <Card
                  key={barbeariaItem.id}
                  className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary/50"
                  onClick={() => handleSelecionarBarbearia(barbeariaItem.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-16 w-16 border-2 border-primary/20">
                        <AvatarImage src={barbeariaItem.foto || undefined} alt={barbeariaItem.nome} />
                        <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                          {barbeariaItem.nome.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg leading-tight mb-1 line-clamp-2">
                          {barbeariaItem.nome}
                        </CardTitle>
                        {(barbeariaItem.bairro || barbeariaItem.cidade) && (
                          <CardDescription className="flex items-center gap-1 mt-1 text-xs">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {[barbeariaItem.bairro, barbeariaItem.cidade].filter(Boolean).join(', ')}
                            </span>
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {barbeariaItem.telefone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{barbeariaItem.telefone}</span>
                      </div>
                    )}
                    {barbeariaItem.servicos && barbeariaItem.servicos.length > 0 && (
                      <div className="space-y-2 pt-2 border-t">
                        <p className="text-xs font-semibold text-muted-foreground">
                          Serviços:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {barbeariaItem.servicos
                            .filter((s: any) => s && s.id && s.nome)
                            .slice(0, 2)
                            .map((servico: any) => (
                              <Badge key={servico.id} variant="secondary" className="text-xs">
                                {servico.nome || 'Serviço sem nome'}
                              </Badge>
                            ))}
                          {barbeariaItem.servicos.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{barbeariaItem.servicos.length - 2}
                            </Badge>
                          )}
                        </div>
                        {barbeariaItem.servicos.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            A partir de {formatarMoeda(Math.min(...barbeariaItem.servicos.map((s: any) => s.preco)))}
                          </p>
                        )}
                      </div>
                    )}
                    <Button className="w-full mt-4" variant="default" size="sm">
                      <Clock className="h-4 w-4 mr-2" />
                      Agendar Agora
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando barbearia...</p>
        </div>
      </div>
    );
  }

  // Verificação de segurança: se não houver barbearia, voltar para lista
  if (!barbearia) {
    console.warn('⚠️ [AGENDAMENTO] Barbearia não encontrada, voltando para lista');
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agendar Serviço</h2>
          <p className="text-muted-foreground">
            Barbearia não encontrada. Por favor, selecione uma barbearia.
          </p>
        </div>
        <Button onClick={handleVoltarParaLista} variant="default">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Lista de Barbearias
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleVoltarParaLista}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agendar Serviço</h2>
          <p className="text-muted-foreground">
            {barbearia?.nome || 'Barbearia sem nome'}
          </p>
        </div>
      </div>

      {/* Informações da barbearia */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{barbearia?.nome || 'Barbearia sem nome'}</h3>
              {barbearia?.endereco && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {barbearia.endereco}
                </div>
              )}
              {barbearia?.telefone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {barbearia.telefone}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center $            {step >= s ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
            >
              {step > s ? <CheckCircle className="h-4 w-4" /> : s}
            </div>
            {s < 5 && (
              <div
                className={`flex-1 h-1 mx-2 ${step > s ? "bg-primary" : "bg-muted"
                  }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Escolher Serviço */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>1. Escolha o Serviço</CardTitle>
            <CardDescription>Selecione o serviço desejado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {servicosDisponiveis.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum serviço disponível nesta barbearia.
              </p>
            ) : (
              servicosDisponiveis.map((servico: any) => (
                <div
                  key={servico.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.servicoId === servico.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent"
                    }`}
                  onClick={() => setFormData({ ...formData, servicoId: servico.id })}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Scissors className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{servico?.nome || 'Serviço sem nome'}</p>
                        {servico?.descricao && (
                          <p className="text-sm text-muted-foreground">
                            {servico.descricao}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {servico.duracao} minutos
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatarMoeda(servico.preco)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <Button
              className="w-full mt-4"
              onClick={() => setStep(2)}
              disabled={!formData.servicoId}
            >
              Continuar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Escolher Profissional (opcional) */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>2. Escolha o Profissional (Opcional)</CardTitle>
            <CardDescription>Selecione o barbeiro ou deixe em branco</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {profissionaisDisponiveis.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum profissional disponível. Você pode continuar sem selecionar.
              </p>
            ) : (
              <>
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${!formData.profissionalId
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent"
                    }`}
                  onClick={() => setFormData({ ...formData, profissionalId: "" })}
                >
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Qualquer profissional disponível</p>
                    </div>
                  </div>
                </div>
                {profissionaisDisponiveis.map((profissional: any) => (
                  <div
                    key={profissional.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.profissionalId === profissional.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-accent"
                      }`}
                    onClick={() => setFormData({ ...formData, profissionalId: profissional.id })}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5" />
                        <div>
                          <p className="font-medium">{profissional.nome}</p>
                          {profissional.especialidades && profissional.especialidades.length > 0 && (
                            <div className="flex gap-2 mt-1">
                              {profissional.especialidades.map((esp: string) => (
                                <Badge key={esp} variant="secondary" className="text-xs">
                                  {esp}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button
                className="flex-1"
                onClick={() => setStep(3)}
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Escolher Data e Horário */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>3. Escolha Data e Horário</CardTitle>
            <CardDescription>Selecione quando deseja ser atendido</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => {
                  setFormData({ ...formData, data: e.target.value, hora: "" });
                }}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Horário</Label>
              {loadingHorarios ? (
                <p className="text-sm text-muted-foreground">Carregando horários disponíveis...</p>
              ) : !formData.data ? (
                <p className="text-sm text-muted-foreground">Selecione uma data primeiro</p>
              ) : horariosDisponiveis.length === 0 ? (
                <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Nenhum horário disponível nesta data</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Todos os horários já foram preenchidos. Por favor, escolha outra data.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-2">
                    {todosHorarios.map((horario) => {
                      const isOcupado = horariosOcupados.includes(horario);
                      return (
                        <Button
                          key={horario}
                          type="button"
                          variant={formData.hora === horario ? "default" : isOcupado ? "ghost" : "outline"}
                          onClick={() => !isOcupado && setFormData({ ...formData, hora: horario })}
                          disabled={isOcupado}
                          className={isOcupado ? "opacity-50 cursor-not-allowed line-through" : ""}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          {horario}
                        </Button>
                      );
                    })}
                  </div>
                  {horariosOcupados.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Horários riscados já estão ocupados e não podem ser selecionados.
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="space-y-2">
              <Label>Observações (Opcional)</Label>
              <Input
                placeholder="Alguma observação especial?"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button
                className="flex-1"
                onClick={() => setStep(4)}
                disabled={!formData.data || !formData.hora}
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Confirmação */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>4. Confirmação</CardTitle>
            <CardDescription>Revise os dados do seu agendamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-muted-foreground">Barbearia:</span>
                <span className="font-medium">{barbearia?.nome || 'Barbearia sem nome'}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-muted-foreground">Serviço:</span>
                <span className="font-medium">{servicoSelecionado?.nome}</span>
              </div>
              {profissionalSelecionado && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-muted-foreground">Profissional:</span>
                  <span className="font-medium">{profissionalSelecionado.nome}</span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-muted-foreground">Data:</span>
                <span className="font-medium">
                  {formatarDataBR(formData.data as string)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-muted-foreground">Horário:</span>
                <span className="font-medium">{formData.hora}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-muted-foreground">Duração:</span>
                <span className="font-medium">{servicoSelecionado?.duracao} minutos</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg font-bold text-lg">
                <span>Total:</span>
                <span>{formatarMoeda(servicoSelecionado?.preco || 0)}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setStep(3)}>
                Voltar
              </Button>
              <Button className="flex-1" onClick={handleSubmit}>
                Confirmar Agendamento
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Seleção de Forma de Pagamento */}
      {step === 5 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Agendamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Serviço:</span>
                <span className="font-medium">{servicoSelecionado?.nome}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Data:</span>
                <span className="font-medium">
                  {formData.data &&
                    new Date(formData.data).toLocaleDateString("pt-BR")} às {formData.hora}
                </span>
              </div>
              <div className="flex items-center justify-between font-bold text-lg pt-2 border-t">
                <span>Total:</span>
                <span>{formatarMoeda(servicoSelecionado?.preco || 0)}</span>
              </div>
            </CardContent>
          </Card>
          
          <SelecaoFormaPagamento
            agendamentoId={agendamentoIdAtual || ""}
            valor={servicoSelecionado?.preco || 0}
            onPagamentoPresencial={() => {
              toast({
                title: "Agendamento confirmado!",
                description: "Você pagará na barbearia no dia do atendimento.",
              });
              setTimeout(() => {
                navigate("/cliente");
              }, 1500);
            }}
          />
        </div>
      )}
    </div>
  );
}
