import { useState } from "react";
import { useNotificacoes } from "@/context/NotificacoesContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Mail, MessageSquare, Bell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TipoNotificacao, CanalNotificacao } from "@/types/notificacao";
import { useToast } from "@/hooks/use-toast";

export default function Notificacoes() {
  const { notificacoes, templates, criarNotificacao, criarTemplate } = useNotificacoes();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tipo: "automatica" as TipoNotificacao,
    titulo: "",
    mensagem: "",
    canais: [] as CanalNotificacao[],
    destinatarios: [] as string[],
  });

  const handleCriarNotificacao = () => {
    if (!formData.titulo || !formData.mensagem) {
      toast({
        title: "Erro",
        description: "Preencha título e mensagem.",
        variant: "destructive",
      });
      return;
    }

    criarNotificacao({
      ...formData,
      destinatarios: formData.destinatarios.length > 0 ? formData.destinatarios : ["todos"],
      status: "pendente",
    });

    toast({
      title: "Notificação criada",
      description: "Notificação será enviada em breve.",
    });
    setIsDialogOpen(false);
  };

  const toggleCanal = (canal: CanalNotificacao) => {
    setFormData({
      ...formData,
      canais: formData.canais.includes(canal)
        ? formData.canais.filter((c) => c !== canal)
        : [...formData.canais, canal],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notificações & Comunicação</h2>
          <p className="text-muted-foreground">
            Gerencie mensagens automáticas e templates de comunicação
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Notificação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Notificação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  value={formData.mensagem}
                  onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Canais</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.canais.includes("email")}
                      onCheckedChange={() => toggleCanal("email")}
                    />
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.canais.includes("whatsapp")}
                      onCheckedChange={() => toggleCanal("whatsapp")}
                    />
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      WhatsApp
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.canais.includes("interna")}
                      onCheckedChange={() => toggleCanal("interna")}
                    />
                    <Label className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Interna
                    </Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCriarNotificacao}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="notificacoes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="notificacoes">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Notificações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notificacoes.map((not) => (
                  <div key={not.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{not.titulo}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{not.mensagem}</p>
                        <div className="flex gap-2 mt-2">
                          {not.canais.map((canal) => (
                            <Badge key={canal} variant="secondary">
                              {canal}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge
                        variant={
                          not.status === "enviada"
                            ? "default"
                            : not.status === "falhou"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {not.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Templates de Notificação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {templates.map((template) => (
                  <div key={template.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{template.nome}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{template.conteudo}</p>
                      </div>
                      <Badge variant={template.ativo ? "default" : "secondary"}>
                        {template.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}



