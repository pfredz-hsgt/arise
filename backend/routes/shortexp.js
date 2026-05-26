import express from 'express';
import pool from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Get all short exp items
router.get('/', authenticateToken, async (req, res) => {
    try {
        const indentItemsResult = await pool.query(`
            SELECT i.*, row_to_json(inv.*) as inventory_items 
            FROM indent_items i
            LEFT JOIN inventory_items inv ON i.item_id = inv.id
            WHERE i.batch_no_1 IS NOT NULL OR i.batch_no_2 IS NOT NULL
        `);
        
        const kewps6Result = await pool.query('SELECT id, item_id, batch_no, se_remarks FROM kewps6_records');
        
        res.json({ indentData: indentItemsResult.rows, kewps6Data: kewps6Result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
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

export default router;
