-- ============================================================
-- 1. B2B / B2C dual pricing on products
--    Existing "price" column stays as a fallback/legacy value.
-- ============================================================
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS b2c_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS b2c_discount_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS b2b_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS b2b_discount_price NUMERIC(12,2);

-- Backfill: copy the existing single "price" into the matching
-- bucket based on product_type, so nothing breaks for old rows.
UPDATE products
SET b2c_price = price
WHERE product_type = 'B2C' AND b2c_price IS NULL;

UPDATE products
SET b2b_price = price
WHERE product_type = 'B2B' AND b2b_price IS NULL;

-- Sanity constraint: discount price (if set) must be <= base price
ALTER TABLE products
  ADD CONSTRAINT chk_b2c_discount_valid
    CHECK (b2c_discount_price IS NULL OR b2c_discount_price <= b2c_price),
  ADD CONSTRAINT chk_b2b_discount_valid
    CHECK (b2b_discount_price IS NULL OR b2b_discount_price <= b2b_price);

-- ============================================================
-- 2. Offers (admin-created, category-wide, time-limited)
-- ============================================================
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  price NUMERIC(12,2),                -- headline "from KSH x" price for the widget
  expires_at TIMESTAMPTZ NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offers_active_expiry
  ON offers (is_active, expires_at);

CREATE INDEX IF NOT EXISTS idx_offers_category
  ON offers (category_id);

-- Row Level Security: readable by any authenticated staff, writable only by admins
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY offers_select_authenticated ON offers
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY offers_admin_write ON offers
  FOR ALL
  USING (current_role() = 'admin')
  WITH CHECK (current_role() = 'admin');

-- ============================================================
-- 3. Public product page support
--    Human-friendly slug so /p/[slug] doesn't leak raw UUIDs
-- ============================================================
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE products
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(id::text, 1, 8)
WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products (slug);

-- Public read policy so the share-link page works with no login
CREATE POLICY products_public_read ON products
  FOR SELECT
  USING (true);
