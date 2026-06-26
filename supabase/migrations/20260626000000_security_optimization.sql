-- =========================================================================
-- TFBrand - Segurança e Otimização do Banco de Dados (Supabase Migration)
-- Version: 20260626000000_security_optimization
-- =========================================================================

-- 1. CRIAÇÃO DO ENUM DE ROLES (Se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'editor');
  END IF;
END$$;

-- 2. CRIAÇÃO DA TABELA DE PROFILES (Perfis de Admin/Editor)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text,
  email text,
  role user_role NOT NULL DEFAULT 'editor',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS em profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. CRIAÇÃO DA TABELA DE ADMIN_ROLES (Para compatibilidade / Lookup)
CREATE TABLE IF NOT EXISTS public.admin_roles (
  role text PRIMARY KEY,
  description text
);

INSERT INTO public.admin_roles (role, description) VALUES
  ('admin', 'Administrador com acesso total ao sistema'),
  ('editor', 'Editor com permissões limitadas de escrita')
ON CONFLICT (role) DO NOTHING;

-- Habilitar RLS em admin_roles
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- 4. CRIAÇÃO DA TABELA DE AUDIT_LOGS (Logs de Auditoria Administrativos)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS em audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. FUNÇÕES AUXILIARES DE SEGURANÇA (SECURITY DEFINER para uso em RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::user_role
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_editor_or_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin'::user_role, 'editor'::user_role)
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. GATILHO AUTOMÁTICO DE CRIAÇÃO DE PERFIL (AFTER INSERT NO AUTH.USERS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'full_name', 'Membro'),
    new.email,
    -- Se for o primeiro usuário a registrar, ganha papel admin; senhas subsequentes ganham editor
    CASE WHEN (SELECT count(*) FROM public.profiles) = 0 THEN 'admin'::public.user_role ELSE 'editor'::public.user_role END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sincronizar o gatilho
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. PROMOÇÃO DO USUÁRIO ATUAL / E-MAIL DE SUPORTE
-- Adiciona perfis para usuários já cadastrados no auth.users
INSERT INTO public.profiles (id, nome, email, role)
SELECT id, COALESCE(raw_user_meta_data->>'nome', raw_user_meta_data->>'full_name', 'Admin Principal'), email, 'admin'::user_role
FROM auth.users
WHERE email = 'tfbrandteck@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin'::user_role;

-- Insere os demais usuários cadastrados como editores
INSERT INTO public.profiles (id, nome, email, role)
SELECT id, COALESCE(raw_user_meta_data->>'nome', raw_user_meta_data->>'full_name', 'Editor'), email, 'editor'::user_role
FROM auth.users
WHERE email != 'tfbrandteck@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- 8. TRIGGER DE AUDITORIA ADMINISTRATIVA
CREATE OR REPLACE FUNCTION public.audit_log_trigger_fn()
RETURNS trigger AS $$
DECLARE
  v_action text;
  v_entity_id text;
  v_metadata jsonb;
  v_entity_type text;
BEGIN
  v_entity_type := TG_TABLE_NAME;
  
  IF (TG_OP = 'INSERT') THEN
    v_action := 'create';
    v_entity_id := NEW.id::text;
    v_metadata := to_jsonb(NEW) - 'id' - 'created_at' - 'updated_at';
  ELSIF (TG_OP = 'UPDATE') THEN
    v_action := 'edit';
    v_entity_id := NEW.id::text;
    
    -- Ajustar ações específicas de produto
    IF TG_TABLE_NAME = 'products' THEN
      IF OLD.status IS DISTINCT FROM NEW.status THEN
        IF NEW.status = 'published' THEN
          v_action := 'publish';
        ELSIF NEW.status = 'archived' THEN
          v_action := 'archive';
        END IF;
      END IF;
    END IF;

    v_metadata := jsonb_build_object(
      'old', to_jsonb(OLD) - 'id' - 'created_at' - 'updated_at',
      'new', to_jsonb(NEW) - 'id' - 'created_at' - 'updated_at'
    );
  ELSIF (TG_OP = 'DELETE') THEN
    v_action := 'delete';
    v_entity_id := OLD.id::text;
    v_metadata := to_jsonb(OLD) - 'id' - 'created_at' - 'updated_at';
  END IF;

  -- Insere na tabela de log se a ação partiu de um usuário do Supabase
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.audit_logs (admin_id, action, entity_type, entity_id, metadata)
    VALUES (auth.uid(), v_action, v_entity_type, v_entity_id, v_metadata);
  END IF;

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sincronizar triggers de auditoria nas tabelas principais
DROP TRIGGER IF EXISTS audit_products_trigger ON public.products;
CREATE TRIGGER audit_products_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn();

DROP TRIGGER IF EXISTS audit_product_sizes_trigger ON public.product_sizes;
CREATE TRIGGER audit_product_sizes_trigger
  AFTER UPDATE ON public.product_sizes
  FOR EACH ROW 
  WHEN (OLD.stock IS DISTINCT FROM NEW.stock)
  EXECUTE FUNCTION public.audit_log_trigger_fn();

DROP TRIGGER IF EXISTS audit_store_settings_trigger ON public.store_settings;
CREATE TRIGGER audit_store_settings_trigger
  AFTER UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn();


-- 9. CRIAÇÃO DE VIEWS DE COMPATIBILIDADE (TABELAS ESPERADAS)
CREATE OR REPLACE VIEW public.product_colors WITH (security_invoker = true) AS
  SELECT id, product_id, color_name, color_slug, hex_code, display_order, active, created_at
  FROM public.product_variations;

CREATE OR REPLACE VIEW public.product_size_stock WITH (security_invoker = true) AS
  SELECT id, product_id, variation_id, size, stock, is_available, created_at
  FROM public.product_sizes;

CREATE OR REPLACE VIEW public.product_measurements WITH (security_invoker = true) AS
  SELECT id, product_id, size_name, numbering, bust, waist, hip, length, created_at
  FROM public.size_guides;

CREATE OR REPLACE VIEW public.product_care WITH (security_invoker = true) AS
  SELECT id, name, care_instructions
  FROM public.products;

CREATE OR REPLACE VIEW public.order_leads WITH (security_invoker = true) AS
  SELECT id, customer_name, customer_phone, items, subtotal, status, device_info, origin, created_at, updated_at
  FROM public.leads;

CREATE OR REPLACE VIEW public.product_metrics WITH (security_invoker = true) AS
  SELECT id, event_type, product_id, user_agent, created_at
  FROM public.analytics_events;

CREATE OR REPLACE VIEW public.store_config WITH (security_invoker = true) AS
  SELECT id, store_name, whatsapp_number, instagram_url, tech_email, created_at, updated_at
  FROM public.store_settings;


-- 10. RECONSTRUTOR DE POLÍTICAS RLS (ROW LEVEL SECURITY)
-- Garante RLS ativo em todas as tabelas
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Limpar policies inseguras antigas
DROP POLICY IF EXISTS "Leitura pública de categorias" ON public.categories;
DROP POLICY IF EXISTS "Escrita administrativa de categorias" ON public.categories;
DROP POLICY IF EXISTS "Categorias visíveis para todos" ON public.categories;
DROP POLICY IF EXISTS "Admins podem tudo em categorias" ON public.categories;

DROP POLICY IF EXISTS "Leitura pública de produtos" ON public.products;
DROP POLICY IF EXISTS "Escrita administrativa de produtos" ON public.products;
DROP POLICY IF EXISTS "Produtos visíveis para todos" ON public.products;
DROP POLICY IF EXISTS "Admins podem tudo em produtos" ON public.products;

DROP POLICY IF EXISTS "Leitura pública de variacoes" ON public.product_variations;
DROP POLICY IF EXISTS "Escrita administrativa de variacoes" ON public.product_variations;
DROP POLICY IF EXISTS "Variações visíveis para todos" ON public.product_variations;
DROP POLICY IF EXISTS "Admins podem tudo em variações" ON public.product_variations;

DROP POLICY IF EXISTS "Leitura pública de imagens" ON public.product_images;
DROP POLICY IF EXISTS "Escrita administrativa de imagens" ON public.product_images;
DROP POLICY IF EXISTS "Imagens visíveis para todos" ON public.product_images;
DROP POLICY IF EXISTS "Admins podem tudo em imagens" ON public.product_images;

DROP POLICY IF EXISTS "Leitura pública de tamanhos" ON public.product_sizes;
DROP POLICY IF EXISTS "Escrita administrativa de tamanhos" ON public.product_sizes;
DROP POLICY IF EXISTS "Tamanhos visíveis para todos" ON public.product_sizes;
DROP POLICY IF EXISTS "Admins podem tudo em tamanhos" ON public.product_sizes;

DROP POLICY IF EXISTS "Leitura pública de guias_medidas" ON public.size_guides;
DROP POLICY IF EXISTS "Escrita administrativa de guias_medidas" ON public.size_guides;
DROP POLICY IF EXISTS "Medidas visíveis para todos" ON public.size_guides;
DROP POLICY IF EXISTS "Admins podem tudo em medidas" ON public.size_guides;

DROP POLICY IF EXISTS "Leitura pública de configs" ON public.store_settings;
DROP POLICY IF EXISTS "Escrita administrativa de configs" ON public.store_settings;
DROP POLICY IF EXISTS "Configurações visíveis para todos" ON public.store_settings;
DROP POLICY IF EXISTS "Admins podem tudo nas configurações" ON public.store_settings;

DROP POLICY IF EXISTS "Inserção pública de leads" ON public.leads;
DROP POLICY IF EXISTS "Acesso administrative de leads" ON public.leads;
DROP POLICY IF EXISTS "Acesso administrativo de leads" ON public.leads;
DROP POLICY IF EXISTS "Qualquer um pode inserir eventos" ON public.analytics_events;
DROP POLICY IF EXISTS "Apenas admins leem eventos" ON public.analytics_events;
DROP POLICY IF EXISTS "Inserção pública de eventos" ON public.analytics_events;
DROP POLICY IF EXISTS "Acesso administrativo de eventos" ON public.analytics_events;

-- --- RLS: profiles ---
DROP POLICY IF EXISTS "Usuários leem seus próprios perfis" ON public.profiles;
CREATE POLICY "Usuários leem seus próprios perfis" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Apenas admins editam perfis" ON public.profiles;
CREATE POLICY "Apenas admins editam perfis" ON public.profiles
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- RLS: admin_roles ---
DROP POLICY IF EXISTS "Leitura pública de roles" ON public.admin_roles;
CREATE POLICY "Leitura pública de roles" ON public.admin_roles
  FOR SELECT USING (true);

-- --- RLS: audit_logs ---
DROP POLICY IF EXISTS "Apenas admins acessam logs de auditoria" ON public.audit_logs;
CREATE POLICY "Apenas admins acessam logs de auditoria" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_admin());

