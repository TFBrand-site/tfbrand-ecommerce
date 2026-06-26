-- ==========================================
-- TFBrand - Script de Banco de Dados (Supabase)
-- ==========================================

-- Se quiser limpar o banco atual, descomente as linhas abaixo:
-- DROP TABLE IF EXISTS analytics_events CASCADE;
-- DROP TABLE IF EXISTS size_guides CASCADE;
-- DROP TABLE IF EXISTS product_sizes CASCADE;
-- DROP TABLE IF EXISTS product_images CASCADE;
-- DROP TABLE IF EXISTS product_variations CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS store_settings CASCADE;
-- DROP TYPE IF EXISTS product_status CASCADE;

-- 1. Store Settings
CREATE TABLE IF NOT EXISTS store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text DEFAULT 'TFBrand',
  whatsapp_number text,
  instagram_url text,
  tech_email text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Products
CREATE TYPE product_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sku text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  short_description text,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
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
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 4. Product Variations (Colors)
CREATE TABLE IF NOT EXISTS product_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  color_name text NOT NULL,
  color_slug text NOT NULL,
  hex_code text,
  display_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(product_id, color_slug)
);

-- 5. Product Images
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  variation_id uuid REFERENCES product_variations(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  is_main boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- 6. Product Sizes
CREATE TABLE IF NOT EXISTS product_sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  variation_id uuid REFERENCES product_variations(id) ON DELETE CASCADE,
  size text NOT NULL,
  stock integer DEFAULT 0,
  is_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(variation_id, size)
);

-- 7. Size Guides
CREATE TABLE IF NOT EXISTS size_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  size_name text NOT NULL,
  numbering text,
  bust text,
  waist text,
  hip text,
  length text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(product_id, size_name)
);

-- 8. Analytics Events
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Imagens públicas" ON storage.objects FOR SELECT USING ( bucket_id = 'product-images' );
CREATE POLICY "Admins upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );
CREATE POLICY "Admins delete" ON storage.objects FOR DELETE USING ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );


-- LEADS / PEDIDOS (Para capturar cliques no checkout WhatsApp)
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name text,
  customer_phone text,
  items jsonb NOT NULL,
  subtotal numeric NOT NULL,
  status text NOT NULL DEFAULT 'iniciado', -- iniciado, confirmado, cancelado
  device_info text,
  origin text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CONFIGURAÇÕES DA LOJA (Armazena opções do painel)
CREATE TABLE IF NOT EXISTS store_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_name text NOT NULL DEFAULT 'TFBrand',
  whatsapp_number text,
  instagram_url text,
  technical_email text DEFAULT 'tfbrandteck@gmail.com',
  whatsapp_checkout_message text,
  whatsapp_doubt_message text,
  payment_info text,
  shipping_info text,
  exchange_policy text,
  meta_title text,
  meta_description text,
  ga_measurement_id text,
  admin_name text,
  admin_email text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS para Leads e Store Settings
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Permitir tudo para leads (o publico pode criar lead, admin pode ver tudo)
-- Neste projeto foi desativado RLS para o admin funcionar com ANON KEY sem Auth,
-- Então vamos criar policies ou desabilitar RLS assim como as outras tabelas.
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings DISABLE ROW LEVEL SECURITY;

-- Setup inicial para store settings caso vazia
INSERT INTO store_settings (store_name)
SELECT 'TFBrand'
WHERE NOT EXISTS (SELECT 1 FROM store_settings LIMIT 1);
