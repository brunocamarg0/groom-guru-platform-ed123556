import { useState, useEffect } from "react";
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
import { Loader2, Lock, CheckCircle, Clock, Settings, Upload, Image as ImageIcon, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfiguracaoBarbearia } from "@/types/dono";
import LinkAgendamentoCard from "@/components/dono/LinkAgendamentoCard";
import { buscarCep, formatarCep } from "@/lib/viacep";
import { toast as sonnerToast } from "sonner";

// Função para comprimir imagem (reduz tamanho para evitar problemas)
const compressImage = (file: File, maxWidth: number = 600, maxHeight: number = 600, quality: number = 0.7): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calcular novas dimensões mantendo proporção
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível criar contexto do canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Erro ao comprimir imagem'));
            }
          },
          file.type,
          quality
        );
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
};

// Configuração padrão segura
const configuracaoPadrao: ConfiguracaoBarbearia = {
  id: "",
  nome: "",
  cnpjCpf: "",
  modoConfirmacao: "hibrido",
  horarioFuncionamento: {
    segunda: { aberto: true, inicio: "09:00", fim: "18:00" },
    terca: { aberto: true, inicio: "09:00", fim: "18:00" },
    quarta: { aberto: true, inicio: "09:00", fim: "18:00" },
    quinta: { aberto: true, inicio: "09:00", fim: "18:00" },
    sexta: { aberto: true, inicio: "09:00", fim: "19:00" },
    sabado: { aberto: true, inicio: "08:00", fim: "17:00" },
    domingo: { aberto: false, inicio: "09:00", fim: "13:00" },
  },
  politicaCancelamento: {
    prazoMinimo: 2,
    permitirReagendamento: true,
  },
  linkAgendamento: "",
  paginaPublica: true,
};

