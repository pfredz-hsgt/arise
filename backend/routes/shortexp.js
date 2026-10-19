import express from 'express';
import pool from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Get all short exp items from kewps6_records directly
router.get('/', authenticateToken, async (req, res) => {
    try {
        const unit = req.query.main_unit || req.user.main_unit || 'OPD';
        const isAll = req.query.all_units === 'true';

        let query = `
            SELECT k.*, row_to_json(inv.*) as inventory_items 
            FROM kewps6_records k
            LEFT JOIN inventory_items inv ON k.item_id = inv.id
        `;
        const params = [];
        if (!isAll) {
            params.push(unit);
            query += ` WHERE inv.main_unit = $${params.length}`;
        }
        query += ` ORDER BY k.exp_date ASC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get batches for a specific item
router.get('/item/:itemId', authenticateToken, async (req, res) => {
    try {
        const unit = req.query.main_unit || req.user.main_unit;
        let query = 'SELECT k.* FROM kewps6_records k LEFT JOIN inventory_items inv ON k.item_id = inv.id WHERE k.item_id = $1';
        const params = [req.params.itemId];
        if (unit && req.user.role !== 'Issuer') {
            params.push(unit);
            query += ` AND (inv.main_unit = $${params.length} OR inv.main_unit IS NULL)`;
        }
        query += ' ORDER BY k.exp_date ASC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Sync batches for a specific item
router.post('/item/:itemId/batches', authenticateToken, async (req, res) => {
    const { itemId } = req.params;
    const { batches } = req.body;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        if (req.user.main_unit && req.user.role !== 'Issuer') {
            const itemCheck = await client.query('SELECT main_unit FROM inventory_items WHERE id = $1', [itemId]);
            if (itemCheck.rows.length > 0 && itemCheck.rows[0].main_unit && itemCheck.rows[0].main_unit !== req.user.main_unit) {
                await client.query('ROLLBACK');
                return res.status(403).json({ error: `Cannot update batches for item belonging to ${itemCheck.rows[0].main_unit}` });
            }
        }

        // Delete existing batches not in the new list
        const existingResult = await client.query('SELECT id FROM kewps6_records WHERE item_id = $1', [itemId]);
        const existingIds = existingResult.rows.map(r => r.id);
        
        const incomingIds = batches.filter(b => b.id).map(b => b.id);
        const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));
        
        if (idsToDelete.length > 0) {
            await client.query('DELETE FROM kewps6_records WHERE id = ANY($1)', [idsToDelete]);
        }
        
        // Upsert new/existing batches
        for (const b of batches) {
            if (!b.batch_no || !b.exp_date) continue;
            
            const today = new Date();
            const exp = new Date(b.exp_date);
            let m = (exp.getFullYear() - today.getFullYear()) * 12 + (exp.getMonth() - today.getMonth());
            if (m < 1) m = 1;
            const targetColumn = m <= 6 ? `qty_${m}m` : null;
            
            if (b.id) {
                // Update
                let updateQuery = `UPDATE kewps6_records SET batch_no = $1, exp_date = $2, qty = $3, se_remarks = $4`;
                let params = [b.batch_no, b.exp_date, b.qty || null, b.se_remarks || ''];
                if (targetColumn) {
                    updateQuery += `, ${targetColumn} = $5 WHERE id = $6`;
                    params.push(b.qty || null, b.id);
                } else {
                    updateQuery += ` WHERE id = $5`;
                    params.push(b.id);
                }
                await client.query(updateQuery, params);
            } else {
                // Insert
                if (targetColumn) {
                    await client.query(
                        `INSERT INTO kewps6_records (item_id, batch_no, exp_date, qty, se_remarks, ${targetColumn}) VALUES ($1, $2, $3, $4, $5, $6)`,
                        [itemId, b.batch_no, b.exp_date, b.qty || null, b.se_remarks || '', b.qty || null]
                    );
                } else {
                    await client.query(
                        `INSERT INTO kewps6_records (item_id, batch_no, exp_date, qty, se_remarks) VALUES ($1, $2, $3, $4, $5)`,
                        [itemId, b.batch_no, b.exp_date, b.qty || null, b.se_remarks || '']
                    );
                }
            }
        }
        
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Update or Insert short exp remark
router.post('/remark', authenticateToken, async (req, res) => {
    const { item_id, batch_no, exp_date, qty, se_remarks } = req.body;
    try {
        if (req.user.main_unit && req.user.role !== 'Issuer') {
            const itemCheck = await pool.query('SELECT main_unit FROM inventory_items WHERE id = $1', [item_id]);
            if (itemCheck.rows.length > 0 && itemCheck.rows[0].main_unit && itemCheck.rows[0].main_unit !== req.user.main_unit) {
                return res.status(403).json({ error: `Cannot update remarks for item belonging to ${itemCheck.rows[0].main_unit}` });
            }
        }

        const fetchRes = await pool.query('SELECT id FROM kewps6_records WHERE item_id = $1 AND batch_no = $2', [item_id, batch_no]);
        if (fetchRes.rows.length > 0) {
            await pool.query('UPDATE kewps6_records SET se_remarks = $1 WHERE id = $2', [se_remarks, fetchRes.rows[0].id]);
        } else {
            const today = new Date();
            const exp = new Date(exp_date);
            let m = (exp.getFullYear() - today.getFullYear()) * 12 + (exp.getMonth() - today.getMonth());
            if (m < 1) m = 1;
            const targetColumn = m <= 6 ? `qty_${m}m` : null;
            
            if (targetColumn) {
                await pool.query(`INSERT INTO kewps6_records (item_id, batch_no, exp_date, se_remarks, ${targetColumn}) VALUES ($1, $2, $3, $4, $5)`, [item_id, batch_no, exp_date, se_remarks, qty]);
            } else {
                await pool.query(`INSERT INTO kewps6_records (item_id, batch_no, exp_date, se_remarks) VALUES ($1, $2, $3, $4)`, [item_id, batch_no, exp_date, se_remarks]);
            }
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Archive current records (scoped to user's main_unit)
router.post('/archive', authenticateToken, async (req, res) => {
    const unit = req.body.main_unit || req.user.main_unit || 'OPD';
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Copy to archive for this unit
        await client.query(`
            INSERT INTO kewps6_archive 
            (item_id, batch_no, exp_date, se_remarks, qty_1m, qty_2m, qty_3m, qty_4m, qty_5m, qty_6m, qty, archived_by)
            SELECT k.item_id, k.batch_no, k.exp_date, k.se_remarks, k.qty_1m, k.qty_2m, k.qty_3m, k.qty_4m, k.qty_5m, k.qty_6m, k.qty, $1
            FROM kewps6_records k
            JOIN inventory_items inv ON k.item_id = inv.id
            WHERE inv.main_unit = $2
        `, [req.user.name || req.user.username || 'Admin', unit]);
        
        // Clear current records for this unit
        await client.query(`
            DELETE FROM kewps6_records k
            USING inventory_items inv
            WHERE k.item_id = inv.id AND inv.main_unit = $1
        `, [unit]);
        
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Get unique archived dates
router.get('/archive/dates', authenticateToken, async (req, res) => {
    try {
        const unit = req.query.main_unit || req.user.main_unit || 'OPD';
        const isAll = req.query.all_units === 'true';

        let query = `
            SELECT DISTINCT DATE(k.archived_date) as archived_date 
            FROM kewps6_archive k
            JOIN inventory_items inv ON k.item_id = inv.id
        `;
        const params = [];
        if (!isAll) {
            params.push(unit);
            query += ` WHERE inv.main_unit = $${params.length}`;
        }
        query += ` ORDER BY archived_date DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get archived data by date
router.get('/archive/data', authenticateToken, async (req, res) => {
    const { date } = req.query;
    const unit = req.query.main_unit || req.user.main_unit || 'OPD';
    const isAll = req.query.all_units === 'true';
    try {
        let query = `
            SELECT k.*, row_to_json(inv.*) as inventory_items 
            FROM kewps6_archive k
            LEFT JOIN inventory_items inv ON k.item_id = inv.id
            WHERE DATE(k.archived_date) = $1
        `;
        const params = [date];
        if (!isAll) {
            params.push(unit);
            query += ` AND inv.main_unit = $${params.length}`;
        }
        query += ` ORDER BY k.exp_date ASC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
