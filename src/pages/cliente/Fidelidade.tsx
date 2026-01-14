import { useCliente } from "@/context/ClienteContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gift, Star, TrendingUp, Award, Calendar } from "lucide-react";

export default function Fidelidade() {
  const { fidelidade, cliente } = useCliente();

  // Proteção contra undefined
  if (!fidelidade) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando dados de fidelidade...</p>
        </div>
      </div>
    );
  }

  const nivelConfig: Record<string, { label: string; cor: string; descricao: string }> = {
    bronze: { label: "Bronze", cor: "bg-amber-600", descricao: "Iniciante" },
    prata: { label: "Prata", cor: "bg-gray-400", descricao: "Fiel" },
    ouro: { label: "Ouro", cor: "bg-yellow-500", descricao: "VIP" },
    diamante: { label: "Diamante", cor: "bg-blue-500", descricao: "Premium" },
  };

  // Normalizar o nível para minúsculas para garantir que encontre no config
  const nivelKey = (fidelidade?.nivel || "bronze").toLowerCase();
  const nivel = nivelConfig[nivelKey] || nivelConfig.bronze;
  
  // Proteção contra divisão por zero
  const totalCortes = fidelidade.cortesRealizados + (fidelidade.proximoDesconto?.cortesNecessarios || 5);
  const progresso = totalCortes > 0 ? (fidelidade.cortesRealizados / totalCortes) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Fidelidade & Benefícios</h2>
        <p className="text-muted-foreground">
          Seu programa de pontos e benefícios exclusivos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Pontos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{fidelidade.pontos}</div>
            <p className="text-sm text-muted-foreground mt-1">pontos acumulados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Cortes Realizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{fidelidade.cortesRealizados}</div>
            <p className="text-sm text-muted-foreground mt-1">total de cortes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Nível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={`${nivel.cor} text-white`}>{nivel.label}</Badge>
            <p className="text-sm text-muted-foreground mt-1">{nivel.descricao}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximo Desconto</CardTitle>
          <CardDescription>
            Continue agendando para ganhar benefícios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>
                {fidelidade.cortesRealizados} de{" "}
                {fidelidade.cortesRealizados + (fidelidade.proximoDesconto?.cortesNecessarios || 5)}{" "}
                cortes
              </span>
              <span>{Math.round(progresso)}%</span>
            </div>
            <Progress value={progresso} />
          </div>
          <div className="p-4 bg-primary/10 rounded-lg">
            <p className="font-medium">
              Faça mais {fidelidade.proximoDesconto?.cortesNecessarios || 5} corte(s) e ganhe{" "}
              {fidelidade.proximoDesconto?.desconto || 5}% de desconto no próximo!
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Benefícios do Programa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Gift className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Pontos por Avaliação</p>
                <p className="text-sm text-muted-foreground">
                  Ganhe 10 pontos cada vez que avaliar um atendimento
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Gift className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Descontos Progressivos</p>
                <p className="text-sm text-muted-foreground">
                  A cada 5 cortes, ganhe descontos exclusivos
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Gift className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Promoções Exclusivas</p>
                <p className="text-sm text-muted-foreground">
                  Receba ofertas especiais baseadas no seu nível
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

