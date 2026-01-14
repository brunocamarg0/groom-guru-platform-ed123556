import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCliente } from "@/context/ClienteContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scissors, MapPin, Phone, Mail, Search, Star, Users, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BuscarBarbearias() {
  const { barbearias, buscarBarbearias } = useCliente();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [busca, setBusca] = useState("");
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    // Carregar todas as barbearias ao montar
    buscarBarbearias();
  }, []);

  const handleBuscar = async () => {
    setBuscando(true);
    try {
      await buscarBarbearias(busca || undefined);
    } finally {
      setBuscando(false);
    }
  };

  const handleSelecionarBarbearia = (barbeariaId: string) => {
    // Navegar para agendamento com a barbearia selecionada
    navigate(`/cliente/agendar?barbearia=${barbeariaId}`);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Buscar Barbearias</h2>
        <p className="text-muted-foreground">
          Encontre a barbearia perfeita para você
        </p>
      </div>

      {/* Barra de busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, cidade ou bairro..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleBuscar();
                  }
                }}
                className="pl-10"
              />
            </div>
            <Button onClick={handleBuscar} disabled={buscando}>
              {buscando ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de barbearias */}
      {buscando ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Buscando barbearias...</p>
        </div>
      ) : barbearias.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Nenhuma barbearia encontrada. Tente uma busca diferente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {barbearias.map((barbearia) => (
            <Card
              key={barbearia.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleSelecionarBarbearia(barbearia.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary p-2 rounded-full">
                      <Scissors className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{barbearia.nome}</CardTitle>
                      {barbearia.endereco && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {barbearia.endereco}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Informações de contato */}
                <div className="space-y-1 text-sm">
                  {barbearia.telefone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {barbearia.telefone}
                    </div>
                  )}
                  {barbearia.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {barbearia.email}
                    </div>
                  )}
                </div>

                {/* Estatísticas */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {barbearia.totalServicos > 0 && (
                    <div className="flex items-center gap-1">
                      <Scissors className="h-3 w-3" />
                      {barbearia.totalServicos} serviços
                    </div>
                  )}
                  {barbearia.profissionais && barbearia.profissionais.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {barbearia.profissionais.length} profissionais
                    </div>
                  )}
                </div>

                {/* Serviços disponíveis */}
                {barbearia.servicos && barbearia.servicos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Serviços disponíveis:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {barbearia.servicos.slice(0, 3).map((servico: any) => (
                        <Badge key={servico.id} variant="secondary" className="text-xs">
                          {servico.nome} - {formatarMoeda(servico.preco)}
                        </Badge>
                      ))}
                      {barbearia.servicos.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{barbearia.servicos.length - 3} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Botão de ação */}
                <Button className="w-full mt-4" variant="default">
                  Agendar Agora
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

