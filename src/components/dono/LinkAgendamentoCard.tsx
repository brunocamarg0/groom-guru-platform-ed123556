import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDono } from "@/context/DonoContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Check, Link2, Loader2 } from "lucide-react";

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);

export default function LinkAgendamentoCard() {
  const { barbeariaId, atualizarConfiguracao } = useDono();
  const [slug, setSlug] = useState("");
  const [original, setOriginal] = useState("");
  const [nomeBarbearia, setNomeBarbearia] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!barbeariaId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("barbearias" as any)
        .select("slug, nome")
        .eq("id", barbeariaId)
        .maybeSingle();
      const row = data as any;
      const s = row?.slug ?? "";
      const nome = row?.nome ?? "";
      // Se ainda não houver slug salvo, sugere baseado no nome da barbearia
      const fallback = s || slugify(nome);
      setSlug(fallback);
      setOriginal(fallback);
      setNomeBarbearia(nome);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbeariaId]);

  const PUBLIC_HOST = "www.barbermaestro.com";
  const PUBLIC_ORIGIN = `https://${PUBLIC_HOST}`;
  const link = `${PUBLIC_ORIGIN}/${slug || "sua-barbearia"}`;

  const handleCopy = async () => {
    if (!slug) {
      toast.error("Salve um link personalizado antes de copiar");
      return;
    }
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!barbeariaId) return;
    const clean = slugify(slug);
    if (!clean || clean.length < 3) {
      toast.error("O link deve ter ao menos 3 caracteres válidos");
      return;
    }
    setSaving(true);
    try {
      await atualizarConfiguracao({ linkAgendamento: `${PUBLIC_ORIGIN}/${clean}` } as any);
      setSlug(clean);
      setOriginal(clean);
    } catch (error: any) {
      if ((error as any)?.code === "23505") {
        toast.error("Este link já está em uso. Escolha outro.");
      } else {
        toast.error("Erro ao salvar link: " + (error?.message || "tente novamente"));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Link de Agendamento
        </CardTitle>
        <CardDescription>
          {nomeBarbearia
            ? <>Compartilhe este link com os clientes da <strong>{nomeBarbearia}</strong></>
            : "Compartilhe este link com seus clientes para que possam agendar diretamente"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="slug">Nome no link (sem acentos ou espaços)</Label>
          <div className="flex gap-2 mt-1">
            <div className="flex items-center px-3 rounded-sm border bg-muted text-muted-foreground text-sm whitespace-nowrap">
              {PUBLIC_HOST}/
            </div>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="minha-barbearia"
              disabled={loading || saving}
            />
            <Button
              onClick={handleSave}
              disabled={loading || saving || slug === original}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </div>

        <div>
          <Label>Link completo</Label>
          <div className="flex gap-2 mt-1">
            <Input value={link} readOnly className="font-mono text-sm" />
            <Button variant="outline" onClick={handleCopy} disabled={loading}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="ml-2 hidden sm:inline">{copied ? "Copiado" : "Copiar"}</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Compartilhe este link com seus clientes para que eles agendem direto pelo site.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
