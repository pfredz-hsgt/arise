import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import inventoryRoutes from './routes/inventory.js';
import indentsRouter from './routes/indents.js';
import shortexpRouter from './routes/shortexp.js';
import kewps6Router from './routes/kewps6.js';
import indentSessionsRoutes from './routes/indent_sessions.js';
import indentItemsRoutes from './routes/indent_items.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/indents', indentsRouter);
app.use('/api/shortexp', shortexpRouter);
app.use('/api/kewps6', kewps6Router);
app.use('/api/indent_sessions', indentSessionsRoutes);
app.use('/api/indent_items', indentItemsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
