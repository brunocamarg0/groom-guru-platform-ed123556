
-- 1) New private table for Mercado Pago credentials (no anon/authenticated grants)
CREATE TABLE IF NOT EXISTS public.barbearia_mp_credentials (
  barbearia_id uuid PRIMARY KEY REFERENCES public.barbearias(id) ON DELETE CASCADE,
  mp_user_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  public_key text,
  connected_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.barbearia_mp_credentials TO service_role;
ALTER TABLE public.barbearia_mp_credentials ENABLE ROW LEVEL SECURITY;
-- No policies for anon/authenticated => no access from client SDK.

-- Migrate existing data
INSERT INTO public.barbearia_mp_credentials
  (barbearia_id, mp_user_id, access_token, refresh_token, token_expires_at, public_key, connected_at)
SELECT id, mercadopago_user_id, mercadopago_access_token, mercadopago_refresh_token,
       mercadopago_token_expires_at, mercadopago_public_key, mercadopago_connected_at
FROM public.barbearias
WHERE mercadopago_access_token IS NOT NULL
ON CONFLICT (barbearia_id) DO NOTHING;

-- 2) Recreate get_mp_connection_status to read from the new private table
CREATE OR REPLACE FUNCTION public.get_mp_connection_status(_barbearia_id uuid)
RETURNS TABLE(connected boolean, mp_user_id text, public_key text, connected_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    (c.access_token IS NOT NULL) AS connected,
    c.mp_user_id,
    c.public_key,
    c.connected_at
  FROM public.barbearia_mp_credentials c
  WHERE c.barbearia_id = _barbearia_id
    AND (
      c.barbearia_id = public.get_user_barbearia_id(auth.uid())
      OR public.has_role(auth.uid(), 'super_admin'::app_role)
    );
$$;

-- 3) Drop old MP columns from barbearias
ALTER TABLE public.barbearias
  DROP COLUMN IF EXISTS mercadopago_access_token,
  DROP COLUMN IF EXISTS mercadopago_refresh_token,
  DROP COLUMN IF EXISTS mercadopago_user_id,
  DROP COLUMN IF EXISTS mercadopago_token_expires_at,
  DROP COLUMN IF EXISTS mercadopago_public_key,
  DROP COLUMN IF EXISTS mercadopago_connected_at;

-- 4) Tighten agendamentos SELECT: only authenticated users (cliente, dono da barbearia, super_admin)
DROP POLICY IF EXISTS "Cliente vê seus próprios agendamentos" ON public.agendamentos;
CREATE POLICY "Cliente vê seus próprios agendamentos"
ON public.agendamentos
FOR SELECT
TO authenticated
USING (
  (cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid()))
  OR (barbearia_id = public.get_user_barbearia_id(auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- 5) Tighten convites SELECT: only OWNERS (not professionals), via direct user_roles join
DROP POLICY IF EXISTS "Owner reads convites of their barbearia" ON public.convites;
CREATE POLICY "Owner reads convites of their barbearia"
ON public.convites
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'owner'::app_role
      AND ur.barbearia_id = convites.barbearia_id
  )
);

-- 6) Tighten tickets_suporte INSERT: require auth + email must match JWT email
DROP POLICY IF EXISTS "Qualquer um pode abrir ticket" ON public.tickets_suporte;
CREATE POLICY "Usuário autenticado abre ticket"
ON public.tickets_suporte
FOR INSERT
TO authenticated
WITH CHECK (
  char_length(COALESCE(assunto, '')) > 0
  AND lower(cliente_email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
);
