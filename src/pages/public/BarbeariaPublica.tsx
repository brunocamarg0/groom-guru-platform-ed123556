import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function BarbeariaPublica() {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<
    { kind: "loading" } | { kind: "found"; id: string } | { kind: "notfound" }
  >({ kind: "loading" });

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await supabase.rpc(
        "get_barbearia_publica_by_slug" as any,
        { _slug: slug }
      );
      const row = Array.isArray(data) ? (data as any[])[0] : data;
      if (error || !row) {
        setState({ kind: "notfound" });
      } else {
        setState({ kind: "found", id: (row as any).id });
      }
    })();
  }, [slug]);

  if (authLoading || state.kind === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (state.kind === "notfound") {
    return <Navigate to="/" replace />;
  }

  // Sem sessão → manda para login, preservando destino do agendamento
  if (!user) {
    const redirect = encodeURIComponent(`/cliente/agendar?barbearia=${state.id}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <Navigate to={`/cliente/agendar?barbearia=${state.id}`} replace />;
}