export default function ConfiguracoesBarbearia() {
  const { configuracao, atualizarConfiguracao } = useDono();
  const { toast } = useToast();
  
  // Função para garantir que temos uma configuração válida
  const getConfiguracaoSegura = (config: ConfiguracaoBarbearia | undefined | null): ConfiguracaoBarbearia => {
    if (!config) return configuracaoPadrao;
    
    return {
      ...configuracaoPadrao,
      ...config,
      horarioFuncionamento: {
        ...configuracaoPadrao.horarioFuncionamento,
        ...(config.horarioFuncionamento || {}),
      },
      politicaCancelamento: {
        ...configuracaoPadrao.politicaCancelamento,
        ...(config.politicaCancelamento || {}),
      },
    };
  };

  const [formData, setFormData] = useState<ConfiguracaoBarbearia>(() => 
    getConfiguracaoSegura(configuracao)
  );

  // Atualizar formData quando configuracao mudar
  useEffect(() => {
    if (configuracao) {
      setFormData(getConfiguracaoSegura(configuracao));
    }
  }, [configuracao]);
  const [showAlterarSenha, setShowAlterarSenha] = useState(false);
  const [senhaForm, setSenhaForm] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });
  const [isAlterandoSenha, setIsAlterandoSenha] = useState(false);

  const handleSubmit = async () => {
    try {

      // Validação: bairro e cidade são obrigatórios
      if (!formData.bairro || !formData.cidade) {
        toast({
          title: "Campos obrigatórios",
          description: "Bairro e Cidade são obrigatórios para que clientes possam encontrar sua barbearia.",
          variant: "destructive",
        });
        return;
      }

      // Preparar dados para envio (sem campos que não devem ser enviados)
      const dadosParaEnvio: Partial<ConfiguracaoBarbearia> = {
        nome: formData.nome,
        cnpjCpf: formData.cnpjCpf,
        email: formData.email,
        telefone: formData.telefone,
        endereco: formData.endereco,
        cidade: formData.cidade,
        bairro: formData.bairro,
        cep: formData.cep,
        modoConfirmacao: formData.modoConfirmacao,
        foto: formData.foto, // Incluir foto se existir
      };

      // Se a foto for muito grande (mais de 2MB em base64), avisar
      if (formData.foto && formData.foto.length > 2000000) {
        toast({
          title: "Foto muito grande",
          description: "A foto é muito grande (mais de 2MB). Por favor, use uma imagem menor.",
          variant: "destructive",
        });
        return;
      }

      console.log('💾 [CONFIG PÁGINA] Salvando configurações...', {
        temFoto: !!dadosParaEnvio.foto,
        tamanhoFoto: dadosParaEnvio.foto ? dadosParaEnvio.foto.length : 0,
      });

      // Atualizar configuração no backend (aguardar a promise)
      await atualizarConfiguracao(dadosParaEnvio);
      
      // Toast de sucesso já é mostrado pela função atualizarConfiguracao
    } catch (error: any) {
      console.error('❌ [CONFIG PÁGINA] Erro ao salvar configurações:', error);
      
      // Se for erro 401, redirecionar para login
      if (error?.status === 401) {
        toast({
          title: "Sessão expirada",
          description: "Sua sessão expirou. Por favor, faça login novamente.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = '/login?tab=owner';
        }, 2000);
        return;
      }
      
      // Outros erros
      toast({
        title: "Erro ao salvar",
        description: error?.message || "Não foi possível salvar as configurações. Verifique os dados e tente novamente.",
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
      
      let response: Response;
      try {
        response = await fetch(
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
      } catch (fetchError: any) {
        console.error('❌ Erro de rede ao fazer requisição:', fetchError);
        throw new Error(`Erro de conexão: ${fetchError.message || 'Não foi possível conectar ao servidor'}`);
      }

      console.log('🔐 Status da resposta:', response.status);
      console.log('🔐 Status Text:', response.statusText);
      console.log('🔐 Content-Type:', response.headers.get('content-type'));
      console.log('🔐 Response OK:', response.ok);

      // Tentar ler a resposta como texto primeiro para debug
      const responseText = await response.text();
      console.log('🔐 Resposta bruta (primeiros 500 chars):', responseText.substring(0, 500));

      // Verificar se a resposta é JSON
      const contentType = response.headers.get('content-type');
      let data: any;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = JSON.parse(responseText);
          console.log('🔐 Resposta parseada (JSON):', data);
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse do JSON:', parseError);
          throw new Error(`Resposta inválida do servidor: ${responseText.substring(0, 200)}`);
        }
      } else {
        console.error('❌ Resposta não é JSON. Content-Type:', contentType);
        console.error('❌ Resposta completa:', responseText);
        
        // Se for 404, a rota não existe
        if (response.status === 404) {
          throw new Error('Rota não encontrada. Verifique se o backend está configurado corretamente.');
        }
        
        throw new Error(`Resposta inválida do servidor (${response.status}): ${responseText.substring(0, 200)}`);
      }

      if (!response.ok) {
        // Extrair mensagem de erro de várias formas possíveis
        const errorMessage = data?.error || data?.message || data?.detalhes || data?.mensagem || `Erro do servidor (${response.status})`;
        console.error('❌ Erro na resposta:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
          errorMessage: errorMessage
        });
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
      console.error('❌ Erro completo ao alterar senha:', error);
      console.error('❌ Tipo do erro:', typeof error);
      console.error('❌ Erro.message:', error.message);
      console.error('❌ Erro.stack:', error.stack);
      
      // Extrair mensagem de erro de várias formas
      let errorMessage = 'Ocorreu um erro ao alterar a senha.';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.error) {
        errorMessage = error.error;
      }
      
      console.error('❌ Mensagem de erro final:', errorMessage);
      
      toast({
        title: "Erro ao alterar senha",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAlterandoSenha(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Configurações da Barbearia</h2>
        <p className="text-muted-foreground">
          Gerencie as configurações da sua barbearia
        </p>
      </div>

      <LinkAgendamentoCard />



      <Card>
        <CardHeader>
          <CardTitle>Foto da Barbearia</CardTitle>
          <CardDescription>
            Adicione uma foto da sua barbearia. Esta foto aparecerá no painel dos clientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24 border-2 border-primary/20">
              <AvatarImage src={formData.foto || undefined} alt={formData.nome || "Barbearia"} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {formData.nome ? formData.nome.charAt(0).toUpperCase() : "B"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Label htmlFor="foto-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {formData.foto ? "Alterar Foto" : "Adicionar Foto"}
                    </span>
                  </Button>
                </Label>
                <Input
                  id="foto-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validar tamanho (máximo 2MB para evitar problemas)
                      if (file.size > 2 * 1024 * 1024) {
                        toast({
                          title: "Erro",
                          description: "A imagem deve ter no máximo 2MB. Por favor, comprima a imagem antes de enviar.",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      // Validar tipo
                      if (!file.type.startsWith('image/')) {
                        toast({
                          title: "Erro",
                          description: "Por favor, selecione uma imagem válida.",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      try {
                        // Comprimir e redimensionar a imagem antes de converter para base64
                        const compressedImage = await compressImage(file);
                        
                        // Converter para base64
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const base64String = reader.result as string;
                          setFormData({ ...formData, foto: base64String });
                          toast({
                            title: "Foto carregada",
                            description: "Foto pronta para salvar. Clique em 'Salvar Configurações'.",
                          });
                        };
                        reader.onerror = () => {
                          toast({
                            title: "Erro",
                            description: "Erro ao ler a imagem. Tente novamente.",
                            variant: "destructive",
                          });
                        };
                        reader.readAsDataURL(compressedImage);
                      } catch (error) {
                        console.error('Erro ao processar imagem:', error);
                        toast({
                          title: "Erro",
                          description: "Erro ao processar a imagem. Tente novamente.",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                />
                {formData.foto && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({ ...formData, foto: undefined });
                      // Limpar input file
                      const input = document.getElementById('foto-upload') as HTMLInputElement;
                      if (input) input.value = '';
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remover
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Barbearia</Label>
            <Input
              id="nome"
              value={formData.nome || ""}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ/CPF</Label>
            <Input
              id="cnpj"
              value={formData.cnpjCpf || ""}
              onChange={(e) => setFormData({ ...formData, cnpjCpf: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone || ""}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(11) 96123-4567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço (Rua e Número)</Label>
            <Input
              id="endereco"
              value={formData.endereco || ""}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              placeholder="Rua, número, complemento"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro *</Label>
              <Input
                id="bairro"
                value={formData.bairro || ""}
                onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                placeholder="Bairro"
                required
              />
              <p className="text-xs text-muted-foreground">
                Obrigatório para que clientes encontrem sua barbearia
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade *</Label>
              <Input
                id="cidade"
                value={formData.cidade || ""}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                placeholder="Cidade"
                required
              />
              <p className="text-xs text-muted-foreground">
                Obrigatório para que clientes encontrem sua barbearia
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={formData.cep || ""}
                onChange={async (e) => {
                  const formatted = formatarCep(e.target.value);
                  setFormData({ ...formData, cep: formatted });
                  if (formatted.replace(/\D/g, "").length === 8) {
                    const end = await buscarCep(formatted);
                    if (end) {
                      setFormData((prev: any) => ({
                        ...prev,
                        cep: formatted,
                        endereco: end.logradouro || prev.endereco,
                        bairro: end.bairro || prev.bairro,
                        cidade: end.cidade
                          ? `${end.cidade}${end.uf ? "/" + end.uf : ""}`
                          : prev.cidade,
                      }));
                      sonnerToast.success("Endereço encontrado!");
                    } else {
                      sonnerToast.error("CEP não encontrado");
                    }
                  }
                }}
                placeholder="00000-000"
                maxLength={9}
              />
              <p className="text-xs text-muted-foreground">
                Preenche endereço, bairro e cidade automaticamente
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horário de Funcionamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.horarioFuncionamento && Object.entries(formData.horarioFuncionamento)
            .filter(([_, horario]) => horario && typeof horario === 'object')
            .map(([dia, horario]) => {
              const horarioSeguro = horario || { aberto: false, inicio: "09:00", fim: "18:00" };
              return (
                <div key={dia} className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Label className="w-24 capitalize">{dia}</Label>
                    <Switch
                      checked={horarioSeguro.aberto || false}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          horarioFuncionamento: {
                            ...formData.horarioFuncionamento,
                            [dia]: { ...horarioSeguro, aberto: checked },
                          },
                        })
                      }
                    />
                    {horarioSeguro.aberto && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={horarioSeguro.inicio || "09:00"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              horarioFuncionamento: {
                                ...formData.horarioFuncionamento,
                                [dia]: { ...horarioSeguro, inicio: e.target.value },
                              },
                            })
                          }
                          className="w-32"
                        />
                        <span>até</span>
                        <Input
                          type="time"
                          value={horarioSeguro.fim || "18:00"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              horarioFuncionamento: {
                                ...formData.horarioFuncionamento,
                                [dia]: { ...horarioSeguro, fim: e.target.value },
                              },
                            })
                          }
                          className="w-32"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
              value={formData.politicaCancelamento?.prazoMinimo || 2}
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
              checked={formData.politicaCancelamento?.permitirReagendamento ?? true}
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
            <Input value={formData.linkAgendamento || ""} readOnly />
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







