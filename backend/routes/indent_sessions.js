import express from 'express';
import pool from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Get draft session for user
router.get('/draft', authenticateToken, async (req, res) => {
    try {
        const { session_type } = req.query;
        let query = 'SELECT * FROM indent_sessions WHERE user_id = $1 AND status = $2';
        const params = [req.user.id, 'Draft'];
        
        if (session_type) {
            query += ' AND session_type = $3';
            params.push(session_type);
        }
        query += ' ORDER BY created_at DESC LIMIT 1';

        const result = await pool.query(query, params);
        if (result.rows.length === 0) {
            return res.json(null); // maybeSingle behavior
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new session
router.post('/', authenticateToken, async (req, res) => {
    const { session_type, status, rak } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO indent_sessions (user_id, session_type, status, rak) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.id, session_type, status, rak]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update session
router.put('/:id', authenticateToken, async (req, res) => {
    const { rak, status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE indent_sessions SET rak = COALESCE($1, rak), status = COALESCE($2, status) WHERE id = $3 RETURNING *',
            [rak, status, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete multiple sessions (for HomePage draft cleanup)
router.post('/delete-batch', authenticateToken, async (req, res) => {
    const { ids } = req.body;
    try {
        await pool.query('DELETE FROM indent_sessions WHERE id = ANY($1::uuid[])', [ids]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cleanup drafts for a user
router.delete('/drafts/cleanup', authenticateToken, async (req, res) => {
    try {
        const { session_type } = req.query;
        await pool.query('DELETE FROM indent_sessions WHERE user_id = $1 AND status = $2 AND session_type = $3', [req.user.id, 'Draft', session_type]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
