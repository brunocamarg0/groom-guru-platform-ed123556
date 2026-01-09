import { useState } from "react";
import { useCliente } from "@/context/ClienteContext";
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
import { User, Mail, Phone, Calendar, Scissors } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TipoServico } from "@/types/cliente";

export default function PerfilCliente() {
  const { cliente, atualizarPerfil } = useCliente();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome: cliente.nome,
    email: cliente.email,
    telefone: cliente.telefone,
    dataNascimento: cliente.dataNascimento || "",
    profissionalFavorito: cliente.preferencias.profissionalFavorito || "",
    servicoPreferido: cliente.preferencias.servicoPreferido || undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    atualizarPerfil({
      nome: formData.nome,
      email: formData.email,
      telefone: formData.telefone,
      dataNascimento: formData.dataNascimento || undefined,
      preferencias: {
        profissionalFavorito: formData.profissionalFavorito || undefined,
        servicoPreferido: formData.servicoPreferido,
      },
    });
    toast({
      title: "Perfil atualizado",
      description: "Suas informações foram atualizadas com sucesso.",
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Meu Perfil</h2>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              Atualize seus dados de cadastro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="nome"
                  className="pl-9"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-9"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="telefone"
                  className="pl-9"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataNascimento">Data de Nascimento</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dataNascimento"
                  type="date"
                  className="pl-9"
                  value={formData.dataNascimento}
                  onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferências</CardTitle>
            <CardDescription>
              Configure suas preferências de agendamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="servicoPreferido">Serviço Preferido</Label>
              <div className="relative">
                <Scissors className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Select
                  value={formData.servicoPreferido || ""}
                  onValueChange={(value: TipoServico) =>
                    setFormData({ ...formData, servicoPreferido: value })
                  }
                >
                  <SelectTrigger className="pl-9">
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corte">Corte</SelectItem>
                    <SelectItem value="barba">Barba</SelectItem>
                    <SelectItem value="combo">Combo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Salvar Alterações</Button>
        </div>
      </form>
    </div>
  );
}



