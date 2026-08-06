import express from 'express';
import pool from '../db.js';

const router = express.Router();

const PRESET_COLORS = ['blue', 'purple', 'cyan', 'green', 'magenta', 'pink', 'red', 'orange', 'yellow', 'volcano', 'geekblue', 'lime', 'gold'];
const getRandomColor = () => PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];

// Helper function to generate routes for a given table
const generateRoutes = (tableName, pathPrefix) => {
    // GET all
    router.get(pathPrefix, async (req, res) => {
        try {
            const result = await pool.query(`SELECT name, color FROM ${tableName} ORDER BY name ASC`);
            res.json(result.rows);
        } catch (err) {
            console.error(`Error fetching ${tableName}:`, err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // POST new
    router.post(pathPrefix, async (req, res) => {
        try {
            const { name, color } = req.body;
            if (!name || name.trim() === '') {
                return res.status(400).json({ error: 'Name is required' });
            }
            const finalColor = color && color.trim() !== '' ? color.trim() : getRandomColor();
            await pool.query(`INSERT INTO ${tableName} (name, color) VALUES ($1, $2)`, [name.trim(), finalColor]);
            res.status(201).json({ message: 'Added successfully' });
        } catch (err) {
            if (err.code === '23505') { // unique violation
                return res.status(400).json({ error: 'Name already exists' });
            }
            console.error(`Error adding to ${tableName}:`, err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // PUT edit
    router.put(`${pathPrefix}/:name`, async (req, res) => {
        try {
            const { name: oldName } = req.params;
            const { name: newName, color } = req.body;
            
            if (!newName || newName.trim() === '') {
                return res.status(400).json({ error: 'Name is required' });
            }
            const finalColor = color && color.trim() !== '' ? color.trim() : getRandomColor();
            
            await pool.query(`UPDATE ${tableName} SET name = $1, color = $2 WHERE name = $3`, [newName.trim(), finalColor, oldName]);
            res.json({ message: 'Updated successfully' });
        } catch (err) {
            if (err.code === '23505') { // unique violation
                return res.status(400).json({ error: 'Name already exists' });
            }
            console.error(`Error updating ${tableName}:`, err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // DELETE
    router.delete(`${pathPrefix}/:name`, async (req, res) => {
        try {
            const { name } = req.params;
            await pool.query(`DELETE FROM ${tableName} WHERE name = $1`, [name]);
            res.json({ message: 'Deleted successfully' });
        } catch (err) {
            console.error(`Error deleting from ${tableName}:`, err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
};

generateRoutes('indent_sources', '/sources');
generateRoutes('item_types', '/types');
generateRoutes('purchase_types', '/purchasetypes');
generateRoutes('std_kts', '/stdkts');

export default router;
