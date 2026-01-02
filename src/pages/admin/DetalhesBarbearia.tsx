import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useBarbearias } from "@/context/BarbeariasContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Building2, User, Calendar, CreditCard, Mail, Phone, MapPin, Scissors, UserPlus, Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Barbearia } from "@/types/barbearia";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ativa: { label: "Ativa", variant: "default" },
  em_teste: { label: "Em Teste", variant: "secondary" },
  bloqueada: { label: "Bloqueada", variant: "destructive" },
  cancelada: { label: "Cancelada", variant: "outline" },
};

const planoConfig: Record<string, string> = {
  basico: "Básico",
  premium: "Premium",
  enterprise: "Enterprise",
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function DetalhesBarbearia() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBarbearia } = useBarbearias();
  const toast = useToast();
  const [barbearia, setBarbearia] = useState<Barbearia | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [emailConvite, setEmailConvite] = useState("");
  const [gerandoConvite, setGerandoConvite] = useState(false);
  const [linkConvite, setLinkConvite] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (id) {
      const data = getBarbearia(id);
      if (data) {
        setBarbearia(data);
      } else {
        toast({
          title: "Barbearia não encontrada",
          description: "A barbearia solicitada não foi encontrada.",
          variant: "destructive",
        });
        navigate("/admin");
      }
    }
  }, [id, getBarbearia, navigate, toast]);

  const gerarConvite = async () => {
    if (!id) return;

    try {
      setGerandoConvite(true);
      const response = await fetch(`${API_URL}/api/admin/barbearias/${id}/convite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailConvite || undefined,
          diasValidade: 7,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar convite");
      }

      setLinkConvite(data.convite.urlAtivacao);
      toast({
        title: "Convite gerado com sucesso!",
        description: "O link de ativação foi gerado. Copie e envie para o dono da barbearia.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar convite",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setGerandoConvite(false);
    }
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(linkConvite);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });
  };

  if (!barbearia) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{barbearia.nome}</h2>
            <p className="text-muted-foreground">
              Detalhes completos da barbearia
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/admin/barbearias/${barbearia.id}/servicos`}>
              <Scissors className="h-4 w-4 mr-2" />
              Serviços
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/admin/barbearias/${barbearia.id}/editar`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">{barbearia.nome}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">CNPJ / CPF</p>
              <p className="font-medium">{barbearia.cnpjCpf}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Responsável</p>
              <p className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                {barbearia.responsavel}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={statusConfig[barbearia.status].variant} className="mt-1">
                {statusConfig[barbearia.status].label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Plano e Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Plano Contratado</p>
              <Badge variant="outline" className="mt-1">
                {planoConfig[barbearia.plano]}
              </Badge>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Gateway de Pagamento</p>
              {barbearia.gatewayPagamento.conectado ? (
                <div className="mt-1">
                  <Badge variant="default" className="bg-green-500">
                    {barbearia.gatewayPagamento.nome}
                  </Badge>
                  {barbearia.gatewayPagamento.dataConexao && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Conectado em: {new Date(barbearia.gatewayPagamento.dataConexao).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              ) : (
                <Badge variant="outline" className="mt-1">Não conectado</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Datas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Data de Criação</p>
              <p className="font-medium">
                {new Date(barbearia.dataCriacao).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Data de Vencimento</p>
              <p className="font-medium">
                {new Date(barbearia.dataVencimento).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {barbearia.email && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </p>
                  <p className="font-medium">{barbearia.email}</p>
                </div>
                {barbearia.telefone && <Separator />}
              </>
            )}
            {barbearia.telefone && (
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </p>
                <p className="font-medium">{barbearia.telefone}</p>
              </div>
            )}
            {barbearia.endereco && (
              <>
                {(barbearia.email || barbearia.telefone) && <Separator />}
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereço
                  </p>
                  <p className="font-medium">{barbearia.endereco}</p>
                </div>
              </>
            )}
            {!barbearia.email && !barbearia.telefone && !barbearia.endereco && (
              <p className="text-sm text-muted-foreground">Nenhum contato cadastrado</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Convite para Dono
            </CardTitle>
            <CardDescription>
              Gere um convite para o dono da barbearia criar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Gerar Convite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Gerar Convite</DialogTitle>
                  <DialogDescription>
                    Gere um link único para o dono da barbearia criar sua conta. O link expira em 7 dias.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (opcional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="dono@barbearia.com"
                      value={emailConvite}
                      onChange={(e) => setEmailConvite(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Se informado, o email será associado ao convite para referência
                    </p>
                  </div>

                  {linkConvite && (
                    <div className="space-y-2">
                      <Label>Link de Ativação</Label>
                      <div className="flex gap-2">
                        <Input value={linkConvite} readOnly className="font-mono text-xs" />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={copiarLink}
                        >
                          {copiado ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Copie este link e envie para o dono da barbearia
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={gerarConvite}
                    disabled={gerandoConvite}
                    className="w-full"
                  >
                    {gerandoConvite ? "Gerando..." : linkConvite ? "Gerar Novo Convite" : "Gerar Convite"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

