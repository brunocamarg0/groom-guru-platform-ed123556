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
import { Button } from "@/components/ui/button";
import { Gift, Star, TrendingUp, Award, Percent, CheckCircle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

export default function Fidelidade() {
  const { fidelidade, cliente, agendamentos, carregarDados } = useCliente();

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

  const nivelConfig: Record<string, { label: string; cor: string; descricao: string; icone: string }> = {
    bronze: { label: "Bronze", cor: "bg-amber-600", descricao: "Iniciante", icone: "🥉" },
    prata: { label: "Prata", cor: "bg-gray-400", descricao: "Fiel", icone: "🥈" },
    ouro: { label: "Ouro", cor: "bg-yellow-500", descricao: "VIP", icone: "🥇" },
    diamante: { label: "Diamante", cor: "bg-blue-500", descricao: "Premium", icone: "💎" },
  };

  // Normalizar o nível para minúsculas para garantir que encontre no config
  const nivelKey = (fidelidade?.nivel || "bronze").toLowerCase();
  const nivel = nivelConfig[nivelKey] || nivelConfig.bronze;
  
  // Proteção contra divisão por zero
  const totalCortes = fidelidade.cortesRealizados + (fidelidade.proximoDesconto?.cortesNecessarios || 5);
  const progresso = totalCortes > 0 ? (fidelidade.cortesRealizados / totalCortes) * 100 : 0;

  // Calcular progresso para o próximo nível
  const niveisOrdem = ['bronze', 'prata', 'ouro', 'diamante'];
  const nivelAtualIndex = niveisOrdem.indexOf(nivelKey);
  const cortesParaProximoNivel = [5, 15, 30, 50];
  const progressoNivel = nivelAtualIndex < 3 
    ? (fidelidade.cortesRealizados / cortesParaProximoNivel[nivelAtualIndex + 1]) * 100
    : 100;

  // Benefícios por nível
  const beneficiosPorNivel = {
    bronze: ["5% de desconto a cada 5 cortes", "10 pontos por avaliação"],
    prata: ["10% de desconto a cada 5 cortes", "15 pontos por avaliação", "Prioridade no agendamento"],
    ouro: ["15% de desconto a cada 5 cortes", "20 pontos por avaliação", "Prioridade no agendamento", "Acesso a promoções exclusivas"],
    diamante: ["20% de desconto a cada 5 cortes", "25 pontos por avaliação", "Prioridade máxima", "Promoções exclusivas", "Brindes especiais"],
  };

  const beneficiosAtuais = beneficiosPorNivel[nivelKey as keyof typeof beneficiosPorNivel] || beneficiosPorNivel.bronze;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fidelidade & Benefícios</h2>
          <p className="text-muted-foreground">
            Seu programa de pontos e benefícios exclusivos
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => carregarDados && carregarDados()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-yellow-500" />
              Pontos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{fidelidade.pontos}</div>
            <p className="text-xs text-muted-foreground mt-1">pontos acumulados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Cortes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{fidelidade.cortesRealizados}</div>
            <p className="text-xs text-muted-foreground mt-1">cortes realizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4" />
              Nível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{nivel.icone}</span>
              <Badge className={`${nivel.cor} text-white`}>{nivel.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{nivel.descricao}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Percent className="h-4 w-4 text-primary" />
              Próximo Desconto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{fidelidade.proximoDesconto?.desconto || 5}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              em {fidelidade.proximoDesconto?.cortesNecessarios || 5} corte(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progresso para Próximo Desconto */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso para Próximo Desconto</CardTitle>
          <CardDescription>
            Continue agendando para ganhar benefícios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>
                {fidelidade.cortesRealizados % 5} de 5 cortes
              </span>
              <span>{Math.round((fidelidade.cortesRealizados % 5) / 5 * 100)}%</span>
            </div>
            <Progress value={(fidelidade.cortesRealizados % 5) / 5 * 100} className="h-3" />
          </div>
          <div className="p-4 bg-primary/10 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-medium">
                Faça mais {5 - (fidelidade.cortesRealizados % 5)} corte(s) e ganhe{" "}
                {fidelidade.proximoDesconto?.desconto || 5}% de desconto!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Válido no próximo serviço
              </p>
            </div>
            <Gift className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      {/* Progresso para Próximo Nível */}
      {nivelAtualIndex < 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Progresso para Próximo Nível</CardTitle>
            <CardDescription>
              Avance para {nivelConfig[niveisOrdem[nivelAtualIndex + 1]].label} e desbloqueie mais benefícios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>
                  {fidelidade.cortesRealizados} de {cortesParaProximoNivel[nivelAtualIndex + 1]} cortes
                </span>
                <span>{Math.min(Math.round(progressoNivel), 100)}%</span>
              </div>
              <Progress value={Math.min(progressoNivel, 100)} className="h-3" />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{nivel.icone}</span>
                <span className="font-medium">{nivel.label}</span>
              </div>
              <div className="flex-1 h-0.5 bg-muted"></div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{nivelConfig[niveisOrdem[nivelAtualIndex + 1]].icone}</span>
                <span className="font-medium text-muted-foreground">{nivelConfig[niveisOrdem[nivelAtualIndex + 1]].label}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benefícios do Nível Atual */}
      <Card>
        <CardHeader>
          <CardTitle>Seus Benefícios ({nivel.label})</CardTitle>
          <CardDescription>
            Vantagens exclusivas do seu nível atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {beneficiosAtuais.map((beneficio, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <p className="font-medium">{beneficio}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Como Ganhar Pontos */}
      <Card>
        <CardHeader>
          <CardTitle>Como Ganhar Pontos</CardTitle>
          <CardDescription>
            Acumule pontos e troque por benefícios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="bg-primary/10 p-2 rounded-full">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Avalie um Serviço</p>
                <p className="text-sm text-muted-foreground">
                  +10 a +25 pontos (depende do nível)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="bg-primary/10 p-2 rounded-full">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Complete 5 Cortes</p>
                <p className="text-sm text-muted-foreground">
                  Ganhe desconto no próximo
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="bg-primary/10 p-2 rounded-full">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Suba de Nível</p>
                <p className="text-sm text-muted-foreground">
                  Desbloqueie mais benefícios
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA para Agendar */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Pronto para seu próximo corte?</h3>
              <p className="text-muted-foreground">
                Agende agora e continue acumulando pontos!
              </p>
            </div>
            <Button asChild>
              <Link to="/cliente/agendar">
                Agendar Agora
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
