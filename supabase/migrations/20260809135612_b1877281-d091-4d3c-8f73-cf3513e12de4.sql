REVOKE SELECT ON public.store_settings FROM anon;
GRANT SELECT (id, store_name, store_info, support_phone, support_email, whatsapp, address, updated_at) ON public.store_settings TO anon;
GRANT SELECT ON public.store_settings TO authenticated;