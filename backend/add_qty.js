import pool from './db.js';

async function addQty() {
    try {
        await pool.query('ALTER TABLE kewps6_records ADD COLUMN IF NOT EXISTS qty INTEGER;');
        console.log('Successfully added qty to kewps6_records');
    } catch (err) {
        console.error('Error adding column:', err);
    } finally {
        pool.end();
    }
}

addQty();
