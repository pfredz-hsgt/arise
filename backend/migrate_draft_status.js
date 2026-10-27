import pool from './db.js';

async function runMigration() {
    console.log('====================================================');
    console.log('🚀 Migration: Alter indent_requests status to allow Draft');
    console.log('====================================================');

    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        console.log('📦 Transaction started.');

        console.log('1. Dropping existing status check constraint if present...');
        await client.query(`
            ALTER TABLE indent_requests 
            DROP CONSTRAINT IF EXISTS indent_requests_status_check;
        `);

        console.log('2. Adding updated constraint with Draft, Pending, Approved, Completed...');
        await client.query(`
            ALTER TABLE indent_requests 
            ADD CONSTRAINT indent_requests_status_check 
            CHECK (status IN ('Draft', 'Pending', 'Approved', 'Completed'));
        `);

        console.log('3. Setting status DEFAULT to Draft...');
        await client.query(`
            ALTER TABLE indent_requests 
            ALTER COLUMN status SET DEFAULT 'Draft';
        `);

        await client.query('COMMIT');
        console.log('✅ Migration completed successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed, rolled back:', err);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
