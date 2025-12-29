import { useState } from "react";
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
import { Key, Bell, Mail, MessageSquare, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ConfiguracoesCliente() {
  const toast = useToast();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [isDialogSenhaOpen, setIsDialogSenhaOpen] = useState(false);
  const [isDialogExcluirOpen, setIsDialogExcluirOpen] = useState(false);

  const [preferencias, setPreferencias] = useState({
    notificacoesApp: true,
    notificacoesEmail: true,
    notificacoesWhatsapp: false,
    promocoes: true,
    lembretes: true,
  });

  const handleAlterarSenha = () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos.",
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

    toast({
      title: "Senha alterada",
      description: "Sua senha foi alterada com sucesso.",
    });
    setIsDialogSenhaOpen(false);
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
  };

  const handleExcluirConta = () => {
    toast({
      title: "Conta excluída",
      description: "Sua conta foi excluída conforme LGPD.",
    });
    setIsDialogExcluirOpen(false);
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
            Altere sua senha de acesso
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="novaSenha">Nova Senha</Label>
                  <Input
                    id="novaSenha"
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogSenhaOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAlterarSenha}>Alterar Senha</Button>
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
                Receba notificações por email
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
                Receba notificações via WhatsApp
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
              <Label>Promoções</Label>
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
          <Dialog open={isDialogExcluirOpen} onOpenChange={setIsDialogExcluirOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Conta (LGPD)
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Excluir Conta</DialogTitle>
                <DialogDescription>
                  Esta ação é irreversível. Todos os seus dados serão excluídos conforme a LGPD.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">
                  Tem certeza que deseja excluir sua conta? Todos os seus dados serão
                  permanentemente removidos.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogExcluirOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleExcluirConta}>
                  Excluir Conta
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

