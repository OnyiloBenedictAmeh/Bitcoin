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
