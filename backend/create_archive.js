import pool from './db.js';

async function run() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS kewps6_archive (
                id SERIAL PRIMARY KEY,
                item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
                batch_no VARCHAR(100),
                exp_date DATE,
                se_remarks TEXT,
                qty_1m INTEGER,
                qty_2m INTEGER,
                qty_3m INTEGER,
                qty_4m INTEGER,
                qty_5m INTEGER,
                qty_6m INTEGER,
                qty INTEGER,
                archived_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                archived_by VARCHAR(255)
            );
        `);
        console.log("Table kewps6_archive created");
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
