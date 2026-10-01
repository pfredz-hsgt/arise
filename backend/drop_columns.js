import pool from './db.js';

async function dropColumns() {
    try {
        await pool.query('ALTER TABLE inventory_items DROP COLUMN IF EXISTS is_short_exp;');
        await pool.query('ALTER TABLE inventory_items DROP COLUMN IF EXISTS short_exp;');
        console.log('Successfully dropped unused short expiry columns from inventory_items');
    } catch (err) {
        console.error('Error dropping columns:', err);
    } finally {
        pool.end();
    }
}

dropColumns();
