-- ==========================================
-- TFBRAND - SCRIPT DE INICIALIZAÇÃO SUPABASE
-- ==========================================
-- Instruções:
-- 1. Acesse seu painel do Supabase
-- 2. Vá em "SQL Editor"
-- 3. Crie uma nova query, cole todo este código e clique em "Run"

-- Habilitar extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela: Store Settings (Configurações da loja)
CREATE TABLE public.store_settings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_name text DEFAULT 'TFBrand',
  whatsapp_number text,
  instagram_url text,
  tech_email text DEFAULT 'tfbrandteck@gmail.com',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir configuração padrão
INSERT INTO public.store_settings (store_name) VALUES ('TFBrand') ON CONFLICT DO NOTHING;

-- 2. Tabela: Categories (Categorias)
CREATE TABLE public.categories (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir categorias padrão
INSERT INTO public.categories (name, slug, display_order) VALUES 
('Vestidos', 'vestidos', 1),
('Croppeds', 'croppeds', 2),
('Conjuntos', 'conjuntos', 3),
('Saias', 'saias', 4),
('Blusas', 'blusas', 5),
('Calças', 'calcas', 6)
ON CONFLICT (slug) DO NOTHING;

-- 3. Tabela: Products (Produtos)
CREATE TYPE product_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE public.products (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sku text NOT NULL UNIQUE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  short_description text,
  description text,
  price numeric(10,2) NOT NULL,
  promotional_price numeric(10,2),
  status product_status DEFAULT 'draft',
  is_new boolean DEFAULT false,
  is_bestseller boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  composition text,
  care_instructions jsonb DEFAULT '[]'::jsonb,
  fit_tip text,
  measurement_observation text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela: Product Variations (Variações de Cor)
CREATE TABLE public.product_variations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  color_name text NOT NULL,
  color_slug text NOT NULL,
  hex_code text,
  display_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela: Product Images (Imagens)
CREATE TABLE public.product_images (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  variation_id uuid REFERENCES public.product_variations(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  is_main boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabela: Product Sizes (Tamanhos e Estoque)
CREATE TABLE public.product_sizes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  variation_id uuid REFERENCES public.product_variations(id) ON DELETE CASCADE,
  size text NOT NULL, -- P, M, G, GG, etc.
  stock integer DEFAULT 0,
  is_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabela: Size Guides (Tabela de Medidas)
CREATE TABLE public.size_guides (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  size_name text NOT NULL,
  numbering text,
  bust text,
  waist text,
  hip text,
  length text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Tabela: Analytics Events (Métricas)
CREATE TABLE public.analytics_events (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type text NOT NULL, -- 'view_product', 'add_to_cart', 'whatsapp_click'
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  user_agent text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Configurar RLS (Row Level Security)

-- Produtos podem ser lidos por qualquer um (se publicados) e editados apenas por autenticados
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Produtos visíveis para todos" ON public.products FOR SELECT USING (status = 'published');
CREATE POLICY "Admins podem tudo em produtos" ON public.products FOR ALL USING (auth.role() = 'authenticated');

-- Categorias podem ser lidas por todos e editadas por admins
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categorias visíveis para todos" ON public.categories FOR SELECT USING (active = true);
CREATE POLICY "Admins podem tudo em categorias" ON public.categories FOR ALL USING (auth.role() = 'authenticated');

-- Variações lidas por todos, editadas por admins
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Variações visíveis para todos" ON public.product_variations FOR SELECT USING (active = true);
CREATE POLICY "Admins podem tudo em variações" ON public.product_variations FOR ALL USING (auth.role() = 'authenticated');

-- Imagens lidas por todos, editadas por admins
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Imagens visíveis para todos" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Admins podem tudo em imagens" ON public.product_images FOR ALL USING (auth.role() = 'authenticated');

-- Tamanhos lidos por todos, editados por admins
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tamanhos visíveis para todos" ON public.product_sizes FOR SELECT USING (is_available = true);
CREATE POLICY "Admins podem tudo em tamanhos" ON public.product_sizes FOR ALL USING (auth.role() = 'authenticated');

-- Medidas lidas por todos, editadas por admins
ALTER TABLE public.size_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Medidas visíveis para todos" ON public.size_guides FOR SELECT USING (true);
CREATE POLICY "Admins podem tudo em medidas" ON public.size_guides FOR ALL USING (auth.role() = 'authenticated');

-- Analytics inseridos por todos (anônimos), mas lidos apenas por admins
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Qualquer um pode inserir eventos" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Apenas admins leem eventos" ON public.analytics_events FOR SELECT USING (auth.role() = 'authenticated');

-- Configurações lidas por todos, editadas por admins
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Configurações visíveis para todos" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Admins podem tudo nas configurações" ON public.store_settings FOR ALL USING (auth.role() = 'authenticated');

-- CRIAR BUCKET DE STORAGE PARA IMAGENS
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;

-- PERMISSÕES DO BUCKET (Público lê, autenticado altera)
CREATE POLICY "Imagens publicas" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Upload por admin" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "Update por admin" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "Delete por admin" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
