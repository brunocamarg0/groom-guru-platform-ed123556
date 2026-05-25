ALTER TABLE public.barbearias ADD COLUMN IF NOT EXISTS slug TEXT;

-- Slugify without unaccent (basic transliteration of common Portuguese accents)
CREATE OR REPLACE FUNCTION public.slugify(_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(both '-' from regexp_replace(
    regexp_replace(
      lower(translate(coalesce(_text, ''),
        'áàâãäåÁÀÂÃÄÅéèêëÉÈÊËíìîïÍÌÎÏóòôõöÓÒÔÕÖúùûüÚÙÛÜçÇñÑ',
        'aaaaaaAAAAAAeeeeEEEEiiiiIIIIoooooOOOOOuuuuUUUUcCnN')),
      '[^a-z0-9]+', '-', 'g'
    ),
    '-+', '-', 'g'
  ));
$$;

DO $$
DECLARE
  r RECORD; base TEXT; candidate TEXT; n INT;
BEGIN
  FOR r IN SELECT id, nome FROM public.barbearias WHERE slug IS NULL LOOP
    base := NULLIF(public.slugify(r.nome), '');
    IF base IS NULL THEN base := 'barbearia'; END IF;
    candidate := base; n := 0;
    WHILE EXISTS (SELECT 1 FROM public.barbearias WHERE slug = candidate) LOOP
      n := n + 1;
      candidate := base || '-' || n;
    END LOOP;
    UPDATE public.barbearias SET slug = candidate WHERE id = r.id;
  END LOOP;
END$$;

ALTER TABLE public.barbearias ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS barbearias_slug_key ON public.barbearias(slug);

DROP VIEW IF EXISTS public.barbearias_publicas;
CREATE VIEW public.barbearias_publicas AS
  SELECT id, slug, nome, foto, endereco, cidade, bairro, cep, telefone, email,
         latitude, longitude, status, plano, modo_confirmacao, created_at
  FROM public.barbearias;

GRANT SELECT ON public.barbearias_publicas TO anon, authenticated;