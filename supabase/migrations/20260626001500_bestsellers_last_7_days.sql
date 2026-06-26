-- Atualiza a RPC para um sistema de pontuação inteligente (peso por tempo).
-- Cliques recentes valem mais, mas o histórico impede que a vitrine fique vazia.
CREATE OR REPLACE FUNCTION public.get_top_bestseller_ids()
RETURNS TABLE(product_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT ae.product_id
  FROM public.analytics_events ae
  WHERE ae.event_type = 'whatsapp_click' AND ae.product_id IS NOT NULL
  GROUP BY ae.product_id
  ORDER BY 
    SUM(
      CASE 
        -- Cliques na última semana têm peso 10 (Tendência super alta)
        WHEN ae.created_at >= (now() - interval '7 days') THEN 10
        -- Cliques no último mês têm peso 3 (Tendência média)
        WHEN ae.created_at >= (now() - interval '30 days') THEN 3
        -- Cliques antigos têm peso 1 (Garante que nunca fique vazio)
        ELSE 1
      END
    ) DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
