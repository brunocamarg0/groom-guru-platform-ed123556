
-- 1) Notificações direcionadas ao cliente
ALTER TABLE public.notificacoes
  ADD COLUMN IF NOT EXISTS cliente_id uuid;

CREATE INDEX IF NOT EXISTS idx_notificacoes_cliente_id ON public.notificacoes(cliente_id);

-- Policies extras para o cliente ver/marcar lidas as próprias notificações
DROP POLICY IF EXISTS "Cliente vê suas notificações" ON public.notificacoes;
CREATE POLICY "Cliente vê suas notificações"
  ON public.notificacoes
  FOR SELECT
  TO authenticated
  USING (cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Cliente atualiza suas notificações" ON public.notificacoes;
CREATE POLICY "Cliente atualiza suas notificações"
  ON public.notificacoes
  FOR UPDATE
  TO authenticated
  USING (cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid()));

-- 2) Preferências de notificação do cliente
CREATE TABLE IF NOT EXISTS public.cliente_preferencias_notificacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL UNIQUE,
  notificacoes_app boolean NOT NULL DEFAULT true,
  notificacoes_email boolean NOT NULL DEFAULT true,
  notificacoes_whatsapp boolean NOT NULL DEFAULT false,
  promocoes boolean NOT NULL DEFAULT true,
  lembretes boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cliente_preferencias_notificacao TO authenticated;
GRANT ALL ON public.cliente_preferencias_notificacao TO service_role;

ALTER TABLE public.cliente_preferencias_notificacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cliente vê suas preferências" ON public.cliente_preferencias_notificacao;
CREATE POLICY "Cliente vê suas preferências"
  ON public.cliente_preferencias_notificacao
  FOR SELECT
  TO authenticated
  USING (cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Cliente cria suas preferências" ON public.cliente_preferencias_notificacao;
CREATE POLICY "Cliente cria suas preferências"
  ON public.cliente_preferencias_notificacao
  FOR INSERT
  TO authenticated
  WITH CHECK (cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Cliente atualiza suas preferências" ON public.cliente_preferencias_notificacao;
CREATE POLICY "Cliente atualiza suas preferências"
  ON public.cliente_preferencias_notificacao
  FOR UPDATE
  TO authenticated
  USING (cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid()))
  WITH CHECK (cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid()));

DROP TRIGGER IF EXISTS trg_cliente_pref_notif_updated ON public.cliente_preferencias_notificacao;
CREATE TRIGGER trg_cliente_pref_notif_updated
  BEFORE UPDATE ON public.cliente_preferencias_notificacao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
