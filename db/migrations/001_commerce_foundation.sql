-- S STORE: run once against the Neon database before deploying order/account APIs.
-- No receiving wallet/account details are stored here; configure those as environment variables.

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS customer_name varchar,
    ADD COLUMN IF NOT EXISTS customer_email varchar,
    ADD COLUMN IF NOT EXISTS customer_phone varchar,
    ADD COLUMN IF NOT EXISTS shipping_address jsonb,
    ADD COLUMN IF NOT EXISTS payment_method varchar NOT NULL DEFAULT 'bitcoin',
    ADD COLUMN IF NOT EXISTS payment_reference varchar,
    ADD COLUMN IF NOT EXISTS bitcoin_amount numeric,
    ADD COLUMN IF NOT EXISTS bitcoin_txid varchar;

-- Stripe Checkout session/payment intent reference for card orders.
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS stripe_session_id varchar;

ALTER TABLE orders
    ALTER COLUMN status SET DEFAULT 'pending',
    ALTER COLUMN payment_status SET DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS orders_user_id_created_at_idx
    ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx
    ON orders (payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx
    ON order_items (order_id);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone varchar,
    ALTER COLUMN role SET DEFAULT 'customer';

CREATE TABLE IF NOT EXISTS cart_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 99),
    options jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, product_id, options)
);
CREATE INDEX IF NOT EXISTS cart_items_user_id_idx ON cart_items (user_id, created_at);
