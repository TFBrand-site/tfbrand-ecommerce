-- =========================================================================
-- TFBrand - Segurança (Enforcement de MFA Nível AAL2)
-- Version: 20260626000300_mfa_enforcement
-- =========================================================================

-- 1. CRIAÇÃO DA FUNÇÃO DE VERIFICAÇÃO DE MFA
-- Esta função verifica se a sessão JWT atual possui o nível de segurança AAL2
-- (Authenticator Assurance Level 2), o que prova que o usuário passou pelo MFA.
CREATE OR REPLACE FUNCTION public.has_verified_mfa()
RETURNS boolean AS $$
BEGIN
  RETURN (auth.jwt()->>'aal') = 'aal2';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ATUALIZAÇÃO DAS POLÍTICAS DE RLS (FORÇANDO MFA PARA ADMINS)
-- Abaixo, recriamos as políticas de acesso e escrita, exigindo has_verified_mfa()

-- --- categories ---
DROP POLICY IF EXISTS "Escrita de categorias para admin/editor" ON public.categories;
CREATE POLICY "Escrita de categorias para admin/editor" ON public.categories
  FOR ALL TO authenticated USING (public.is_editor_or_admin() AND public.has_verified_mfa());

-- --- products ---
DROP POLICY IF EXISTS "Escrita de produtos para admin/editor" ON public.products;
CREATE POLICY "Escrita de produtos para admin/editor" ON public.products
  FOR ALL TO authenticated USING (public.is_editor_or_admin() AND public.has_verified_mfa());

-- --- product_variations ---
DROP POLICY IF EXISTS "Escrita de variacoes para admin/editor" ON public.product_variations;
CREATE POLICY "Escrita de variacoes para admin/editor" ON public.product_variations
  FOR ALL TO authenticated USING (public.is_editor_or_admin() AND public.has_verified_mfa());

-- --- product_images ---
DROP POLICY IF EXISTS "Escrita de imagens para admin/editor" ON public.product_images;
CREATE POLICY "Escrita de imagens para admin/editor" ON public.product_images
  FOR ALL TO authenticated USING (public.is_editor_or_admin() AND public.has_verified_mfa());

-- --- product_sizes ---
DROP POLICY IF EXISTS "Escrita de tamanhos para admin/editor" ON public.product_sizes;
CREATE POLICY "Escrita de tamanhos para admin/editor" ON public.product_sizes
  FOR ALL TO authenticated USING (public.is_editor_or_admin() AND public.has_verified_mfa());

-- --- size_guides ---
DROP POLICY IF EXISTS "Escrita de medidas para admin/editor" ON public.size_guides;
CREATE POLICY "Escrita de medidas para admin/editor" ON public.size_guides
  FOR ALL TO authenticated USING (public.is_editor_or_admin() AND public.has_verified_mfa());

-- --- store_settings ---
DROP POLICY IF EXISTS "Escrita de configurações apenas para admin" ON public.store_settings;
CREATE POLICY "Escrita de configurações apenas para admin" ON public.store_settings
  FOR ALL TO authenticated USING (public.is_admin() AND public.has_verified_mfa());

-- --- leads ---
DROP POLICY IF EXISTS "Acesso completo a leads apenas para admin" ON public.leads;
CREATE POLICY "Acesso completo a leads apenas para admin" ON public.leads
  FOR ALL TO authenticated USING (public.is_admin() AND public.has_verified_mfa());

-- --- audit_logs ---
DROP POLICY IF EXISTS "Apenas admins acessam logs de auditoria" ON public.audit_logs;
CREATE POLICY "Apenas admins acessam logs de auditoria" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_admin() AND public.has_verified_mfa());


-- 3. STORAGE (Evitar listagem pública e forçar MFA no Upload)
-- Como o bucket é PUBLIC, o download funciona independentemente da política SELECT na storage.objects.
-- Assim, removemos a política pública de SELECT para impedir que anônimos façam .list() via API.

DROP POLICY IF EXISTS "Imagens públicas" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete" ON storage.objects;

-- Apenas admins podem listar/gerenciar as imagens do bucket (exige MFA)
DROP POLICY IF EXISTS "Admins list and view images" ON storage.objects;
CREATE POLICY "Admins list and view images" ON storage.objects 
  FOR SELECT USING ( bucket_id = 'product-images' AND auth.role() = 'authenticated' AND public.is_editor_or_admin() AND public.has_verified_mfa() );

DROP POLICY IF EXISTS "Admins upload images" ON storage.objects;
CREATE POLICY "Admins upload images" ON storage.objects 
  FOR INSERT WITH CHECK ( bucket_id = 'product-images' AND auth.role() = 'authenticated' AND public.is_editor_or_admin() AND public.has_verified_mfa() );

DROP POLICY IF EXISTS "Admins update images" ON storage.objects;
CREATE POLICY "Admins update images" ON storage.objects 
  FOR UPDATE USING ( bucket_id = 'product-images' AND auth.role() = 'authenticated' AND public.is_editor_or_admin() AND public.has_verified_mfa() );

DROP POLICY IF EXISTS "Admins delete images" ON storage.objects;
CREATE POLICY "Admins delete images" ON storage.objects 
  FOR DELETE USING ( bucket_id = 'product-images' AND auth.role() = 'authenticated' AND public.is_editor_or_admin() AND public.has_verified_mfa() );
