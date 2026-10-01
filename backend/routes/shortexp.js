import express from 'express';
import pool from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Get all short exp items from kewps6_records directly
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT k.*, row_to_json(inv.*) as inventory_items 
            FROM kewps6_records k
            LEFT JOIN inventory_items inv ON k.item_id = inv.id
            ORDER BY k.exp_date ASC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get batches for a specific item
router.get('/item/:itemId', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM kewps6_records WHERE item_id = $1 ORDER BY exp_date ASC', 
            [req.params.itemId]
        );
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

// Archive current records
router.post('/archive', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Copy to archive
        await client.query(`
            INSERT INTO kewps6_archive 
            (item_id, batch_no, exp_date, se_remarks, qty_1m, qty_2m, qty_3m, qty_4m, qty_5m, qty_6m, qty, archived_by)
            SELECT item_id, batch_no, exp_date, se_remarks, qty_1m, qty_2m, qty_3m, qty_4m, qty_5m, qty_6m, qty, $1
            FROM kewps6_records
        `, [req.user.name || req.user.username || 'Admin']);
        
        // Clear current records
        await client.query('DELETE FROM kewps6_records');
        
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
        const result = await pool.query(`
            SELECT DISTINCT DATE(archived_date) as archived_date 
            FROM kewps6_archive 
            ORDER BY archived_date DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get archived data by date
router.get('/archive/data', authenticateToken, async (req, res) => {
    const { date } = req.query;
    try {
        const result = await pool.query(`
            SELECT k.*, row_to_json(inv.*) as inventory_items 
            FROM kewps6_archive k
            LEFT JOIN inventory_items inv ON k.item_id = inv.id
            WHERE DATE(k.archived_date) = $1
            ORDER BY k.exp_date ASC
        `, [date]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
