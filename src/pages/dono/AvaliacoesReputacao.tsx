import { useState } from "react";
import { useDono } from "@/context/DonoContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, MessageSquare, ThumbsUp, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { AvaliacaoDono } from "@/types/dono";

export default function AvaliacoesReputacao() {
  const { avaliacoes, responderAvaliacao } = useDono();
  const [modalResposta, setModalResposta] = useState(false);
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState<AvaliacaoDono | null>(null);
  const [resposta, setResposta] = useState("");
  const [salvando, setSalvando] = useState(false);

  const notaMedia = avaliacoes.length > 0
    ? avaliacoes.reduce((sum, a) => sum + (a.notaProfissional + a.notaAtendimento + a.notaAmbiente) / 3, 0) / avaliacoes.length
    : 0;

  const avaliacoesPendentes = avaliacoes.filter((a) => !a.resposta);
  const avaliacoesPositivas = avaliacoes.filter((a) => {
    const media = (a.notaProfissional + a.notaAtendimento + a.notaAmbiente) / 3;
    return media >= 4;
  });
  const avaliacoesNegativas = avaliacoes.filter((a) => {
    const media = (a.notaProfissional + a.notaAtendimento + a.notaAmbiente) / 3;
    return media < 3;
  });

  const abrirModalResposta = (avaliacao: AvaliacaoDono) => {
    setAvaliacaoSelecionada(avaliacao);
    setResposta(avaliacao.resposta || "");
    setModalResposta(true);
  };

  const handleResponder = async () => {
    if (!avaliacaoSelecionada || !resposta.trim()) {
      toast.error("Digite uma resposta");
      return;
    }

    setSalvando(true);
    try {
      await responderAvaliacao(avaliacaoSelecionada.id, resposta);
      setModalResposta(false);
      setResposta("");
      setAvaliacaoSelecionada(null);
    } catch (error) {
      console.error("Erro ao responder avaliação:", error);
    } finally {
      setSalvando(false);
    }
  };

  const renderStars = (nota: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= nota
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const getNotaColor = (nota: number) => {
    if (nota >= 4) return "text-green-600";
    if (nota >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Avaliações & Reputação</h2>
        <p className="text-muted-foreground">
          Gerencie avaliações e comentários dos clientes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Nota Média Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getNotaColor(notaMedia)}`}>
              {notaMedia.toFixed(1)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {renderStars(Math.round(notaMedia))}
              <p className="text-xs text-muted-foreground ml-2">
                {avaliacoes.length} avaliações
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {avaliacoesPendentes.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando resposta
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Positivas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
              {avaliacoesPositivas.length}
              <ThumbsUp className="h-5 w-5" />
            </div>
            <p className="text-xs text-muted-foreground">
              Nota 4+
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Atenção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 flex items-center gap-2">
              {avaliacoesNegativas.length}
              <AlertCircle className="h-5 w-5" />
            </div>
            <p className="text-xs text-muted-foreground">
              Nota abaixo de 3
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Avaliações Recentes</CardTitle>
          <CardDescription>
            Responda às avaliações para melhorar sua reputação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {avaliacoes.length === 0 ? (
            <div className="text-center py-8">
              <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma avaliação ainda</p>
              <p className="text-sm text-muted-foreground mt-2">
                As avaliações aparecerão aqui quando seus clientes avaliarem o serviço
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead>Comentário</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {avaliacoes.map((avaliacao) => {
                  const mediaGeral = (avaliacao.notaProfissional + avaliacao.notaAtendimento + avaliacao.notaAmbiente) / 3;
                  return (
                    <TableRow key={avaliacao.id}>
                      <TableCell className="font-medium">{avaliacao.clienteNome}</TableCell>
                      <TableCell>{avaliacao.profissionalNome}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-20">Profissional:</span>
                            {renderStars(avaliacao.notaProfissional)}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-20">Atendimento:</span>
                            {renderStars(avaliacao.notaAtendimento)}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-20">Ambiente:</span>
                            {renderStars(avaliacao.notaAmbiente)}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-medium pt-1 border-t">
                            <span className="w-20">Média:</span>
                            <span className={getNotaColor(mediaGeral)}>{mediaGeral.toFixed(1)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {avaliacao.comentario ? (
                          <div className="max-w-xs">
                            <p className="text-sm truncate" title={avaliacao.comentario}>
                              "{avaliacao.comentario}"
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sem comentário</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(avaliacao.data).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        {avaliacao.resposta ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Respondida
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <MessageSquare className="h-3 w-3" />
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirModalResposta(avaliacao)}
                        >
                          {avaliacao.resposta ? "Ver/Editar" : "Responder"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Resposta */}
      <Dialog open={modalResposta} onOpenChange={setModalResposta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Responder Avaliação</DialogTitle>
            <DialogDescription>
              Responda ao comentário de {avaliacaoSelecionada?.clienteNome}
            </DialogDescription>
          </DialogHeader>
          {avaliacaoSelecionada && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{avaliacaoSelecionada.clienteNome}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(avaliacaoSelecionada.data).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {renderStars(Math.round((avaliacaoSelecionada.notaProfissional + avaliacaoSelecionada.notaAtendimento + avaliacaoSelecionada.notaAmbiente) / 3))}
                  <span className="text-sm ml-2">
                    {((avaliacaoSelecionada.notaProfissional + avaliacaoSelecionada.notaAtendimento + avaliacaoSelecionada.notaAmbiente) / 3).toFixed(1)}
                  </span>
                </div>
                {avaliacaoSelecionada.comentario && (
                  <p className="text-sm italic">"{avaliacaoSelecionada.comentario}"</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="resposta">Sua Resposta</Label>
                <Textarea
                  id="resposta"
                  placeholder="Escreva sua resposta..."
                  value={resposta}
                  onChange={(e) => setResposta(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Uma resposta educada e profissional ajuda a melhorar sua reputação
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalResposta(false)}>
              Cancelar
            </Button>
            <Button onClick={handleResponder} disabled={salvando}>
              {salvando ? "Salvando..." : "Enviar Resposta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
