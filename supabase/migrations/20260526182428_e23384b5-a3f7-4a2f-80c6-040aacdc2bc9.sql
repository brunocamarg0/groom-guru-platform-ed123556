CREATE POLICY "Cliente cria pagamento do seu agendamento"
ON public.pagamentos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.agendamentos a
    JOIN public.clientes c ON c.id = a.cliente_id
    WHERE a.id = pagamentos.agendamento_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Cliente atualiza pagamento do seu agendamento"
ON public.pagamentos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.agendamentos a
    JOIN public.clientes c ON c.id = a.cliente_id
    WHERE a.id = pagamentos.agendamento_id
      AND c.user_id = auth.uid()
  )
);