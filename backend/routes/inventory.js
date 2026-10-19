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

// Get unique raks for user's main_unit
router.get('/raks', authenticateToken, async (req, res) => {
    try {
        const unit = req.query.main_unit || req.user.main_unit || 'OPD';
        const result = await pool.query(
            "SELECT DISTINCT row FROM inventory_items WHERE main_unit = $1 AND row IS NOT NULL ORDER BY row ASC",
            [unit]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all inventory items (filtered by user's main_unit by default)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { indent_source, row, search, main_unit, all_units } = req.query;
        let query = 'SELECT * FROM inventory_items';
        const params = [];
        const conditions = [];

        // Unit filtering:
        // If all_units === 'true' and role === 'Issuer', allow seeing all units (used in Admin InventoryTable)
        // Otherwise, filter by requested main_unit OR user's own main_unit
        let effectiveUnit = main_unit;
        if (!effectiveUnit && all_units !== 'true') {
            effectiveUnit = req.user.main_unit || 'OPD';
        }

        if (effectiveUnit && effectiveUnit !== 'ALL') {
            params.push(effectiveUnit);
            conditions.push(`main_unit = $${params.length}`);
        }

        if (indent_source) {
            params.push(indent_source);
            conditions.push(`indent_source = $${params.length}`);
        }
        
        if (row) {
            params.push(row);
            conditions.push(`row = $${params.length}`);
        }

        if (search) {
            params.push(`%${search}%`);
            conditions.push(`name ILIKE $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
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
        const item = result.rows[0];
        
        // Ensure non-issuers can only access items matching their main_unit
        if (req.user.role !== 'Issuer' && req.user.main_unit && item.main_unit && item.main_unit !== req.user.main_unit) {
            return res.status(403).json({ error: 'Access denied: Item belongs to another department' });
        }
        
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new item (Admin)
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
    // Ideally check req.user.role === 'Issuer' here
    const { name, item_code, pku, puchase_type, std_kt, row, tingkat, petak, main_unit, max_qty, balance, indent_source, remarks, type } = req.body;
    let image_url = req.body.image_url || null;

    if (req.file) {
        image_url = `/uploads/${req.file.filename}`;
    }

    try {
        const result = await pool.query(
            `INSERT INTO inventory_items (
                name, item_code, pku, puchase_type, std_kt, row, tingkat, petak, main_unit, max_qty, balance, 
                indent_source, remarks, type, image_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
            [name, item_code, pku, puchase_type, std_kt, row, tingkat ? parseInt(tingkat, 10) : null, petak, main_unit || 'OPD', max_qty, balance, indent_source, remarks, type, image_url]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update an item (Admin)
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
    const { name, item_code, pku, puchase_type, std_kt, row, tingkat, petak, main_unit, max_qty, balance, indent_source, remarks, type } = req.body;
    let image_url = req.body.image_url;

    if (req.file) {
        image_url = `/uploads/${req.file.filename}`;
    }

    try {
        const oldItemResult = await pool.query('SELECT * FROM inventory_items WHERE id = $1', [req.params.id]);
        if (oldItemResult.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
        const oldItem = oldItemResult.rows[0];

        const updateQuery = `
            UPDATE inventory_items SET 
                name = COALESCE($1, name),
                item_code = COALESCE($2, item_code),
                pku = COALESCE($3, pku),
                puchase_type = COALESCE($4, puchase_type),
                std_kt = COALESCE($5, std_kt),
                row = COALESCE($6, row),
                tingkat = COALESCE($7, tingkat),
                petak = COALESCE($8, petak),
                main_unit = COALESCE($9, main_unit),
                max_qty = COALESCE($10, max_qty),
                balance = COALESCE($11, balance),
                indent_source = COALESCE($12, indent_source),
                remarks = COALESCE($13, remarks),
                type = COALESCE($14, type),
                image_url = COALESCE($15, image_url)
            WHERE id = $16 RETURNING *
        `;
        const result = await pool.query(updateQuery, [
            name, item_code, pku, puchase_type, std_kt, row, tingkat !== undefined ? (tingkat ? parseInt(tingkat, 10) : null) : null, petak, main_unit, max_qty, balance, 
            indent_source, remarks, type, image_url, req.params.id
        ]);
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
        const updatedItem = result.rows[0];

        // Audit Log Generation
        const changes = {};
        const fieldsToCheck = ['name', 'item_code', 'pku', 'puchase_type', 'std_kt', 'row', 'tingkat', 'petak', 'main_unit', 'max_qty', 'balance', 'indent_source', 'remarks', 'type'];
        let changeMessages = [];

        for (const field of fieldsToCheck) {
            const oldVal = oldItem[field];
            const newVal = updatedItem[field];
            
            const oldStr = oldVal instanceof Date ? oldVal.toISOString().split('T')[0] : (oldVal !== null && oldVal !== undefined ? oldVal.toString() : '');
            const newStr = newVal instanceof Date ? newVal.toISOString().split('T')[0] : (newVal !== null && newVal !== undefined ? newVal.toString() : '');
            
            if (oldStr !== newStr) {
                changes[field] = { from: oldVal, to: newVal };
                changeMessages.push(`updated ${field} from '${oldStr}' to '${newStr}'`);
            }
        }

        if (changeMessages.length > 0) {
            const userName = req.user.name || req.user.email || 'Unknown User';
            const message = `User ${userName} ${changeMessages.join(', ')} for item '${oldItem.name}'`;
            
            await pool.query(
                'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
                [req.user.id, 'INVENTORY_UPDATE', JSON.stringify({ item_id: oldItem.id, item_name: oldItem.name, changes, message })]
            );
        }

        res.json(updatedItem);
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
