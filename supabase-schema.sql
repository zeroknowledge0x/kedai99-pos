-- ============================================================
-- Kedai 99 POS - Supabase SQL Schema
-- Jalankan seluruh script ini di SQL Editor Supabase
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'kasir')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: products
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price BIGINT NOT NULL,
    description TEXT DEFAULT '',
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    image TEXT DEFAULT '',
    status TEXT DEFAULT 'tersedia' CHECK (status IN ('tersedia', 'habis')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: stocks
-- ============================================================
CREATE TABLE IF NOT EXISTS stocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    min_stock NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_number TEXT UNIQUE NOT NULL,
    cashier_id UUID REFERENCES users(id),
    total BIGINT NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('tunai', 'qris', 'transfer', 'e-wallet')),
    nominal_paid BIGINT DEFAULT 0,
    change_amount BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: transaction_items
-- ============================================================
CREATE TABLE IF NOT EXISTS transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID,
    product_name TEXT NOT NULL,
    price BIGINT NOT NULL,
    quantity INT NOT NULL,
    subtotal BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_transactions_cashier ON transactions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_items_txn ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================
-- RLS POLICIES (disable for simplicity, enable in production)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon/authenticated (simplified for this app)
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on stocks" ON stocks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on transaction_items" ON transaction_items FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- DUMMY DATA: Users
-- ============================================================
INSERT INTO users (name, email, password, role, active) VALUES
('Admin Kedai 99', 'admin@kedai99.com', 'admin123', 'admin', true),
('Kasir Rina', 'rina@kedai99.com', 'kasir123', 'kasir', true),
('Kasir Budi', 'budi@kedai99.com', 'kasir123', 'kasir', true),
('Kasir Sari', 'sari@kedai99.com', 'kasir123', 'kasir', true);

-- ============================================================
-- DUMMY DATA: Categories
-- ============================================================
INSERT INTO categories (name) VALUES
('Kopi'),
('Non Kopi'),
('Makanan'),
('Snack'),
('Minuman Dingin');

-- ============================================================
-- DUMMY DATA: Products (20 items)
-- ============================================================
DO $$
DECLARE
    kat_kopi UUID;
    kat_nonkopi UUID;
    kat_makanan UUID;
    kat_snack UUID;
    kat_dingin UUID;
BEGIN
    SELECT id INTO kat_kopi FROM categories WHERE name = 'Kopi';
    SELECT id INTO kat_nonkopi FROM categories WHERE name = 'Non Kopi';
    SELECT id INTO kat_makanan FROM categories WHERE name = 'Makanan';
    SELECT id INTO kat_snack FROM categories WHERE name = 'Snack';
    SELECT id INTO kat_dingin FROM categories WHERE name = 'Minuman Dingin';

    INSERT INTO products (name, price, description, category_id, status) VALUES
    ('Kopi Hitam', 12000, 'Kopi hitam robusta pilihan', kat_kopi, 'tersedia'),
    ('Kopi Susu', 15000, 'Kopi susu dengan susu segar', kat_kopi, 'tersedia'),
    ('Espresso', 13000, 'Espresso single shot', kat_kopi, 'tersedia'),
    ('Americano', 16000, 'Americano dengan espresso double shot', kat_kopi, 'tersedia'),
    ('Cappuccino', 18000, 'Cappuccino dengan foam susu', kat_kopi, 'tersedia'),
    ('Teh Tarik', 12000, 'Teh tarik khas Malaysia', kat_nonkopi, 'tersedia'),
    ('Teh Manis', 8000, 'Teh manis segar', kat_nonkopi, 'tersedia'),
    ('Matcha Latte', 18000, 'Matcha latte premium', kat_nonkopi, 'tersedia'),
    ('Cokelat Panas', 15000, 'Cokelat panas dengan susu', kat_nonkopi, 'tersedia'),
    ('Air Mineral', 5000, 'Air mineral 600ml', kat_nonkopi, 'tersedia'),
    ('Nasi Goreng', 20000, 'Nasi goreng spesial dengan telur', kat_makanan, 'tersedia'),
    ('Mie Goreng', 18000, 'Mie goreng dengan sayuran', kat_makanan, 'tersedia'),
    ('Roti Bakar', 15000, 'Roti bakar dengan selai cokelat', kat_makanan, 'tersedia'),
    ('Sandwich', 22000, 'Sandwich ayam dengan sayuran segar', kat_makanan, 'tersedia'),
    ('Pisang Goreng', 10000, 'Pisang goreng crispy (5 pcs)', kat_snack, 'tersedia'),
    ('Kentang Goreng', 15000, 'Kentang goreng dengan saus', kat_snack, 'tersedia'),
    ('Tahu Crispy', 10000, 'Tahu crispy dengan bumbu tabur', kat_snack, 'tersedia'),
    ('Es Jeruk', 10000, 'Es jeruk peras segar', kat_dingin, 'tersedia'),
    ('Es Teh', 7000, 'Es teh manis', kat_dingin, 'tersedia'),
    ('Smoothie Berry', 20000, 'Smoothie mixed berry', kat_dingin, 'tersedia');
