import { useState, useEffect } from "react";
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
import { Scissors, User, Clock, CheckCircle, ArrowLeft, MapPin, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NovoAgendamento } from "@/types/cliente";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";

const horariosDisponiveis = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
];

export default function AgendamentoOnline() {
  const { criarAgendamento, buscarBarbeariaPorId } = useCliente();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [barbearia, setBarbearia] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<NovoAgendamento>>({
    barbeariaId: searchParams.get("barbearia") || "",
    servicoId: "",
    data: "",
    hora: "",
    observacoes: "",
  });

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
          navigate("/cliente/barbearias");
        } finally {
          setLoading(false);
        }
      } else {
        // Se não tiver barbearia selecionada, redirecionar para buscar
        navigate("/cliente/barbearias");
      }
    };

    loadBarbearia();
  }, [formData.barbeariaId]);

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
      await criarAgendamento({
        barbeariaId: formData.barbeariaId!,
        servicoId: formData.servicoId!,
        data: formData.data!,
        hora: formData.hora!,
        observacoes: formData.observacoes,
      });
      
      toast({
        title: "Agendamento criado!",
        description: "Seu agendamento foi criado com sucesso.",
      });
      navigate("/cliente");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando barbearia...</p>
        </div>
      </div>
    );
  }

  if (!barbearia) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/cliente/barbearias">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Barbearia não encontrada</h2>
            <p className="text-muted-foreground">
              Selecione uma barbearia para continuar
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <Button asChild>
              <Link to="/cliente/barbearias">Buscar Barbearias</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/cliente/barbearias">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agendar Serviço</h2>
          <p className="text-muted-foreground">
            {barbearia.nome}
          </p>
        </div>
      </div>

      {/* Informações da barbearia */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{barbearia.nome}</h3>
              {barbearia.endereco && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {barbearia.endereco}
                </div>
              )}
              {barbearia.telefone && (
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
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {step > s ? <CheckCircle className="h-4 w-4" /> : s}
            </div>
            {s < 4 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  step > s ? "bg-primary" : "bg-muted"
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
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.servicoId === servico.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => setFormData({ ...formData, servicoId: servico.id })}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Scissors className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{servico.nome}</p>
                        {servico.descricao && (
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
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    !formData.profissionalId
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
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.profissionalId === profissional.id
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
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Horário</Label>
              <div className="grid grid-cols-4 gap-2">
                {horariosDisponiveis.map((horario) => (
                  <Button
                    key={horario}
                    type="button"
                    variant={formData.hora === horario ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, hora: horario })}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    {horario}
                  </Button>
                ))}
              </div>
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
                <span className="font-medium">{barbearia.nome}</span>
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
                  {formData.data &&
                    new Date(formData.data).toLocaleDateString("pt-BR")}
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
    </div>
  );
}
