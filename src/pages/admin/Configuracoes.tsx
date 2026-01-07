import { useConfiguracao } from "@/context/ConfiguracaoContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Save, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Configuracoes() {
  const { configuracao, atualizarConfiguracao, alternarModoManutencao } = useConfiguracao();
  const { toast } = useToast();
  const [formData, setFormData] = useState(configuracao);

  const handleSalvar = () => {
    atualizarConfiguracao(formData);
    toast({
      title: "Configurações salvas",
      description: "As configurações foram atualizadas com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações da Plataforma</h2>
        <p className="text-muted-foreground">
          Configure as opções gerais da plataforma
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nomeSistema">Nome do Sistema</Label>
            <Input
              id="nomeSistema"
              value={formData.nomeSistema}
              onChange={(e) => setFormData({ ...formData, nomeSistema: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dominio">Domínio</Label>
            <Input
              id="dominio"
              value={formData.dominio}
              onChange={(e) => setFormData({ ...formData, dominio: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emailContato">Email de Contato</Label>
            <Input
              id="emailContato"
              type="email"
              value={formData.emailContato}
              onChange={(e) => setFormData({ ...formData, emailContato: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefoneContato">Telefone de Contato</Label>
            <Input
              id="telefoneContato"
              value={formData.telefoneContato || ""}
              onChange={(e) => setFormData({ ...formData, telefoneContato: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Termos e Políticas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="termosUso">Termos de Uso</Label>
            <Textarea
              id="termosUso"
              value={formData.termosUso || ""}
              onChange={(e) => setFormData({ ...formData, termosUso: e.target.value })}
              rows={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="politicaPrivacidade">Política de Privacidade</Label>
            <Textarea
              id="politicaPrivacidade"
              value={formData.politicaPrivacidade || ""}
              onChange={(e) => setFormData({ ...formData, politicaPrivacidade: e.target.value })}
              rows={6}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modo Manutenção</CardTitle>
          <CardDescription>
            Quando ativado, apenas administradores podem acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar Modo Manutenção</Label>
              <p className="text-sm text-muted-foreground">
                Bloqueia o acesso de usuários durante manutenções
              </p>
            </div>
            <Switch
              checked={formData.modoManutencao}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, modoManutencao: checked });
                alternarModoManutencao();
              }}
            />
          </div>
          {formData.modoManutencao && (
            <div className="space-y-2">
              <Label htmlFor="mensagemManutencao">Mensagem de Manutenção</Label>
              <Textarea
                id="mensagemManutencao"
                value={formData.mensagemManutencao || ""}
                onChange={(e) => setFormData({ ...formData, mensagemManutencao: e.target.value })}
                placeholder="Sistema em manutenção. Voltaremos em breve."
                rows={3}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSalvar}>
          <Save className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}



