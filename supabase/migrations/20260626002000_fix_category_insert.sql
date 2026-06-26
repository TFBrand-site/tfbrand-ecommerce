-- Restaura as policies de categorias para permitir INSERT sem exigir MFA obrigatório
-- (Resolve o erro "new row violates row-level security policy" ao criar categorias)
DROP POLICY IF EXISTS "Escrita de categorias para admin/editor" ON public.categories;

CREATE POLICY "Escrita de categorias para admin/editor" ON public.categories
  FOR INSERT TO authenticated WITH CHECK (public.is_editor_or_admin());
