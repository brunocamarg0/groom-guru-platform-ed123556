import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBarbearias } from "@/context/BarbeariasContext";
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
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { NovaBarbearia, PlanoContratado } from "@/types/barbearia";

export default function CadastrarBarbearia() {
  const navigate = useNavigate();
  const { adicionarBarbearia } = useBarbearias();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<NovaBarbearia>({
    nome: "",
    cnpjCpf: "",
    responsavel: "",
    plano: "basico",
    email: "",
    telefone: "",
    endereco: "",
    cidade: "",
    bairro: "",
    cep: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await adicionarBarbearia(formData);
      navigate("/admin");
    } catch (error: any) {
      // Erro já tratado no contexto com toast
      console.error('Erro ao cadastrar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nova Barbearia</h2>
          <p className="text-muted-foreground">
            Cadastre uma nova barbearia no sistema
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Barbearia</CardTitle>
          <CardDescription>
            Preencha os dados para cadastrar uma nova barbearia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Barbearia *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  required
                  placeholder="Ex: Barbearia do João"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpjCpf">CNPJ / CPF *</Label>
                <Input
                  id="cnpjCpf"
                  value={formData.cnpjCpf}
                  onChange={(e) =>
                    setFormData({ ...formData, cnpjCpf: e.target.value })
                  }
                  required
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável *</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) =>
                    setFormData({ ...formData, responsavel: e.target.value })
                  }
                  required
                  placeholder="Nome do responsável"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plano">Plano Contratado *</Label>
                <Select
                  value={formData.plano}
                  onValueChange={(value: PlanoContratado) =>
                    setFormData({ ...formData, plano: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basico">Básico</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="contato@barbearia.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) =>
                    setFormData({ ...formData, telefone: e.target.value })
                  }
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço (Rua e Número)</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) =>
                  setFormData({ ...formData, endereco: e.target.value })
                }
                placeholder="Rua, número"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro *</Label>
                <Input
                  id="bairro"
                  value={(formData as any).bairro || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, bairro: e.target.value } as any)
                  }
                  placeholder="Bairro"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade *</Label>
                <Input
                  id="cidade"
                  value={(formData as any).cidade || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, cidade: e.target.value } as any)
                  }
                  placeholder="Cidade"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={(formData as any).cep || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, cep: e.target.value } as any)
                  }
                  placeholder="00000-000"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Cadastrando..." : "Cadastrar Barbearia"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

