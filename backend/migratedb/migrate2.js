import pool from '../db.js';

const PRESET_COLORS = ['blue', 'purple', 'cyan', 'green', 'magenta', 'pink', 'red', 'orange', 'yellow', 'volcano', 'geekblue', 'lime', 'gold'];
const getRandomColor = () => PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];

async function migrateColorsAndMore() {
    console.log('Starting migration for colors and new lookup tables...');
    try {
        // 1. Add color column to existing tables
        console.log('Adding color column to indent_sources and item_types...');
        await pool.query(`ALTER TABLE indent_sources ADD COLUMN IF NOT EXISTS color TEXT;`);
        await pool.query(`ALTER TABLE item_types ADD COLUMN IF NOT EXISTS color TEXT;`);

        // 2. Create new tables
        console.log('Creating new tables purchase_types and std_kts...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS purchase_types (
                name TEXT PRIMARY KEY,
                color TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS std_kts (
                name TEXT PRIMARY KEY,
                color TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        // 3. Update existing colors for indent_sources based on colorMappings.js
        console.log('Setting colors for indent_sources...');
        const sourceColors = {
            'OPD Kaunter': 'green',
            'OPD Substor': 'cyan',
            'IPD Kaunter': 'geekblue',
            'IPD Substor': 'blue',
            'MNF Substor': 'volcano',
            'MNF Eksternal': 'magenta',
            'MNF Internal': 'orange',
            'Prepacking': 'purple',
            'HPSF Muar': 'gold',
        };
        for (const [name, color] of Object.entries(sourceColors)) {
            await pool.query(`UPDATE indent_sources SET color = $1 WHERE name = $2;`, [color, name]);
        }
        // For any remaining indent_sources without a color, set a random one
        let res = await pool.query(`SELECT name FROM indent_sources WHERE color IS NULL`);
        for (const row of res.rows) {
            await pool.query(`UPDATE indent_sources SET color = $1 WHERE name = $2`, [getRandomColor(), row.name]);
        }

        // 4. Set colors for item_types (random since we didn't have mapping)
        console.log('Setting colors for item_types...');
        res = await pool.query(`SELECT name FROM item_types WHERE color IS NULL`);
        for (const row of res.rows) {
            await pool.query(`UPDATE item_types SET color = $1 WHERE name = $2`, [getRandomColor(), row.name]);
        }

        // 5. Insert defaults for purchase_types and std_kts
        console.log('Inserting default values for purchase_types and std_kts...');
        const purchaseTypes = [
            { name: 'LP', color: 'gold' },
            { name: 'APPL', color: 'geekblue' }
        ];
        for (const pt of purchaseTypes) {
            await pool.query(`
                INSERT INTO purchase_types (name, color) 
                VALUES ($1, $2) 
                ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color;
            `, [pt.name, pt.color]);
        }

        const stdKts = [
            { name: 'STD', color: 'green' },
            { name: 'KT', color: 'red' }
        ];
        for (const sk of stdKts) {
            await pool.query(`
                INSERT INTO std_kts (name, color) 
                VALUES ($1, $2) 
                ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color;
            `, [sk.name, sk.color]);
        }

        // 6. Migrate any custom existing values from inventory_items
        console.log('Migrating existing unique values from inventory_items...');
        const uniquePurchaseTypes = await pool.query(`SELECT DISTINCT puchase_type FROM inventory_items WHERE puchase_type IS NOT NULL`);
        for (const row of uniquePurchaseTypes.rows) {
            await pool.query(`
                INSERT INTO purchase_types (name, color) 
                VALUES ($1, $2) 
                ON CONFLICT (name) DO NOTHING;
            `, [row.puchase_type, getRandomColor()]);
        }

        const uniqueStdKts = await pool.query(`SELECT DISTINCT std_kt FROM inventory_items WHERE std_kt IS NOT NULL`);
        for (const row of uniqueStdKts.rows) {
            await pool.query(`
                INSERT INTO std_kts (name, color) 
                VALUES ($1, $2) 
                ON CONFLICT (name) DO NOTHING;
            `, [row.std_kt, getRandomColor()]);
        }

        // 7. Update foreign keys
        console.log('Updating foreign key constraints on inventory_items...');
        
        await pool.query(`ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_puchase_type_check;`);
        await pool.query(`ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_std_kt_check;`);
        
        await pool.query(`ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS fk_inventory_items_puchase_type;`);
        await pool.query(`ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS fk_inventory_items_std_kt;`);

        await pool.query(`
            ALTER TABLE inventory_items 
            ADD CONSTRAINT fk_inventory_items_puchase_type 
            FOREIGN KEY (puchase_type) REFERENCES purchase_types(name) 
            ON UPDATE CASCADE ON DELETE SET NULL;
        `);

        await pool.query(`
            ALTER TABLE inventory_items 
            ADD CONSTRAINT fk_inventory_items_std_kt 
            FOREIGN KEY (std_kt) REFERENCES std_kts(name) 
            ON UPDATE CASCADE ON DELETE SET NULL;
        `);

        console.log('Migration completed successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrateColorsAndMore();
