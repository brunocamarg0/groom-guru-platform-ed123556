import { useState, useEffect } from "react";
import { useDono } from "@/context/DonoContext";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  Download,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/services/api";

interface Comissao {
  agendamentoId: string;
  data: string;
  horario: string;
  cliente: string;
  servico: string;
  valorTotal: number;
  valorComissao: number;
  porcentagem: number;
  pago: boolean;
}

interface ResumoProfissional {
  profissional: {
    id: string;
    nome: string;
    comissaoTipo: string;
    comissaoValor: number;
  };
  resumo: {
    totalAgendamentos: number;
    totalValor: number;
    totalComissao: number;
    totalPago: number;
    totalPendente: number;
  };
}

export default function ComissoesBarbeiros() {
  const { profissionais } = useDono();
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [resumoGeral, setResumoGeral] = useState<any>(null);
  const [profissionaisResumo, setProfissionaisResumo] = useState<ResumoProfissional[]>([]);
  const [profissionalSelecionado, setProfissionalSelecionado] = useState<string | null>(null);
  const [comissoesDetalhadas, setComissoesDetalhadas] = useState<Comissao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [tabAtiva, setTabAtiva] = useState("resumo");

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Carregar resumo geral
  const carregarResumo = async () => {
    setCarregando(true);
    try {
      const data = await apiGet<any>(`/dono/comissoes/resumo?mes=${mes}&ano=${ano}`);
      setResumoGeral(data.resumoGeral);
      setProfissionaisResumo(data.profissionais || []);
    } catch (error: any) {
      console.error('Erro ao carregar resumo:', error);
      toast.error('Erro ao carregar resumo de comissões');
    } finally {
      setCarregando(false);
    }
  };

  // Carregar comissões detalhadas de um profissional
  const carregarComissoesDetalhadas = async (profissionalId: string) => {
    setCarregando(true);
    try {
      const data = await apiGet<any>(`/dono/comissoes/profissional/${profissionalId}?mes=${mes}&ano=${ano}`);
      setComissoesDetalhadas(data.comissoes || []);
      setProfissionalSelecionado(profissionalId);
      setTabAtiva("detalhes");
    } catch (error: any) {
      console.error('Erro ao carregar comissões detalhadas:', error);
      toast.error('Erro ao carregar comissões detalhadas');
    } finally {
      setCarregando(false);
    }
  };

  // Marcar comissão como paga
  const marcarComoPaga = async (agendamentoId: string, profissionalId: string) => {
    try {
      await apiPost('/dono/comissoes/marcar-paga', {
        agendamentoId,
        profissionalId,
      });
      toast.success('Comissão marcada como paga!');
      // Recarregar dados
      if (profissionalSelecionado) {
        await carregarComissoesDetalhadas(profissionalSelecionado);
      }
      await carregarResumo();
    } catch (error: any) {
      console.error('Erro ao marcar comissão como paga:', error);
      toast.error('Erro ao marcar comissão como paga');
    }
  };

  // Marcar todas as comissões de um profissional como pagas
  const marcarTodasComoPagas = async (profissionalId: string) => {
    if (!confirm(`Tem certeza que deseja marcar TODAS as comissões de ${profissionais.find(p => p.id === profissionalId)?.nome} como pagas?`)) {
      return;
    }

    try {
      const resultado = await apiPost<{ total: number }>('/dono/comissoes/marcar-todas-pagas', {
        profissionalId,
        mes,
        ano,
      });
      toast.success(`${resultado.total} comissões marcadas como pagas!`);
      // Recarregar dados
      if (profissionalSelecionado) {
        await carregarComissoesDetalhadas(profissionalSelecionado);
      }
      await carregarResumo();
    } catch (error: any) {
      console.error('Erro ao marcar todas as comissões como pagas:', error);
      toast.error('Erro ao marcar todas as comissões como pagas');
    }
  };

  useEffect(() => {
    carregarResumo();
  }, [mes, ano]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Comissões dos Barbeiros</h2>
          <p className="text-muted-foreground">
            Gerencie os pagamentos de comissão aos profissionais
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {meses.map((mesNome, index) => (
                <SelectItem key={index} value={String(index + 1)}>
                  {mesNome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {anos.map((anoValor) => (
                <SelectItem key={anoValor} value={String(anoValor)}>
                  {anoValor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Resumo Geral */}
      {resumoGeral && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Comissões</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatarMoeda(resumoGeral.totalComissao)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {meses[mes - 1]} de {ano}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatarMoeda(resumoGeral.totalPago)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Já pagos este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
              <XCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatarMoeda(resumoGeral.totalPendente)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                A pagar este mês
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={tabAtiva} onValueChange={setTabAtiva} className="space-y-4">
        <TabsList>
          <TabsTrigger value="resumo">Resumo por Profissional</TabsTrigger>
          <TabsTrigger value="detalhes">Detalhes de Agendamentos</TabsTrigger>
          <TabsTrigger value="assinaturas">Comissões por Assinatura</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Resumo de Comissões por Profissional</CardTitle>
              <CardDescription>
                {meses[mes - 1]} de {ano}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {carregando ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Carregando...</p>
                </div>
              ) : profissionaisResumo.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhum profissional com comissões neste período
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Comissão</TableHead>
                      <TableHead>Agendamentos</TableHead>
                      <TableHead>Total Faturado</TableHead>
                      <TableHead>Total Comissão</TableHead>
                      <TableHead>Pago</TableHead>
                      <TableHead>Pendente</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profissionaisResumo.map((item) => (
                      <TableRow key={item.profissional.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {item.profissional.nome}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.profissional.comissaoTipo === 'percentual'
                              ? `${item.profissional.comissaoValor}%`
                              : formatarMoeda(item.profissional.comissaoValor)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.profissional.comissaoTipo === 'percentual' ? 'Percentual' : 'Fixo'}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.resumo.totalAgendamentos}</TableCell>
                        <TableCell>{formatarMoeda(item.resumo.totalValor)}</TableCell>
                        <TableCell className="font-medium">
                          {formatarMoeda(item.resumo.totalComissao)}
                        </TableCell>
                        <TableCell className="text-green-600">
                          {formatarMoeda(item.resumo.totalPago)}
                        </TableCell>
                        <TableCell className="text-orange-600 font-medium">
                          {formatarMoeda(item.resumo.totalPendente)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => carregarComissoesDetalhadas(item.profissional.id)}
                            >
                              Ver Detalhes
                            </Button>
                            {item.resumo.totalPendente > 0 && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => marcarTodasComoPagas(item.profissional.id)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Pagar Tudo
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detalhes">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Detalhes de Comissões</CardTitle>
              <CardDescription>
                {profissionalSelecionado
                  ? `Comissões de ${profissionais.find(p => p.id === profissionalSelecionado)?.nome} - ${meses[mes - 1]} de ${ano}`
                  : 'Selecione um profissional no resumo para ver os detalhes'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {carregando ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Carregando...</p>
                </div>
              ) : comissoesDetalhadas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {profissionalSelecionado
                      ? 'Nenhum agendamento encontrado para este profissional neste período'
                      : 'Selecione um profissional no resumo para ver os detalhes'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Comissão</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comissoesDetalhadas.map((comissao) => (
                      <TableRow key={comissao.agendamentoId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div>{new Date(comissao.data).toLocaleDateString('pt-BR')}</div>
                              <div className="text-xs text-muted-foreground">{comissao.horario}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{comissao.cliente}</TableCell>
                        <TableCell>{comissao.servico}</TableCell>
                        <TableCell>{formatarMoeda(comissao.valorTotal)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{formatarMoeda(comissao.valorComissao)}</div>
                          {comissao.porcentagem > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {comissao.porcentagem}%
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={comissao.pago ? "default" : "secondary"}>
                            {comissao.pago ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Pago
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Pendente
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!comissao.pago && profissionalSelecionado && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => marcarComoPaga(comissao.agendamentoId, profissionalSelecionado)}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Marcar como Pago
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assinaturas">
          <ComissoesAssinatura mes={mes} ano={ano} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente para Comissões por Assinatura
function ComissoesAssinatura({ mes, ano }: { mes: number; ano: number }) {
  const { profissionais } = useDono();
  const [resumoAssinaturas, setResumoAssinaturas] = useState<any>(null);
  const [profissionalSelecionado, setProfissionalSelecionado] = useState<string | null>(null);
  const [comissoesAssinatura, setComissoesAssinatura] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    carregarResumoAssinaturas();
  }, [mes, ano]);

  useEffect(() => {
    if (profissionalSelecionado) {
      carregarComissoesAssinatura();
    }
  }, [profissionalSelecionado, mes, ano]);

  const carregarResumoAssinaturas = async () => {
    setCarregando(true);
    try {
      const data = await apiGet<any>(`/dono/comissoes-assinatura/resumo?mes=${mes}&ano=${ano}`);
      setResumoAssinaturas(data);
    } catch (error: any) {
      console.error("Erro ao carregar resumo de comissões por assinatura:", error);
      toast.error("Erro ao carregar resumo de comissões por assinatura");
    } finally {
      setCarregando(false);
    }
  };

  const carregarComissoesAssinatura = async () => {
    if (!profissionalSelecionado) return;

    setCarregando(true);
    try {
      const data = await apiGet<any>(`/dono/comissoes-assinatura/${profissionalSelecionado}?mes=${mes}&ano=${ano}`);
      setComissoesAssinatura(data.comissoes || []);
    } catch (error: any) {
      console.error("Erro ao carregar comissões por assinatura:", error);
      toast.error("Erro ao carregar comissões por assinatura");
    } finally {
      setCarregando(false);
    }
  };

  const marcarComissaoComoPaga = async (comissaoId: string) => {
    try {
      await apiPost(`/dono/comissoes-assinatura/${comissaoId}/marcar-pago`);
      toast.success("Comissão marcada como paga!");
      carregarComissoesAssinatura();
      carregarResumoAssinaturas();
    } catch (error: any) {
      console.error("Erro ao marcar comissão como paga:", error);
      toast.error("Erro ao marcar comissão como paga");
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return (
    <div className="space-y-4">
      {resumoAssinaturas && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Comissões Assinatura</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatarMoeda(resumoAssinaturas.totalComissao || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {meses[mes - 1]} de {ano}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatarMoeda(resumoAssinaturas.totalPago || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Já pagos este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
              <XCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatarMoeda(resumoAssinaturas.totalPendente || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                A pagar este mês
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Comissões por Assinatura</CardTitle>
          <CardDescription>
            {meses[mes - 1]} de {ano}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={profissionalSelecionado || ""} onValueChange={setProfissionalSelecionado}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecione um profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os profissionais</SelectItem>
                {profissionais.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {carregando ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : !profissionalSelecionado ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Selecione um profissional para ver as comissões por assinatura
              </p>
            </div>
          ) : comissoesAssinatura.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma comissão por assinatura encontrada para este profissional neste período
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comissoesAssinatura.map((comissao) => (
                  <TableRow key={comissao.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{comissao.cliente.nome}</div>
                        <div className="text-sm text-muted-foreground">{comissao.cliente.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{comissao.plano.nome}</TableCell>
                    <TableCell>{formatarMoeda(comissao.valorTotal)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{formatarMoeda(comissao.valorComissao)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={comissao.pago ? "default" : "secondary"}>
                        {comissao.pago ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Pago
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Pendente
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!comissao.pago && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => marcarComissaoComoPaga(comissao.id)}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Marcar como Pago
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