-- --- RLS: categories ---
CREATE POLICY "Leitura pública de categorias ativas" ON public.categories
  FOR SELECT USING (active = true OR public.is_editor_or_admin());

CREATE POLICY "Escrita de categorias para admin/editor" ON public.categories
  FOR INSERT TO authenticated WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Update de categorias para admin/editor" ON public.categories
  FOR UPDATE TO authenticated USING (public.is_editor_or_admin()) WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Exclusão de categorias apenas para admin" ON public.categories
  FOR DELETE TO authenticated USING (public.is_admin());

-- --- RLS: products ---
CREATE POLICY "Leitura pública de produtos publicados" ON public.products
  FOR SELECT USING (status = 'published' OR public.is_editor_or_admin());

CREATE POLICY "Escrita de produtos para admin/editor" ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Update de produtos para admin/editor" ON public.products
  FOR UPDATE TO authenticated USING (public.is_editor_or_admin()) WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Exclusão de produtos apenas para admin" ON public.products
  FOR DELETE TO authenticated USING (public.is_admin());

-- --- RLS: product_variations ---
CREATE POLICY "Leitura pública de variacoes de produtos publicados" ON public.product_variations
  FOR SELECT USING (
    (active = true AND EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND status = 'published'))
    OR public.is_editor_or_admin()
  );

