-- Mantém o papel do professor alinhado ao e-mail institucional exato
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT := lower(NEW.email);
  v_account_type TEXT := COALESCE(NEW.raw_user_meta_data->>'account_type', 'pessoa');
  v_display_name TEXT := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(v_email, '@', 1));
  v_handle TEXT := COALESCE(NEW.raw_user_meta_data->>'handle', split_part(v_email, '@', 1));
  v_course TEXT := NEW.raw_user_meta_data->>'course';
  v_semester TEXT := NEW.raw_user_meta_data->>'semester';
  v_role public.app_role;
BEGIN
  IF v_email LIKE '%@prof.modulo.edu.br' THEN
    v_role := 'professor';
  ELSIF v_account_type = 'instituicao' THEN
    v_role := 'instituicao';
  ELSIF v_account_type = 'empresa' THEN
    v_role := 'empresa';
  ELSE
    v_role := 'aluno';
  END IF;

  INSERT INTO public.profiles (user_id, display_name, handle, email, account_type, course, semester)
  VALUES (NEW.id, v_display_name, v_handle, NEW.email, v_account_type, v_course, v_semester);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role);

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Avisos visíveis para autenticados" ON public.announcements;
DROP POLICY IF EXISTS "Apenas professores criam avisos" ON public.announcements;
DROP POLICY IF EXISTS "Autor professor edita aviso" ON public.announcements;
DROP POLICY IF EXISTS "Autor ou admin apaga aviso" ON public.announcements;

CREATE POLICY "Avisos visíveis para autenticados"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Apenas professor institucional cria avisos"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@prof.modulo.edu.br'
  );

CREATE POLICY "Autor professor institucional edita aviso"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@prof.modulo.edu.br'
  );

CREATE POLICY "Autor professor institucional apaga aviso"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@prof.modulo.edu.br'
  );
