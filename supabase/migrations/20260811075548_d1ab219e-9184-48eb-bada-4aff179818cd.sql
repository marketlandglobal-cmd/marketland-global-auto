ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS receipt_path text,
  ADD COLUMN IF NOT EXISTS receipt_submitted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS receipt_rejection_reason text;

CREATE OR REPLACE FUNCTION public.submit_payment_receipt(_order_id uuid, _receipt_path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
     SET receipt_path = _receipt_path,
         receipt_submitted_at = now(),
         receipt_rejection_reason = NULL,
         status = 'payment_verification_pending'
   WHERE id = _order_id
     AND user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_payment_receipt(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_payment_receipt(uuid, text) TO authenticated;

CREATE POLICY "receipts customer upload own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payment-receipts'
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.user_id = auth.uid()
      AND (storage.foldername(name))[1] = o.id::text
  )
);

CREATE POLICY "receipts customer read own"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payment-receipts'
  AND (
    private.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.user_id = auth.uid()
        AND (storage.foldername(name))[1] = o.id::text
    )
  )
);