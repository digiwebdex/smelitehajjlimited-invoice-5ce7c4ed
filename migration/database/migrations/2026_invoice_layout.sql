-- Invoice Layout CMS schema
CREATE TABLE IF NOT EXISTS public.invoice_layout_settings (
  id UUID PRIMARY KEY,
  layout JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.invoice_layout_settings (id, layout)
  VALUES ('00000000-0000-0000-0000-000000000010', '{}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS invoice_layout JSONB;
