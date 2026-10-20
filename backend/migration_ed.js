import pool from './db.js';
import xlsx from 'xlsx';

async function importExcel() {
    try {
        // 2. Read Excel Workbook
        const workbook = xlsx.readFile('import_ed.xlsx');
        const sheetName = workbook.SheetNames[0]; // Gets the first sheet
        const sheet = workbook.Sheets[sheetName];

        // 3. Convert to JSON objects. 
        // defval: null explicitly converts empty or missing Excel cells to JavaScript null
        const rawData = xlsx.utils.sheet_to_json(sheet, { defval: null });

        // 4. Acquire database client
        const client = await pool.connect();
        console.log(`Successfully read Excel file. Importing ${rawData.length} items...`);

        // Prepared statement omitting id, created_at, and updated_at so Postgres defaults fire
        const queryText = `
      INSERT INTO inventory_items (
        name, item_code, pku, convert_sku, puchase_type, 
        std_kt, main_unit, row, tingkat, petak, 
        max_qty, balance, indent_source, remarks, type, image_url
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      );
    `;

        // 5. Run within a transaction for speed and safety
        await client.query('BEGIN');

        for (const row of rawData) {
            // Safe fallback logic for numbers if the Excel file contains text/blanks
            const convertSku = row.convert_sku !== null ? parseInt(row.convert_sku, 10) : 1;
            const tingkat = row.tingkat !== null ? parseInt(row.tingkat, 10) : null;
            const petakText = row.petak !== null ? String(row.petak) : null; // Handles numeric grid numbers as text safely

            const values = [
                row.name,                     // \$1
                row.item_code,                 // \$2
                row.pku,                       // \$3
                convertSku,                    // \$4 (defaults to 1 if empty)
                row.puchase_type,              // \$5 (spelled exactly like your schema)
                row.std_kt,                    // \$6
                row.main_unit,                 // \$7
                row.row,                       // \$8
                tingkat,                       // \$9
                petakText,                     // \$10 (mapped to your schema's TEXT data type)
                row.max_qty !== null ? parseInt(row.max_qty, 10) : null,  // \$11
                row.balance !== null ? parseInt(row.balance, 10) : null,  // \$12
                row.indent_source,             // \$13
                row.remarks,                   // \$14
                row.type,                      // \$15
                row.image_url                  // \$16
            ];

            await client.query(queryText, values);
        }

        await client.query('COMMIT');
        client.release();
        console.log('✅ Import completed successfully!');

    } catch (err) {
        console.error('❌ Error during database import. Transaction rolled back:', err);
    } finally {
        await pool.end();
    }
}

importExcel();