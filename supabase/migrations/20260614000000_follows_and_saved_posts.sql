CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id
  ON public.user_follows (follower_id);

CREATE INDEX IF NOT EXISTS idx_user_follows_following_id
  ON public.user_follows (following_id);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seguidores visiveis para autenticados"
  ON public.user_follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuario segue como ele mesmo"
  ON public.user_follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Usuario deixa de seguir como ele mesmo"
  ON public.user_follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

CREATE TABLE IF NOT EXISTS public.post_saves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_saves_user_id
  ON public.post_saves (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_saves_post_id
  ON public.post_saves (post_id);

ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve seus posts salvos"
  ON public.post_saves FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuario salva post como ele mesmo"
  ON public.post_saves FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuario remove proprio post salvo"
  ON public.post_saves FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
