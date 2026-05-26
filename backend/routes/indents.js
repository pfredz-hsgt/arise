import express from 'express';
import pool from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Get cart data for Issuer
router.get('/cart', authenticateToken, async (req, res) => {
    try {
        const sessionsResult = await pool.query(`
            SELECT s.*, u.name as profile_name
            FROM indent_sessions s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.status = 'Submitted'
            ORDER BY s.created_at ASC
        `);
        let sessions = sessionsResult.rows;

        for (let s of sessions) {
            const itemsResult = await pool.query(`
                SELECT i.*, row_to_json(inv.*) as inventory_items
                FROM indent_items i
                LEFT JOIN inventory_items inv ON i.item_id = inv.id
                WHERE i.session_id = $1
            `, [s.id]);
            s.profiles = { name: s.profile_name };
            s.indent_items = itemsResult.rows;
        }

        const requestsResult = await pool.query(`
            SELECT ir.*, u.name as profile_name, row_to_json(inv.*) as inventory_items
            FROM indent_requests ir
            LEFT JOIN users u ON ir.user_id = u.id
            LEFT JOIN inventory_items inv ON ir.item_id = inv.id
            WHERE ir.status = 'Pending'
            ORDER BY ir.created_at ASC
        `);
        const requestsData = requestsResult.rows.map(req => {
            req.profiles = { name: req.profile_name };
            return req;
        });

        res.json({ sessionsData: sessions, requestsData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get records for IndentRecordPage
router.get('/records', authenticateToken, async (req, res) => {
    try {
        const usersResult = await pool.query('SELECT id, name FROM users ORDER BY name');

        const sessionsResult = await pool.query(`
            SELECT s.*, u.name as profile_name
            FROM indent_sessions s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.status IN ('Submitted', 'Approved', 'Completed')
            ORDER BY s.created_at DESC
        `);
        let sessions = sessionsResult.rows;

        for (let s of sessions) {
            const itemsResult = await pool.query(`
                SELECT i.*, row_to_json(inv.*) as inventory_items
                FROM indent_items i
                LEFT JOIN inventory_items inv ON i.item_id = inv.id
                WHERE i.session_id = $1
            `, [s.id]);
            s.profiles = { name: s.profile_name };
            s.indent_items = itemsResult.rows;
        }

        const requestsResult = await pool.query(`
            SELECT ir.*, u.name as profile_name, row_to_json(inv.*) as inventory_items
            FROM indent_requests ir
            LEFT JOIN users u ON ir.user_id = u.id
            LEFT JOIN inventory_items inv ON ir.item_id = inv.id
            WHERE ir.status IN ('Approved', 'Completed')
            ORDER BY ir.created_at DESC
        `);
        const requestsData = requestsResult.rows.map(req => {
            req.profiles = { name: req.profile_name };
            return req;
        });

        res.json({ usersData: usersResult.rows, sessionsData: sessions, requestsData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get approved dates
router.get('/approved-dates', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT created_at FROM indent_requests WHERE status = 'Approved' ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get approved requests in a date range
router.get('/approved', authenticateToken, async (req, res) => {
    const { start_date, end_date } = req.query;
    try {
        const result = await pool.query(`
            SELECT ir.*, row_to_json(inv.*) as inventory_items
            FROM indent_requests ir
            LEFT JOIN inventory_items inv ON ir.item_id = inv.id
            WHERE ir.status = 'Approved'
            AND ir.created_at >= $1 AND ir.created_at <= $2
            ORDER BY ir.created_at DESC
        `, [start_date, end_date]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all indent requests with item details
router.get('/', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT ir.*, 
                   row_to_json(ii.*) as inventory_items 
            FROM indent_requests ir
            LEFT JOIN inventory_items ii ON ir.item_id = ii.id
            ORDER BY ir.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    const { item_id, requested_qty, status, snapshot_max_qty, snapshot_balance, indent_remarks } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO indent_requests (user_id, item_id, requested_qty, status, snapshot_max_qty, snapshot_balance, indent_remarks) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [req.user.id, item_id, requested_qty, status || 'Pending', snapshot_max_qty, snapshot_balance, indent_remarks]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Batch update status for multiple requests
router.post('/batch-update', authenticateToken, async (req, res) => {
    const { ids, status } = req.body;
    try {
        await pool.query('UPDATE indent_requests SET status = $1 WHERE id = ANY($2::uuid[])', [status, ids]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update an indent request (e.g., status to Approved or Completed)
router.put('/:id', authenticateToken, async (req, res) => {
    const { status, requested_qty } = req.body;
    try {
        const result = await pool.query(
            `UPDATE indent_requests 
             SET status = COALESCE($1, status), 
                 requested_qty = COALESCE($2, requested_qty) 
             WHERE id = $3 RETURNING *`,
            [status, requested_qty, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete an indent request (e.g. removing from cart)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM indent_requests WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
