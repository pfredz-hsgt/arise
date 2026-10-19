import pool from './db.js';

async function runMigration() {
    console.log('====================================================');
    console.log('🚀 Starting Database Migration: main_unit & cleanup');
    console.log('====================================================');
    
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        console.log('📦 Transaction started.');

        // 1. Create table main_unit
        console.log('\n[Step 1/6] Creating table "main_unit"...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS main_unit (
                name TEXT PRIMARY KEY,
                color TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        // Add updated_at trigger for main_unit
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_trigger WHERE tgname = 'update_main_unit_updated_at'
                ) THEN
                    CREATE TRIGGER update_main_unit_updated_at
                        BEFORE UPDATE ON main_unit
                        FOR EACH ROW
                        EXECUTE FUNCTION update_updated_at_column();
                END IF;
            END $$;
        `);
        console.log('   ✅ Table "main_unit" and updated_at trigger ensured.');

        // 2. Seed main_unit values (OPD, IPD, ED)
        console.log('\n[Step 2/6] Seeding "main_unit" records (OPD, IPD, ED)...');
        const seedResult = await client.query(`
            INSERT INTO main_unit (name, color)
            VALUES 
                ('OPD', 'blue'),
                ('IPD', 'green'),
                ('ED', 'volcano')
            ON CONFLICT (name) DO UPDATE 
            SET color = EXCLUDED.color, updated_at = NOW()
            RETURNING *;
        `);
        console.log(`   ✅ Seeded/verified ${seedResult.rows.length} units:`, seedResult.rows.map(r => `${r.name} (${r.color})`).join(', '));

        // 3. Add columns to inventory_items
        console.log('\n[Step 3/6] Adding columns to "inventory_items" (main_unit, tingkat, petak)...');
        await client.query(`
            ALTER TABLE inventory_items 
                ADD COLUMN IF NOT EXISTS main_unit TEXT REFERENCES main_unit(name) ON UPDATE CASCADE ON DELETE SET NULL,
                ADD COLUMN IF NOT EXISTS tingkat INTEGER,
                ADD COLUMN IF NOT EXISTS petak TEXT;
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_inventory_items_main_unit ON inventory_items(main_unit);
        `);
        console.log('   ✅ Columns "main_unit", "tingkat", "petak" and index idx_inventory_items_main_unit verified.');

        // 4. Add column to users
        console.log('\n[Step 4/6] Adding column to "users" (main_unit)...');
        await client.query(`
            ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS main_unit TEXT REFERENCES main_unit(name) ON UPDATE CASCADE ON DELETE SET NULL;
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_users_main_unit ON users(main_unit);
        `);
        console.log('   ✅ Column "main_unit" and index idx_users_main_unit verified.');

        // 5. Cleanup indent_items columns
        console.log('\n[Step 5/6] Cleaning up unused columns from "indent_items"...');
        await client.query(`
            ALTER TABLE indent_items 
                DROP COLUMN IF EXISTS batch_no_1,
                DROP COLUMN IF EXISTS exp_date_1,
                DROP COLUMN IF EXISTS short_qty_1,
                DROP COLUMN IF EXISTS batch_no_2,
                DROP COLUMN IF EXISTS exp_date_2,
                DROP COLUMN IF EXISTS short_qty_2;
        `);
        console.log('   ✅ Dropped columns: batch_no_1, exp_date_1, short_qty_1, batch_no_2, exp_date_2, short_qty_2.');

        // 6. Backfill existing inventory_items and users with main_unit = 'OPD'
        console.log('\n[Step 6/6] Injecting "OPD" for existing records with NULL main_unit...');
        const invUpdate = await client.query(`
            UPDATE inventory_items 
            SET main_unit = 'OPD' 
            WHERE main_unit IS NULL;
        `);
        console.log(`   ✅ Injected "OPD" into inventory_items: ${invUpdate.rowCount} rows updated.`);

        const userUpdate = await client.query(`
            UPDATE users 
            SET main_unit = 'OPD' 
            WHERE main_unit IS NULL;
        `);
        console.log(`   ✅ Injected "OPD" into users: ${userUpdate.rowCount} rows updated.`);

        await client.query('COMMIT');
        console.log('\n====================================================');
        console.log('🎉 Migration finished successfully!');
        console.log('====================================================');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('\n❌ Migration failed! Changes rolled back:', err);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

// Execute migration
runMigration().catch((err) => {
    console.error('Fatal error during migration:', err);
    process.exit(1);
});
