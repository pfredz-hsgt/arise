import pool from './db.js';

async function migrate() {
  try {
    console.log('Starting migration...');

    // Add new columns to users table
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phis_username TEXT;');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phis_password TEXT;');
    console.log('Added phis_username and phis_password to users table.');

    // Add convert_sku to inventory_items table
    await pool.query('ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS convert_sku INTEGER DEFAULT 1;');
    console.log('Added convert_sku to inventory_items table.');

    // Update convert_sku by extracting number from pku
    const updateQuery = `
      UPDATE inventory_items 
      SET convert_sku = COALESCE(
        CAST(SUBSTRING(pku FROM '\\d+') AS INTEGER), 
        1
      );
    `;
    await pool.query(updateQuery);
    console.log('Updated convert_sku values based on pku.');

    console.log('Migration successful');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
