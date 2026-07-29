import pool from './db.js';

async function migrate() {
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;');
    console.log('Migration 3 successful');
    process.exit(0);
  } catch (err) {
    console.error('Migration 3 failed:', err);
    process.exit(1);
  }
}

migrate();
