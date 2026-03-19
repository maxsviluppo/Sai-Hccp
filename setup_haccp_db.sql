-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  piva TEXT,
  address TEXT,
  phone TEXT,
  cellphone TEXT,
  whatsapp TEXT,
  email TEXT,
  license_number TEXT,
  suspended BOOLEAN DEFAULT false,
  logo TEXT
);

-- System Users Table
CREATE TABLE IF NOT EXISTS system_users (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id),
  name TEXT NOT NULL,
  email TEXT,
  role TEXT, -- 'ADMIN' | 'COLLABORATOR'
  department TEXT,
  active BOOLEAN DEFAULT true,
  avatar TEXT,
  username TEXT,
  password TEXT
);

-- Checklist Records Table
CREATE TABLE IF NOT EXISTS checklist_records (
  id TEXT PRIMARY KEY,
  module_id TEXT,
  user_id TEXT,
  client_id TEXT,
  date TEXT,
  data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id),
  user_id TEXT REFERENCES system_users(id),
  category TEXT,
  type TEXT,
  file_name TEXT,
  file_type TEXT,
  file_data TEXT,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TEXT
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT,
  sender_name TEXT,
  recipient_type TEXT, -- 'ALL' | 'SINGLE'
  recipient_id TEXT,
  recipient_user_id TEXT,
  subject TEXT,
  content TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT false,
  replies JSONB DEFAULT '[]'
);

-- Equipment Census
CREATE TABLE IF NOT EXISTS equipment (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id),
  area TEXT,
  name TEXT
);

-- Production Records
CREATE TABLE IF NOT EXISTS production_records (
  id TEXT PRIMARY KEY,
  recorded_date TEXT,
  main_product_name TEXT,
  packaging_date TEXT,
  expiry_date TEXT,
  lotto TEXT,
  ingredients JSONB,
  user_id TEXT,
  client_id TEXT
);

-- Disable RLS for development
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipment DISABLE ROW LEVEL SECURITY;
ALTER TABLE production_records DISABLE ROW LEVEL SECURITY;

-- TRUNCATE TABLES (Clear all test data)
TRUNCATE TABLE clients CASCADE;
TRUNCATE TABLE system_users CASCADE;
TRUNCATE TABLE checklist_records CASCADE;
TRUNCATE TABLE documents CASCADE;
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE equipment CASCADE;
TRUNCATE TABLE production_records CASCADE;

-- Insert ONLY the essential developer admin
INSERT INTO system_users (id, name, role, active, avatar, username, password)
VALUES ('dev-admin', 'Sviluppatore (Admin)', 'ADMIN', true, 'https://ui-avatars.com/api/?name=Dev&background=000&color=fff', 'dev', 'dev');

-- No demo companies or operators. Pure zero state.
