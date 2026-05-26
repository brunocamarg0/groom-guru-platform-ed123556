
ALTER TABLE public.barbearias
  ADD COLUMN IF NOT EXISTS mercadopago_user_id TEXT,
  ADD COLUMN IF NOT EXISTS mercadopago_access_token TEXT,
  ADD COLUMN IF NOT EXISTS mercadopago_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS mercadopago_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mercadopago_public_key TEXT,
  ADD COLUMN IF NOT EXISTS mercadopago_connected_at TIMESTAMPTZ;

-- Revogar colunas sensíveis para roles públicas (somente service_role lê)
REVOKE SELECT (mercadopago_access_token, mercadopago_refresh_token, mercadopago_token_expires_at)
  ON public.barbearias FROM anon, authenticated;

-- Função pública: status de conexão sem expor tokens
CREATE OR REPLACE FUNCTION public.get_mp_connection_status(_barbearia_id UUID)
RETURNS TABLE(connected BOOLEAN, mp_user_id TEXT, public_key TEXT, connected_at TIMESTAMPTZ)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (b.mercadopago_access_token IS NOT NULL) AS connected,
    b.mercadopago_user_id,
    b.mercadopago_public_key,
    b.mercadopago_connected_at
  FROM public.barbearias b
  WHERE b.id = _barbearia_id
    AND (
      b.id = public.get_user_barbearia_id(auth.uid())
      OR public.has_role(auth.uid(), 'super_admin'::app_role)
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_mp_connection_status(UUID) TO authenticated;
