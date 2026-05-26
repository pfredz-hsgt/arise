-- Run this in your PostgreSQL editor to seed the Admin user
-- Make sure the pgcrypto extension is enabled for bcrypt hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (email, password_hash, name, role)
VALUES (
    'admin@gmail.com', 
    crypt('admin', gen_salt('bf', 10)), 
    'Admin', 
    'Issuer'
) ON CONFLICT (email) DO NOTHING;
