import pool from './db.js';
import { encrypt } from './utils/crypto.js';

async function migratePhisPasswords() {
    try {
        const res = await pool.query('SELECT id, phis_password FROM users WHERE phis_password IS NOT NULL AND phis_password != \'\'');
        console.log(`Found ${res.rows.length} users with phis_password.`);

        let updatedCount = 0;
        for (const user of res.rows) {
            const currentPass = user.phis_password;
            // Skip if already in iv:authTag:encrypted format (length > 20 and has 2 colons)
            if (currentPass && currentPass.split(':').length === 3) {
                console.log(`User ${user.id} phis_password already encrypted.`);
                continue;
            }

            const encrypted = encrypt(currentPass);
            await pool.query('UPDATE users SET phis_password = $1 WHERE id = $2', [encrypted, user.id]);
            updatedCount++;
        }

        console.log(`Successfully encrypted ${updatedCount} phis_password entries.`);
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migratePhisPasswords();
