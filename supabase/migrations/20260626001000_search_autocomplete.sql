-- Função otimizada para autocomplete da TFBrand com Score de Relevância
CREATE OR REPLACE FUNCTION public.search_autocomplete_products(
  p_query text,
  p_limit integer DEFAULT 6
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  sku text,
  price numeric(10,2),
  promotional_price numeric(10,2),
  main_image_url text,
  category_name text,
  category_slug text,
  color_name text,
  is_featured boolean,
  is_bestseller boolean,
  score integer
) AS $$
DECLARE
  v_clean_query text;
  v_starts_query text;
  v_exact_query text;
BEGIN
  -- Se a query for vazia, retorna sem resultados (na prática o front previne isso)
  IF p_query IS NULL OR trim(p_query) = '' THEN
    RETURN;
  END IF;

  v_exact_query := lower(unaccent(trim(p_query)));
  v_clean_query := '%' || v_exact_query || '%';
  v_starts_query := v_exact_query || '%';
  
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.sku,
    p.price,
    p.promotional_price,
    (
        -- Subquery para pegar a imagem principal da primeira variação
        SELECT pi.url 
        FROM public.product_images pi 
        JOIN public.product_variations pv ON pv.id = pi.variation_id
        WHERE pv.product_id = p.id AND pi.is_main = true AND pv.active = true
        ORDER BY pv.display_order ASC LIMIT 1
    ) AS main_image_url,
    c.name AS category_name,
    c.slug AS category_slug,
    (
        -- Subquery para pegar o nome da cor principal
        SELECT pv.color_name 
        FROM public.product_variations pv 
        WHERE pv.product_id = p.id AND pv.active = true 
        ORDER BY pv.display_order ASC LIMIT 1
    ) AS color_name,
    p.is_featured,
    p.is_bestseller,
    (
      -- SCORE CALCULATION
      CASE 
        -- 1. Match exato de SKU (Prioridade MÁXIMA)
        WHEN lower(unaccent(p.sku)) = v_exact_query THEN 100
        -- 2. Match exato de nome
        WHEN lower(unaccent(p.name)) = v_exact_query THEN 90
        -- 3. Match parcial de SKU
        WHEN lower(unaccent(p.sku)) LIKE v_clean_query THEN 80
        -- 4. Match nome começando com o termo
        WHEN lower(unaccent(p.name)) LIKE v_starts_query THEN 75
        -- 5. Match de nome parcial
        WHEN lower(unaccent(p.name)) LIKE v_clean_query THEN 60
        -- 6. Categoria exata
        WHEN lower(unaccent(c.name)) = v_exact_query THEN 50
        -- 7. Categoria parcial
        WHEN lower(unaccent(c.name)) LIKE v_clean_query THEN 40
        ELSE 10
      END
    ) + 
    -- Bônus de desempate
    (CASE WHEN p.is_bestseller THEN 5 ELSE 0 END) +
    (CASE WHEN p.is_featured THEN 3 ELSE 0 END) AS score
  FROM public.products p
  LEFT JOIN public.categories c ON c.id = p.category_id
  WHERE p.status = 'published'
    AND (
      lower(unaccent(p.name)) LIKE v_clean_query
      OR lower(unaccent(p.sku)) LIKE v_clean_query
      OR lower(unaccent(c.name)) LIKE v_clean_query
    )
  ORDER BY score DESC, p.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
