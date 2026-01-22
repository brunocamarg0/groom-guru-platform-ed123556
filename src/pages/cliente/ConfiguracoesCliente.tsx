import { useState } from "react";
import { useCliente } from "@/context/ClienteContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Key, Bell, Mail, MessageSquare, Trash2, AlertTriangle, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiPut, apiDelete } from "@/services/api";
import { useNavigate } from "react-router-dom";

export default function ConfiguracoesCliente() {
  const { cliente, atualizarPerfil } = useCliente();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [isDialogSenhaOpen, setIsDialogSenhaOpen] = useState(false);
  const [isDialogExcluirOpen, setIsDialogExcluirOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState("");

  const [preferencias, setPreferencias] = useState({
    notificacoesApp: true,
    notificacoesEmail: true,
    notificacoesWhatsapp: false,
    promocoes: true,
    lembretes: true,
  });

  const handleAlterarSenha = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    if (novaSenha.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    setSalvando(true);
    try {
      await apiPut('/cliente/alterar-senha', {
        senhaAtual,
        novaSenha,
      });

      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso.",
      });
      setIsDialogSenhaOpen(false);
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível alterar a senha.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarPreferencias = async () => {
    setSalvando(true);
    try {
      await atualizarPerfil({
        preferenciasNotificacao: preferencias,
      } as any);
      
      toast({
        title: "Preferências salvas",
        description: "Suas preferências foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar as preferências.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirConta = async () => {
    if (confirmarExclusao !== "EXCLUIR") {
      toast({
        title: "Erro",
        description: "Digite 'EXCLUIR' para confirmar a exclusão.",
        variant: "destructive",
      });
      return;
    }

    setExcluindo(true);
    try {
      await apiDelete('/cliente/conta');
      
      toast({
        title: "Conta excluída",
        description: "Sua conta foi excluída conforme LGPD. Sentiremos sua falta!",
      });

      // Limpar dados locais e redirecionar
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir a conta.",
        variant: "destructive",
      });
    } finally {
      setExcluindo(false);
      setIsDialogExcluirOpen(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie suas preferências e configurações da conta
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Altere sua senha de acesso para manter sua conta segura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isDialogSenhaOpen} onOpenChange={setIsDialogSenhaOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Alterar Senha</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alterar Senha</DialogTitle>
                <DialogDescription>
                  Digite sua senha atual e a nova senha
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="senhaAtual">Senha Atual</Label>
                  <Input
                    id="senhaAtual"
                    type="password"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    placeholder="Digite sua senha atual"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="novaSenha">Nova Senha</Label>
                  <Input
                    id="novaSenha"
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a nova senha"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogSenhaOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAlterarSenha} disabled={salvando}>
                  {salvando ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    "Alterar Senha"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Preferências de Notificação
          </CardTitle>
          <CardDescription>
            Escolha quais notificações deseja receber
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações no App</Label>
              <p className="text-sm text-muted-foreground">
                Receba notificações dentro do aplicativo
              </p>
            </div>
            <Switch
              checked={preferencias.notificacoesApp}
              onCheckedChange={(checked) =>
                setPreferencias({ ...preferencias, notificacoesApp: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Notificações por Email
              </Label>
              <p className="text-sm text-muted-foreground">
                Receba confirmações e lembretes por email
              </p>
            </div>
            <Switch
              checked={preferencias.notificacoesEmail}
              onCheckedChange={(checked) =>
                setPreferencias({ ...preferencias, notificacoesEmail: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Notificações por WhatsApp
              </Label>
              <p className="text-sm text-muted-foreground">
                Receba lembretes via WhatsApp
              </p>
            </div>
            <Switch
              checked={preferencias.notificacoesWhatsapp}
              onCheckedChange={(checked) =>
                setPreferencias({ ...preferencias, notificacoesWhatsapp: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Promoções e Ofertas</Label>
              <p className="text-sm text-muted-foreground">
                Receba ofertas e promoções exclusivas
              </p>
            </div>
            <Switch
              checked={preferencias.promocoes}
              onCheckedChange={(checked) =>
                setPreferencias({ ...preferencias, promocoes: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Lembretes de Agendamento</Label>
              <p className="text-sm text-muted-foreground">
                Receba lembretes antes dos seus agendamentos
              </p>
            </div>
            <Switch
              checked={preferencias.lembretes}
              onCheckedChange={(checked) =>
                setPreferencias({ ...preferencias, lembretes: checked })
              }
            />
          </div>

          <Button onClick={handleSalvarPreferencias} className="w-full" disabled={salvando}>
            {salvando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Preferências
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Zona de Perigo
          </CardTitle>
          <CardDescription>
            Ações irreversíveis da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            A exclusão da conta é permanente e irá remover todos os seus dados, incluindo histórico de agendamentos e pontos de fidelidade. Esta ação não pode ser desfeita.
          </p>
          <Dialog open={isDialogExcluirOpen} onOpenChange={setIsDialogExcluirOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Conta (LGPD)
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-destructive">Excluir Conta</DialogTitle>
                <DialogDescription>
                  Esta ação é irreversível. Todos os seus dados serão excluídos conforme a LGPD.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-destructive/10 rounded-lg">
                  <p className="text-sm font-medium text-destructive">
                    Ao excluir sua conta, você perderá:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 list-disc list-inside">
                    <li>Histórico completo de agendamentos</li>
                    <li>Pontos de fidelidade acumulados</li>
                    <li>Créditos disponíveis</li>
                    <li>Avaliações realizadas</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmarExclusao">
                    Digite <span className="font-bold">EXCLUIR</span> para confirmar
                  </Label>
                  <Input
                    id="confirmarExclusao"
                    value={confirmarExclusao}
                    onChange={(e) => setConfirmarExclusao(e.target.value)}
                    placeholder="EXCLUIR"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsDialogExcluirOpen(false);
                  setConfirmarExclusao("");
                }}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleExcluirConta}
                  disabled={excluindo || confirmarExclusao !== "EXCLUIR"}
                >
                  {excluindo ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    "Excluir Conta Permanentemente"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
