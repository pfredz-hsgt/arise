-- PIMS Database Schema (Consolidated Latest)
-- Emergency Pharmacy Hospital Segamat

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'Indenter' CHECK (role IN ('Issuer', 'Indenter')),
  phis_username TEXT,
  phis_password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: inventory_items
-- Master list of all drugs in the pharmacy
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  item_code TEXT,
  pku TEXT,
  convert_sku INTEGER DEFAULT 1,
  puchase_type TEXT CHECK (puchase_type IN ('LP', 'APPL')),
  std_kt TEXT CHECK (std_kt IN ('STD', 'KT')),
  row TEXT,
  max_qty INTEGER,
  balance INTEGER,
  indent_source TEXT CHECK (indent_source IN ('OPD Kaunter', 'OPD Substor', 'IPD Kaunter', 'MNF Substor', 'MNF Eksternal', 'MNF Internal', 'Prepacking', 'IPD Substor', 'HPSF Muar')),
  remarks TEXT,
  is_short_exp BOOLEAN DEFAULT false,
  short_exp DATE,
  type TEXT CHECK (type IN ('OPD', 'Eye/Ear/Nose/Inh', 'DDA', 'External', 'Injection', 'Syrup', 'Others', 'UOD', 'Non-Drug')),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: indent_sessions
CREATE TABLE IF NOT EXISTS indent_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_type TEXT,
  status TEXT DEFAULT 'Draft',
  rak TEXT,
  last_item UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: indent_items
-- (Stores Routine Indent Items & Short Expiry)
CREATE TABLE IF NOT EXISTS indent_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES indent_sessions(id) ON DELETE CASCADE,
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  requested_qty INTEGER,
  indent_remarks TEXT,
  snapshot_max_qty INTEGER,
  snapshot_balance INTEGER,
  batch_no_1 TEXT,
  exp_date_1 DATE,
  short_qty_1 INTEGER,
  batch_no_2 TEXT,
  exp_date_2 DATE,
  short_qty_2 INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: indent_requests (Ad-Hoc Requests & Cart Items)
-- Stores cart items and finalized orders
CREATE TABLE IF NOT EXISTS indent_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  requested_qty TEXT NOT NULL,
  indent_remarks TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Completed')),
  snapshot_max_qty INTEGER,
  snapshot_balance INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_name ON inventory_items(name);
CREATE INDEX IF NOT EXISTS idx_inventory_items_indent_source ON inventory_items(indent_source);
CREATE INDEX IF NOT EXISTS idx_indent_requests_status ON indent_requests(status);
CREATE INDEX IF NOT EXISTS idx_indent_requests_item_id ON indent_requests(item_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indent_requests_updated_at
  BEFORE UPDATE ON indent_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indent_sessions_updated_at
  BEFORE UPDATE ON indent_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indent_items_updated_at
  BEFORE UPDATE ON indent_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table: kewps6_records
CREATE TABLE IF NOT EXISTS kewps6_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  batch_no TEXT,
  exp_date DATE,
  se_remarks TEXT,
  qty_1m INTEGER,
  qty_2m INTEGER,
  qty_3m INTEGER,
  qty_4m INTEGER,
  qty_5m INTEGER,
  qty_6m INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_kewps6_records_updated_at
  BEFORE UPDATE ON kewps6_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
