import pool from '../db.js';

async function migrateLookupTables() {
    console.log('Starting migration for lookup tables...');
    try {
        // 1. Create the new tables
        console.log('Creating new tables indent_sources and item_types...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS indent_sources (
                name TEXT PRIMARY KEY,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS item_types (
                name TEXT PRIMARY KEY,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        // 2. Insert default and existing unique values
        console.log('Inserting default values...');
        const defaultSources = [
            'OPD Kaunter', 'OPD Substor', 'IPD Kaunter', 'MNF Substor', 
            'MNF Eksternal', 'MNF Internal', 'Prepacking', 'IPD Substor', 'HPSF Muar'
        ];
        for (const source of defaultSources) {
            await pool.query(`
                INSERT INTO indent_sources (name) 
                VALUES ($1) 
                ON CONFLICT (name) DO NOTHING;
            `, [source]);
        }

        const defaultTypes = [
            'OPD', 'Eye/Ear/Nose/Inh', 'DDA', 'External', 
            'Injection', 'Syrup', 'Others', 'UOD', 'Non-Drug'
        ];
        for (const type of defaultTypes) {
            await pool.query(`
                INSERT INTO item_types (name) 
                VALUES ($1) 
                ON CONFLICT (name) DO NOTHING;
            `, [type]);
        }

        // 3. Find and insert any custom existing values from inventory_items
        console.log('Migrating existing unique values from inventory_items...');
        await pool.query(`
            INSERT INTO indent_sources (name)
            SELECT DISTINCT indent_source FROM inventory_items WHERE indent_source IS NOT NULL
            ON CONFLICT (name) DO NOTHING;
        `);

        await pool.query(`
            INSERT INTO item_types (name)
            SELECT DISTINCT type FROM inventory_items WHERE type IS NOT NULL
            ON CONFLICT (name) DO NOTHING;
        `);

        // 4. Update the constraints on inventory_items
        console.log('Updating foreign key constraints on inventory_items...');
        
        // Postgres dynamically generates check constraint names if not explicitly named, usually <tablename>_<column>_check
        // Let's drop them if they exist
        await pool.query(`ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_indent_source_check;`);
        await pool.query(`ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_type_check;`);
        
        // Add foreign keys
        // Note: we can only add foreign keys if all values exist in the parent tables, which we just ensured.
        
        // Drop existing FKs just in case it was run before
        await pool.query(`ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS fk_inventory_items_indent_source;`);
        await pool.query(`ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS fk_inventory_items_type;`);

        await pool.query(`
            ALTER TABLE inventory_items 
            ADD CONSTRAINT fk_inventory_items_indent_source 
            FOREIGN KEY (indent_source) REFERENCES indent_sources(name) 
            ON UPDATE CASCADE ON DELETE SET NULL;
        `);

        await pool.query(`
            ALTER TABLE inventory_items 
            ADD CONSTRAINT fk_inventory_items_type 
            FOREIGN KEY (type) REFERENCES item_types(name) 
            ON UPDATE CASCADE ON DELETE SET NULL;
        `);

        console.log('Migration completed successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrateLookupTables();
