-- Permite cliente autenticado criar notificação para uma barbearia
-- (somente se a barbearia existir; o conteúdo é validado pelo app)
CREATE POLICY "Cliente cria notificacao da barbearia"
ON public.notificacoes
FOR INSERT
TO authenticated
WITH CHECK (
  barbearia_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.barbearias b WHERE b.id = notificacoes.barbearia_id)
);

GRANT INSERT ON public.notificacoes TO authenticated;