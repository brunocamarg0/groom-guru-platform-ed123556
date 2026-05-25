
-- 1) Remover policies públicas amplas que expunham todas as colunas
DROP POLICY IF EXISTS "Barbearias visíveis publicamente" ON public.barbearias;
DROP POLICY IF EXISTS "Profissionais visíveis publicamente" ON public.profissionais;

-- 2) Views públicas seguras (somente colunas não sensíveis)
DROP VIEW IF EXISTS public.barbearias_publicas;
CREATE VIEW public.barbearias_publicas
WITH (security_invoker = false) AS
SELECT
  id, nome, foto, endereco, cidade, bairro, cep,
  telefone, email, latitude, longitude,
  status, plano, modo_confirmacao, created_at
FROM public.barbearias;

GRANT SELECT ON public.barbearias_publicas TO anon, authenticated;

DROP VIEW IF EXISTS public.profissionais_publicos;
CREATE VIEW public.profissionais_publicos
WITH (security_invoker = false) AS
SELECT
  id, nome, foto, especialidades, ativo,
  barbearia_id, data_admissao
FROM public.profissionais;

GRANT SELECT ON public.profissionais_publicos TO anon, authenticated;
