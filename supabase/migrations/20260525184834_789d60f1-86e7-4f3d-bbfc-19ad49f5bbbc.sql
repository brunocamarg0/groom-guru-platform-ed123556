
-- Replace the SECURITY DEFINER view with SECURITY DEFINER functions that return
-- only the non-sensitive columns. This fixes the security_definer_view lint
-- and ensures cnpj_cpf / sensitive fields can never leak via the public path.

DROP VIEW IF EXISTS public.barbearias_publicas CASCADE;

CREATE OR REPLACE FUNCTION public.search_barbearias_publicas(
  _busca text DEFAULT NULL,
  _cidade text DEFAULT NULL,
  _bairro text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  slug text,
  nome text,
  foto text,
  endereco text,
  cidade text,
  bairro text,
  telefone text,
  latitude double precision,
  longitude double precision,
  status text,
  plano text,
  modo_confirmacao text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.slug, b.nome, b.foto, b.endereco, b.cidade, b.bairro,
         b.telefone, b.latitude, b.longitude, b.status, b.plano, b.modo_confirmacao
  FROM public.barbearias b
  WHERE (_busca IS NULL OR b.nome ILIKE '%' || _busca || '%')
    AND (_cidade IS NULL OR b.cidade ILIKE '%' || _cidade || '%')
    AND (_bairro IS NULL OR b.bairro ILIKE '%' || _bairro || '%')
  ORDER BY b.nome;
$$;

CREATE OR REPLACE FUNCTION public.get_barbearia_publica_by_id(_id uuid)
RETURNS TABLE (
  id uuid,
  slug text,
  nome text,
  foto text,
  endereco text,
  cidade text,
  bairro text,
  telefone text,
  latitude double precision,
  longitude double precision,
  status text,
  plano text,
  modo_confirmacao text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.slug, b.nome, b.foto, b.endereco, b.cidade, b.bairro,
         b.telefone, b.latitude, b.longitude, b.status, b.plano, b.modo_confirmacao
  FROM public.barbearias b
  WHERE b.id = _id;
$$;

CREATE OR REPLACE FUNCTION public.get_barbearia_publica_by_slug(_slug text)
RETURNS TABLE (
  id uuid,
  slug text,
  nome text,
  foto text,
  endereco text,
  cidade text,
  bairro text,
  telefone text,
  latitude double precision,
  longitude double precision,
  status text,
  plano text,
  modo_confirmacao text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.slug, b.nome, b.foto, b.endereco, b.cidade, b.bairro,
         b.telefone, b.latitude, b.longitude, b.status, b.plano, b.modo_confirmacao
  FROM public.barbearias b
  WHERE b.slug = _slug;
$$;

GRANT EXECUTE ON FUNCTION public.search_barbearias_publicas(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_barbearia_publica_by_id(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_barbearia_publica_by_slug(text) TO anon, authenticated;
