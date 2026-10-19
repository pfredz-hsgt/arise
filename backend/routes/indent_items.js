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

// Get short exp record by item_id (kept for backwards compatibility)
router.get('/shortexp/:item_id', authenticateToken, async (req, res) => {
    try {
        res.json(null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Bulk create items
router.post('/bulk', authenticateToken, async (req, res) => {
    const { items } = req.body;
    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'No items provided' });
    }

    try {
        const values = [];
        const placeholders = [];
        let paramIndex = 1;

        items.forEach((item) => {
            placeholders.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
            values.push(
                item.session_id, item.item_id, item.requested_qty, item.indent_remarks || null, 
                item.snapshot_max_qty || 0, item.snapshot_balance || 0
            );
        });

        const query = `
            INSERT INTO indent_items (
                session_id, item_id, requested_qty, indent_remarks, snapshot_max_qty, snapshot_balance
            ) VALUES ${placeholders.join(', ')}
        `;

        await pool.query(query, values);
        res.status(201).json({ success: true, count: items.length });
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
                session_id, item_id, requested_qty, indent_remarks, snapshot_max_qty, snapshot_balance
            ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [
                data.session_id, data.item_id, data.requested_qty, data.indent_remarks, data.snapshot_max_qty, data.snapshot_balance
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
                snapshot_balance = COALESCE($4, snapshot_balance)
            WHERE id = $5 RETURNING *`,
            [
                data.requested_qty, data.indent_remarks, data.snapshot_max_qty, data.snapshot_balance,
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
