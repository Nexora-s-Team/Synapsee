DROP POLICY IF EXISTS "Apenas professor institucional cria avisos" ON public.announcements;
DROP POLICY IF EXISTS "Autor professor institucional edita aviso" ON public.announcements;
DROP POLICY IF EXISTS "Autor professor institucional apaga aviso" ON public.announcements;

CREATE POLICY "Apenas professor institucional cria avisos"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND lower(p.email) LIKE '%@prof.modulo.edu.br'
    )
  );

CREATE POLICY "Autor professor institucional edita aviso"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND lower(p.email) LIKE '%@prof.modulo.edu.br'
    )
  );

CREATE POLICY "Autor professor institucional apaga aviso"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND lower(p.email) LIKE '%@prof.modulo.edu.br'
    )
  );
