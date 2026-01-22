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
import { Scissors, MapPin, Phone, Mail, Search, Star, Users, Clock, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function BuscarBarbearias() {
  const { barbearias, buscarBarbearias } = useCliente();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [busca, setBusca] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    // Carregar TODAS as barbearias ao montar (sem filtros)
    console.log('🔍 [BUSCAR BARBEARIAS] Carregando todas as barbearias...');
    buscarBarbearias(undefined, undefined, undefined).catch((err) => {
      console.warn('Erro ao carregar barbearias iniciais:', err);
      toast({
        title: "Aviso",
        description: "Não foi possível carregar todas as barbearias. Tente buscar novamente.",
        variant: "default",
      });
    });
  }, []);

  const handleBuscar = async () => {
    setBuscando(true);
    try {
      await buscarBarbearias(
        busca.trim() || undefined,
        cidade.trim() || undefined,
        bairro.trim() || undefined
      );
    } catch (error) {
      console.error('Erro ao buscar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar barbearias. Tente novamente.",
        variant: "destructive",
      });
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
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Buscar Barbearias</h2>
        <p className="text-muted-foreground">
          Encontre a barbearia ideal e agende seu serviço
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
              <Button onClick={handleBuscar} disabled={buscando} variant="default">
                <Search className="h-4 w-4 mr-2" />
                {buscando ? "Buscando..." : "Buscar"}
              </Button>
              {(busca || cidade || bairro) && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setBusca("");
                    setCidade("");
                    setBairro("");
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
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleBuscar();
                    }
                  }}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Bairro..."
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleBuscar();
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
      {buscando ? (
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
                setBusca("");
                setCidade("");
                setBairro("");
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
            {barbearias.map((barbearia) => (
              <Card
                key={barbearia.id}
                className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary/50"
                onClick={() => handleSelecionarBarbearia(barbearia.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-16 w-16 border-2 border-primary/20">
                      <AvatarImage src={barbearia.foto || undefined} alt={barbearia.nome} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                        {barbearia.nome.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight mb-1 line-clamp-2">
                        {barbearia.nome}
                      </CardTitle>
                      {(barbearia.bairro || barbearia.cidade) && (
                        <CardDescription className="flex items-center gap-1 mt-1 text-xs">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {[barbearia.bairro, barbearia.cidade].filter(Boolean).join(', ')}
                          </span>
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {/* Informações de contato */}
                  {barbearia.telefone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{barbearia.telefone}</span>
                    </div>
                  )}

                  {/* Estatísticas */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t">
                    {barbearia.totalServicos > 0 && (
                      <div className="flex items-center gap-1">
                        <Scissors className="h-3 w-3" />
                        <span>{barbearia.totalServicos}</span>
                      </div>
                    )}
                    {barbearia.profissionais && barbearia.profissionais.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{barbearia.profissionais.length}</span>
                      </div>
                    )}
                    {barbearia.totalAgendamentos > 0 && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{barbearia.totalAgendamentos}</span>
                      </div>
                    )}
                  </div>

                  {/* Serviços disponíveis - Preview */}
                  {barbearia.servicos && barbearia.servicos.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Serviços:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {barbearia.servicos.slice(0, 2).map((servico: any) => (
                          <Badge key={servico.id} variant="secondary" className="text-xs">
                            {servico.nome}
                          </Badge>
                        ))}
                        {barbearia.servicos.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{barbearia.servicos.length - 2}
                          </Badge>
                        )}
                      </div>
                      {barbearia.servicos.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          A partir de {formatarMoeda(Math.min(...barbearia.servicos.map((s: any) => s.preco)))}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Botão de ação */}
                  <Button className="w-full mt-4" variant="default" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
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

