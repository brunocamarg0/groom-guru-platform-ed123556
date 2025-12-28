import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { Barbearia, PlanoContratado } from "@/types/barbearia";

export default function EditarBarbearia() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBarbearia, editarBarbearia } = useBarbearias();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [barbearia, setBarbearia] = useState<Barbearia | undefined>();
  const [formData, setFormData] = useState<Partial<Barbearia>>({
    nome: "",
    cnpjCpf: "",
    responsavel: "",
    plano: "basico",
    email: "",
    telefone: "",
    endereco: "",
  });

  useEffect(() => {
    if (id) {
      const data = getBarbearia(id);
      if (data) {
        setBarbearia(data);
        setFormData({
          nome: data.nome,
          cnpjCpf: data.cnpjCpf,
          responsavel: data.responsavel,
          plano: data.plano,
          email: data.email || "",
          telefone: data.telefone || "",
          endereco: data.endereco || "",
        });
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

  if (!barbearia) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando dados da barbearia...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (id) {
        editarBarbearia(id, formData);
        toast({
          title: "Barbearia atualizada",
          description: `${formData.nome} foi atualizada com sucesso.`,
        });
        navigate("/admin");
      }
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar a barbearia.",
        variant: "destructive",
      });
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
          <h2 className="text-3xl font-bold tracking-tight">Editar Barbearia</h2>
          <p className="text-muted-foreground">
            Atualize os dados da barbearia
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Barbearia</CardTitle>
          <CardDescription>
            Edite os dados da barbearia conforme necessário
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
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, telefone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={formData.endereco || ""}
                onChange={(e) =>
                  setFormData({ ...formData, endereco: e.target.value })
                }
              />
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
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

