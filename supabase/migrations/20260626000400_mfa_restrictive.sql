-- =========================================================================
-- TFBrand - Segurança (Enforcement RIGOROSO de MFA - RESTRICTIVE)
-- Version: 20260626000400_mfa_restrictive
-- =========================================================================

-- 1. CRIAÇÃO DA FUNÇÃO DE VERIFICAÇÃO DE MFA
CREATE OR REPLACE FUNCTION public.has_verified_mfa()
RETURNS boolean AS $$
BEGIN
  RETURN (auth.jwt()->>'aal') = 'aal2';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. POLÍTICAS AS RESTRICTIVE PARA TODAS AS TABELAS SENSÍVEIS
-- As políticas "AS RESTRICTIVE" agem como um filtro lógico AND para os usuários definidos.
-- Qualquer usuário logado ('authenticated') será bloqueado TOTALMENTE caso não possua AAL2.
-- Isso não afeta usuários visitantes ('anon'), pois a policy aplica-se apenas a 'authenticated'.

DROP POLICY IF EXISTS "MFA Enforcement - Categorias" ON public.categories;
CREATE POLICY "MFA Enforcement - Categorias" ON public.categories
  AS RESTRICTIVE TO authenticated USING (public.has_verified_mfa()) WITH CHECK (public.has_verified_mfa());

DROP POLICY IF EXISTS "MFA Enforcement - Produtos" ON public.products;
CREATE POLICY "MFA Enforcement - Produtos" ON public.products
  AS RESTRICTIVE TO authenticated USING (public.has_verified_mfa()) WITH CHECK (public.has_verified_mfa());

DROP POLICY IF EXISTS "MFA Enforcement - Variações" ON public.product_variations;
CREATE POLICY "MFA Enforcement - Variações" ON public.product_variations
  AS RESTRICTIVE TO authenticated USING (public.has_verified_mfa()) WITH CHECK (public.has_verified_mfa());

DROP POLICY IF EXISTS "MFA Enforcement - Imagens" ON public.product_images;
CREATE POLICY "MFA Enforcement - Imagens" ON public.product_images
  AS RESTRICTIVE TO authenticated USING (public.has_verified_mfa()) WITH CHECK (public.has_verified_mfa());

DROP POLICY IF EXISTS "MFA Enforcement - Tamanhos" ON public.product_sizes;
CREATE POLICY "MFA Enforcement - Tamanhos" ON public.product_sizes
  AS RESTRICTIVE TO authenticated USING (public.has_verified_mfa()) WITH CHECK (public.has_verified_mfa());

DROP POLICY IF EXISTS "MFA Enforcement - Medidas" ON public.size_guides;
CREATE POLICY "MFA Enforcement - Medidas" ON public.size_guides
  AS RESTRICTIVE TO authenticated USING (public.has_verified_mfa()) WITH CHECK (public.has_verified_mfa());

DROP POLICY IF EXISTS "MFA Enforcement - Configurações" ON public.store_settings;
CREATE POLICY "MFA Enforcement - Configurações" ON public.store_settings
  AS RESTRICTIVE TO authenticated USING (public.has_verified_mfa()) WITH CHECK (public.has_verified_mfa());

DROP POLICY IF EXISTS "MFA Enforcement - Leads" ON public.leads;
CREATE POLICY "MFA Enforcement - Leads" ON public.leads
  AS RESTRICTIVE TO authenticated USING (public.has_verified_mfa()) WITH CHECK (public.has_verified_mfa());

DROP POLICY IF EXISTS "MFA Enforcement - Auditoria" ON public.audit_logs;
CREATE POLICY "MFA Enforcement - Auditoria" ON public.audit_logs
  AS RESTRICTIVE TO authenticated USING (public.has_verified_mfa()) WITH CHECK (public.has_verified_mfa());


-- 3. STORAGE (Bloqueio de varredura anônima e exigência de MFA para escrita)

-- Removendo policies antigas
DROP POLICY IF EXISTS "Imagens públicas" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete" ON storage.objects;
DROP POLICY IF EXISTS "Admins list and view images" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload images" ON storage.objects;
DROP POLICY IF EXISTS "Admins update images" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete images" ON storage.objects;
DROP POLICY IF EXISTS "MFA Enforcement - Storage" ON storage.objects;

-- Permissive policies restritas (NÃO criamos policy de SELECT para public. A URL pública funciona independentemente para buckets públicos, 
-- mas isso bloqueia a listagem pela API para anônimos).
DROP POLICY IF EXISTS "Admin/Editor leitura de storage" ON storage.objects;
CREATE POLICY "Admin/Editor leitura de storage" ON storage.objects 
  FOR SELECT TO authenticated USING ( bucket_id = 'product-images' );

DROP POLICY IF EXISTS "Admin/Editor escrita de storage" ON storage.objects;
CREATE POLICY "Admin/Editor escrita de storage" ON storage.objects 
  FOR ALL TO authenticated USING ( bucket_id = 'product-images' AND public.is_editor_or_admin() ) WITH CHECK ( bucket_id = 'product-images' AND public.is_editor_or_admin() );

-- Restrictive policy for storage to enforce MFA
DROP POLICY IF EXISTS "MFA Enforcement - Storage" ON storage.objects;
CREATE POLICY "MFA Enforcement - Storage" ON storage.objects
  AS RESTRICTIVE TO authenticated USING (public.has_verified_mfa()) WITH CHECK (public.has_verified_mfa());
