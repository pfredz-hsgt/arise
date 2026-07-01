import fs from 'fs';
import path from 'path';
import pool from './db.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateMaxQty() {
  try {
    const csvPath = path.join(__dirname, 'migratedb', 'maxqty.csv');
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvData.split('\n').filter(line => line.trim() !== '');

    console.log(`Found ${lines.length} records to update.`);
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let count = 0;
      for (const line of lines) {
        const [id, maxQtyStr] = line.split(',');
        if (id && maxQtyStr !== undefined) {
          const maxQty = parseInt(maxQtyStr.trim(), 10);
          await client.query(
            'UPDATE inventory_items SET max_qty = $1 WHERE id = $2',
            [maxQty, id.trim()]
          );
          count++;
        }
      }
      await client.query('COMMIT');
      console.log(`Successfully updated ${count} records.`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateMaxQty();
