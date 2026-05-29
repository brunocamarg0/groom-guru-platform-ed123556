
CREATE OR REPLACE FUNCTION public.set_barbearia_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base TEXT;
  candidate TEXT;
  n INT := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base := public.slugify(COALESCE(NEW.nome, ''));
    IF base IS NULL OR base = '' THEN
      base := 'barbearia';
    END IF;
    candidate := base;
    WHILE EXISTS (SELECT 1 FROM public.barbearias WHERE slug = candidate AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
      n := n + 1;
      candidate := base || '-' || n;
    END LOOP;
    NEW.slug := candidate;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_barbearia_slug ON public.barbearias;
CREATE TRIGGER trg_set_barbearia_slug
BEFORE INSERT OR UPDATE ON public.barbearias
FOR EACH ROW EXECUTE FUNCTION public.set_barbearia_slug();
