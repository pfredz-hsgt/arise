import express from 'express';
import pool from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Get all kewps6 records
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

// Update a kewps6 record
router.put('/:id', authenticateToken, async (req, res) => {
    const fields = req.body;
    try {
        if (Object.keys(fields).length === 0) return res.json({});
        
        const keys = Object.keys(fields);
        const values = Object.values(fields);
        const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
        
        const result = await pool.query(
            `UPDATE kewps6_records SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
            [...values, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