CREATE POLICY "Escrita de variacoes para admin/editor" ON public.product_variations
  FOR INSERT TO authenticated WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Update de variacoes para admin/editor" ON public.product_variations
  FOR UPDATE TO authenticated USING (public.is_editor_or_admin()) WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Exclusão de variacoes apenas para admin" ON public.product_variations
  FOR DELETE TO authenticated USING (public.is_admin());

-- --- RLS: product_images ---
CREATE POLICY "Leitura pública de imagens de produtos publicados" ON public.product_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND status = 'published')
    OR public.is_editor_or_admin()
  );

CREATE POLICY "Escrita de imagens para admin/editor" ON public.product_images
  FOR INSERT TO authenticated WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Update de imagens para admin/editor" ON public.product_images
  FOR UPDATE TO authenticated USING (public.is_editor_or_admin()) WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Exclusão de imagens apenas para admin" ON public.product_images
  FOR DELETE TO authenticated USING (public.is_admin());

-- --- RLS: product_sizes ---
CREATE POLICY "Leitura pública de tamanhos de produtos publicados" ON public.product_sizes
  FOR SELECT USING (
    (is_available = true AND EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND status = 'published'))
    OR public.is_editor_or_admin()
  );

CREATE POLICY "Escrita de tamanhos para admin/editor" ON public.product_sizes
  FOR INSERT TO authenticated WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Update de tamanhos para admin/editor" ON public.product_sizes
  FOR UPDATE TO authenticated USING (public.is_editor_or_admin()) WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Exclusão de tamanhos apenas para admin" ON public.product_sizes
  FOR DELETE TO authenticated USING (public.is_admin());

-- --- RLS: size_guides ---
CREATE POLICY "Leitura pública de medidas de produtos publicados" ON public.size_guides
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND status = 'published')
    OR public.is_editor_or_admin()
  );

CREATE POLICY "Escrita de medidas para admin/editor" ON public.size_guides
  FOR INSERT TO authenticated WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Update de medidas para admin/editor" ON public.size_guides
  FOR UPDATE TO authenticated USING (public.is_editor_or_admin()) WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Exclusão de medidas apenas para admin" ON public.size_guides
  FOR DELETE TO authenticated USING (public.is_admin());

-- --- RLS: store_settings ---
CREATE POLICY "Leitura pública de configurações da loja" ON public.store_settings
  FOR SELECT USING (true);

CREATE POLICY "Escrita de configurações apenas para admin" ON public.store_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- RLS: leads ---
CREATE POLICY "Inserção pública de leads de compra" ON public.leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Acesso completo a leads apenas para admin" ON public.leads
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- RLS: analytics_events ---
CREATE POLICY "Inserção pública de eventos de métrica" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Acesso completo a eventos apenas para admin" ON public.analytics_events
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
