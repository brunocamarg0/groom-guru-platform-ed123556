import { useState } from "react";
import { useDono } from "@/context/DonoContext";
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
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, CheckCircle, Clock, Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ConfiguracoesBarbearia() {
  const { configuracao, atualizarConfiguracao } = useDono();
  const { toast } = useToast();
  const [formData, setFormData] = useState(configuracao);
  const [showAlterarSenha, setShowAlterarSenha] = useState(false);
  const [senhaForm, setSenhaForm] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });
  const [isAlterandoSenha, setIsAlterandoSenha] = useState(false);

  const handleSubmit = async () => {
    try {
      // Atualizar configuração local
      atualizarConfiguracao(formData);
      
      // Se houver mudança no modo de confirmação, atualizar no backend
      if (formData.modoConfirmacao) {
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        const barbeariaId = configuracao.id; // Assumindo que o ID da barbearia está no configuracao
        
        await fetch(`${apiUrl}/agendamentos/barbearia/${barbeariaId}/configuracao`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            modoConfirmacao: formData.modoConfirmacao,
          }),
        });
      }
      
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    }
  };

  const handleAlterarSenha = async () => {
    if (!senhaForm.senhaAtual || !senhaForm.novaSenha || !senhaForm.confirmarSenha) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para alterar a senha.",
        variant: "destructive",
      });
      return;
    }

    if (senhaForm.novaSenha !== senhaForm.confirmarSenha) {
      toast({
        title: "Senhas não coincidem",
        description: "A nova senha e a confirmação devem ser iguais.",
        variant: "destructive",
      });
      return;
    }

    if (senhaForm.novaSenha.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsAlterandoSenha(true);
    try {
      // Garantir que a URL base não tenha /api no final
      const baseUrl = (import.meta.env.VITE_API_URL || 'https://groom-guru-platform-production.up.railway.app').replace(/\/api\/?$/, '');
      const API_URL = `${baseUrl}/api`;
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token não encontrado. Faça login novamente.');
      }

      const urlCompleta = `${API_URL}/auth/dono/alterar-senha`;
      console.log('🔐 Tentando alterar senha...');
      console.log('🔐 Base URL:', baseUrl);
      console.log('🔐 API URL:', API_URL);
      console.log('🔐 URL completa:', urlCompleta);
      console.log('🔐 Token presente:', !!token);
      
      const response = await fetch(
        urlCompleta,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            senhaAtual: senhaForm.senhaAtual,
            novaSenha: senhaForm.novaSenha,
          }),
        }
      );

      console.log('🔐 Status da resposta:', response.status);
      console.log('🔐 Content-Type:', response.headers.get('content-type'));

      // Verificar se a resposta é JSON antes de fazer parse
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Resposta não é JSON:', text.substring(0, 200));
        
        // Se for 404, a rota não existe
        if (response.status === 404) {
          throw new Error('Rota não encontrada. Verifique se o backend está configurado corretamente.');
        }
        
        throw new Error(`Resposta inválida do servidor (${response.status}). Verifique se a rota está correta.`);
      }

      const data = await response.json();

      console.log('🔐 Resposta do servidor:', data);
      console.log('🔐 Status:', response.status);

      if (!response.ok) {
        const errorMessage = data.error || data.detalhes || 'Erro ao alterar senha';
        console.error('❌ Erro na resposta:', errorMessage);
        throw new Error(errorMessage);
      }

      toast({
        title: "Senha alterada!",
        description: "Sua senha foi alterada com sucesso. Use a nova senha no próximo login.",
      });

      setShowAlterarSenha(false);
      setSenhaForm({
        senhaAtual: "",
        novaSenha: "",
        confirmarSenha: "",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Ocorreu um erro ao alterar a senha.",
        variant: "destructive",
      });
    } finally {
      setIsAlterandoSenha(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações da Barbearia</h2>
        <p className="text-muted-foreground">
          Gerencie as configurações da sua barbearia
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Barbearia</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ/CPF</Label>
            <Input
              id="cnpj"
              value={formData.cnpjCpf}
              onChange={(e) => setFormData({ ...formData, cnpjCpf: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horário de Funcionamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(formData.horarioFuncionamento).map(([dia, horario]) => (
            <div key={dia} className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <Label className="w-24 capitalize">{dia}</Label>
                <Switch
                  checked={horario.aberto}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      horarioFuncionamento: {
                        ...formData.horarioFuncionamento,
                        [dia]: { ...horario, aberto: checked },
                      },
                    })
                  }
                />
                {horario.aberto && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={horario.inicio}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          horarioFuncionamento: {
                            ...formData.horarioFuncionamento,
                            [dia]: { ...horario, inicio: e.target.value },
                          },
                        })
                      }
                      className="w-32"
                    />
                    <span>até</span>
                    <Input
                      type="time"
                      value={horario.fim}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          horarioFuncionamento: {
                            ...formData.horarioFuncionamento,
                            [dia]: { ...horario, fim: e.target.value },
                          },
                        })
                      }
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Política de Cancelamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prazoMinimo">Prazo Mínimo (horas antes)</Label>
            <Input
              id="prazoMinimo"
              type="number"
              value={formData.politicaCancelamento.prazoMinimo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  politicaCancelamento: {
                    ...formData.politicaCancelamento,
                    prazoMinimo: parseInt(e.target.value) || 0,
                  },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="permitirReagendamento">Permitir Reagendamento</Label>
            <Switch
              id="permitirReagendamento"
              checked={formData.politicaCancelamento.permitirReagendamento}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  politicaCancelamento: {
                    ...formData.politicaCancelamento,
                    permitirReagendamento: checked,
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Link de Agendamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>URL Pública</Label>
            <Input value={formData.linkAgendamento} readOnly />
            <p className="text-xs text-muted-foreground">
              Este é o link que seus clientes usarão para agendar
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modo de Confirmação de Agendamentos</CardTitle>
          <CardDescription>
            Configure como os agendamentos serão confirmados automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modoConfirmacao">Modo de Confirmação</Label>
            <Select
              value={formData.modoConfirmacao || "hibrido"}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  modoConfirmacao: value as "automatico" | "manual" | "hibrido",
                })
              }
            >
              <SelectTrigger id="modoConfirmacao">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="automatico">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">Automático</div>
                      <div className="text-xs text-muted-foreground">
                        Agendamentos são confirmados automaticamente
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="manual">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium">Manual</div>
                      <div className="text-xs text-muted-foreground">
                        Você precisa confirmar cada agendamento
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="hibrido">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="font-medium">Híbrido (Recomendado)</div>
                      <div className="text-xs text-muted-foreground">
                        Automático, mas você pode recusar em até 2 horas
                      </div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">Como funciona:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              {formData.modoConfirmacao === "automatico" && (
                <>
                  <li>Agendamentos são confirmados imediatamente</li>
                  <li>Cliente recebe notificação automática</li>
                  <li>Você não precisa fazer nada</li>
                </>
              )}
              {formData.modoConfirmacao === "manual" && (
                <>
                  <li>Agendamentos ficam pendentes até você confirmar</li>
                  <li>Você tem controle total sobre cada agendamento</li>
                  <li>Cliente só recebe confirmação após sua aprovação</li>
                </>
              )}
              {formData.modoConfirmacao === "hibrido" && (
                <>
                  <li>Agendamentos são confirmados automaticamente</li>
                  <li>Cliente recebe notificação imediata</li>
                  <li>Você pode recusar em até 2 horas após a confirmação</li>
                  <li>Após 2 horas, não é mais possível recusar</li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
          <CardDescription>
            Gerencie a segurança da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Senha da Conta</Label>
                <p className="text-sm text-muted-foreground">
                  Altere sua senha de acesso ao sistema
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowAlterarSenha(true)}
              >
                <Lock className="h-4 w-4 mr-2" />
                Alterar Senha
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit}>Salvar Configurações</Button>
      </div>

      {/* Dialog de Alteração de Senha */}
      <Dialog open={showAlterarSenha} onOpenChange={setShowAlterarSenha}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Digite sua senha atual e a nova senha desejada
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senhaAtual">Senha Atual</Label>
              <Input
                id="senhaAtual"
                type="password"
                value={senhaForm.senhaAtual}
                onChange={(e) => setSenhaForm({ ...senhaForm, senhaAtual: e.target.value })}
                placeholder="Digite sua senha atual"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova Senha</Label>
              <Input
                id="novaSenha"
                type="password"
                value={senhaForm.novaSenha}
                onChange={(e) => setSenhaForm({ ...senhaForm, novaSenha: e.target.value })}
                placeholder="Digite a nova senha (mín. 6 caracteres)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
              <Input
                id="confirmarSenha"
                type="password"
                value={senhaForm.confirmarSenha}
                onChange={(e) => setSenhaForm({ ...senhaForm, confirmarSenha: e.target.value })}
                placeholder="Confirme a nova senha"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAlterarSenha(false);
                setSenhaForm({
                  senhaAtual: "",
                  novaSenha: "",
                  confirmarSenha: "",
                });
              }}
              disabled={isAlterandoSenha}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAlterarSenha}
              disabled={isAlterandoSenha}
            >
              {isAlterandoSenha ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Alterando...
                </>
              ) : (
                "Alterar Senha"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}







