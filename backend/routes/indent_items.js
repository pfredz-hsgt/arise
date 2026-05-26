import express from 'express';
import pool from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Get item(s) by session_id and optionally item_id
router.get('/', authenticateToken, async (req, res) => {
    const { session_id, session_ids, item_id } = req.query;
    try {
        let query = `
            SELECT i.*, row_to_json(inv.*) as inventory_items 
            FROM indent_items i
            LEFT JOIN inventory_items inv ON i.item_id = inv.id
            WHERE 1=1
        `;
        const params = [];
        
        if (session_id) {
            params.push(session_id);
            query += ` AND i.session_id = $${params.length}`;
        } else if (session_ids) {
            const ids = session_ids.split(',');
            params.push(ids);
            query += ` AND i.session_id = ANY($${params.length}::uuid[])`;
        }

        if (item_id) {
            params.push(item_id);
            query += ` AND i.item_id = $${params.length}`;
        }

        query += ' ORDER BY i.created_at ASC';

        const result = await pool.query(query, params);
        
        // If searching for specific item, act like single() or maybeSingle()
        if (item_id) {
            return res.json(result.rows[0] || null);
        }
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get short exp record by item_id
router.get('/shortexp/:item_id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM indent_items 
            WHERE item_id = $1 AND (batch_no_1 IS NOT NULL OR batch_no_2 IS NOT NULL)
            ORDER BY created_at DESC LIMIT 1
        `, [req.params.item_id]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.json(null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create item
router.post('/', authenticateToken, async (req, res) => {
    const data = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO indent_items (
                session_id, item_id, requested_qty, indent_remarks, snapshot_max_qty, snapshot_balance,
                batch_no_1, exp_date_1, short_qty_1, batch_no_2, exp_date_2, short_qty_2
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
            [
                data.session_id, data.item_id, data.requested_qty, data.indent_remarks, data.snapshot_max_qty, data.snapshot_balance,
                data.batch_no_1, data.exp_date_1, data.short_qty_1, data.batch_no_2, data.exp_date_2, data.short_qty_2
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update item
router.put('/:id', authenticateToken, async (req, res) => {
    const data = req.body;
    try {
        const result = await pool.query(
            `UPDATE indent_items SET 
                requested_qty = COALESCE($1, requested_qty),
                indent_remarks = COALESCE($2, indent_remarks),
                snapshot_max_qty = COALESCE($3, snapshot_max_qty),
                snapshot_balance = COALESCE($4, snapshot_balance),
                batch_no_1 = $5,
                exp_date_1 = $6,
                short_qty_1 = $7,
                batch_no_2 = $8,
                exp_date_2 = $9,
                short_qty_2 = $10
            WHERE id = $11 RETURNING *`,
            [
                data.requested_qty, data.indent_remarks, data.snapshot_max_qty, data.snapshot_balance,
                data.batch_no_1, data.exp_date_1, data.short_qty_1, data.batch_no_2, data.exp_date_2, data.short_qty_2,
                req.params.id
            ]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete item
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM indent_items WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete multiple items (for HomePage draft cleanup)
router.post('/delete-batch', authenticateToken, async (req, res) => {
    const { session_ids } = req.body;
    try {
        await pool.query('DELETE FROM indent_items WHERE session_id = ANY($1::uuid[])', [session_ids]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