END $$;

-- ============================================================
-- DUMMY DATA: Stocks
-- ============================================================
INSERT INTO stocks (name, quantity, unit, min_stock) VALUES
('Kopi Arabika', 10, 'Kg', 3),
('Kopi Robusta', 8, 'Kg', 3),
('Susu UHT', 20, 'Liter', 5),
('Gula Pasir', 15, 'Kg', 5),
('Teh Celup', 50, 'Box', 10),
('Tepung Terigu', 10, 'Kg', 3),
('Minyak Goreng', 15, 'Liter', 5),
('Beras', 25, 'Kg', 10),
('Mie Instan', 40, 'Pack', 10),
('Roti Tawar', 20, 'Pack', 5);

-- ============================================================
-- DUMMY DATA: Transactions (10 contoh)
-- ============================================================
DO $$
DECLARE
    kasir1 UUID;
    kasir2 UUID;
    prod1 UUID;
    prod2 UUID;
    prod3 UUID;
    prod4 UUID;
    prod5 UUID;
    txn_id UUID;
    txn_num TEXT;
    i INT;
BEGIN
    SELECT id INTO kasir1 FROM users WHERE email = 'rina@kedai99.com';
    SELECT id INTO kasir2 FROM users WHERE email = 'budi@kedai99.com';

    FOR i IN 1..10 LOOP
        txn_num := 'TRX-' || TO_CHAR(NOW() - (i || ' days')::INTERVAL, 'YYYYMMDD') || '-' || LPAD(i::TEXT, 4, '0');

        INSERT INTO transactions (transaction_number, cashier_id, total, payment_method, nominal_paid, change_amount, created_at)
        VALUES (
            txn_num,
            CASE WHEN i % 2 = 0 THEN kasir1 ELSE kasir2 END,
            CASE
                WHEN i % 3 = 0 THEN 45000
                WHEN i % 3 = 1 THEN 32000
                ELSE 58000
            END,
            CASE
                WHEN i % 4 = 0 THEN 'tunai'
                WHEN i % 4 = 1 THEN 'qris'
                WHEN i % 4 = 2 THEN 'transfer'
                ELSE 'e-wallet'
            END,
            CASE WHEN i % 4 = 0 THEN 50000 ELSE 0 END,
            CASE WHEN i % 4 = 0 THEN 5000 ELSE 0 END,
            NOW() - (i || ' days')::INTERVAL
        )
        RETURNING id INTO txn_id;

        -- Add items to each transaction
        SELECT id INTO prod1 FROM products ORDER BY RANDOM() LIMIT 1;
        SELECT id INTO prod2 FROM products ORDER BY RANDOM() LIMIT 1;
        SELECT id INTO prod3 FROM products ORDER BY RANDOM() LIMIT 1;

        INSERT INTO transaction_items (transaction_id, product_id, product_name, price, quantity, subtotal)
        SELECT txn_id, p.id, p.name, p.price, 1, p.price
        FROM products p WHERE p.id IN (prod1, prod2, prod3);
    END LOOP;
END $$;
