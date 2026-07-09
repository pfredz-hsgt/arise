import express from 'express';
import multer from 'multer';
import path from 'path';
import pool from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Get unique raks for OPD Substor
router.get('/raks', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT DISTINCT row FROM inventory_items WHERE indent_source = 'OPD Substor' AND row IS NOT NULL ORDER BY row ASC"
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all inventory items
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { indent_source, row, search } = req.query;
        let query = 'SELECT * FROM inventory_items';
        const params = [];

        if (indent_source) {
            params.push(indent_source);
            query += ` WHERE indent_source = $${params.length}`;
        }
        
        if (row) {
            params.push(row);
            query += params.length === 1 ? ` WHERE row = $1` : ` AND row = $2`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += params.length === 1 ? ` WHERE name ILIKE $1` : ` AND name ILIKE $${params.length}`;
        }

        query += ' ORDER BY name ASC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a single item
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM inventory_items WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new item (Admin)
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
    // Ideally check req.user.role === 'Issuer' here
    const { name, item_code, pku, puchase_type, std_kt, row, max_qty, balance, indent_source, remarks, type, is_short_exp, short_exp } = req.body;
    let image_url = req.body.image_url || null;

    if (req.file) {
        image_url = `/uploads/${req.file.filename}`;
    }

    try {
        const result = await pool.query(
            `INSERT INTO inventory_items (
                name, item_code, pku, puchase_type, std_kt, row, max_qty, balance, 
                indent_source, remarks, type, is_short_exp, short_exp, image_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
            [name, item_code, pku, puchase_type, std_kt, row, max_qty, balance, indent_source, remarks, type, is_short_exp, short_exp || null, image_url]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update an item (Admin)
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
    const { name, item_code, pku, puchase_type, std_kt, row, max_qty, balance, indent_source, remarks, type, is_short_exp, short_exp } = req.body;
    let image_url = req.body.image_url;

    if (req.file) {
        image_url = `/uploads/${req.file.filename}`;
    }

    try {
        const updateQuery = `
            UPDATE inventory_items SET 
                name = COALESCE($1, name),
                item_code = COALESCE($2, item_code),
                pku = COALESCE($3, pku),
                puchase_type = COALESCE($4, puchase_type),
                std_kt = COALESCE($5, std_kt),
                row = COALESCE($6, row),
                max_qty = COALESCE($7, max_qty),
                balance = COALESCE($8, balance),
                indent_source = COALESCE($9, indent_source),
                remarks = COALESCE($10, remarks),
                type = COALESCE($11, type),
                is_short_exp = COALESCE($12, is_short_exp),
                short_exp = COALESCE($13, short_exp),
                image_url = COALESCE($14, image_url)
            WHERE id = $15 RETURNING *
        `;
        const result = await pool.query(updateQuery, [
            name, item_code, pku, puchase_type, std_kt, row, max_qty, balance, 
            indent_source, remarks, type, is_short_exp, short_exp || null, image_url, req.params.id
        ]);
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete an item (Admin)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM inventory_items WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
