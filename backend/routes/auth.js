import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import pool from '../db.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_in_production';

// Register a new user
router.post('/register', async (req, res) => {
    const { email, password, role, name } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, role, name) VALUES ($1, $2, $3, $4) RETURNING id, email, role, name',
            [email, hashedPassword, role || 'Indenter', name]
        );
        res.status(201).json({ user: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') { // unique violation
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Password reset
router.post('/reset-password', async (req, res) => {
    const { email } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate 6 character random password
        // const tempPassword = Math.random().toString(36).slice(-6);
        const tempPassword = "F@rmasi.1234"; //temporary only
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashedPassword, email]);

        // Configure nodemailer
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'localhost',
            port: process.env.SMTP_PORT || 25,
            secure: process.env.SMTP_SECURE === 'true',
            auth: process.env.SMTP_USER ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            } : undefined,
        });

        const mailOptions = {
            from: process.env.SMTP_FROM || '"ARISE System" <noreply@arise.local>',
            to: email,
            subject: 'Your Password Has Been Reset',
            text: `Your password has been reset. Your temporary password is: ${tempPassword}\n\nPlease change your password after logging in.`,
            html: `<p>Your password has been reset.</p><p>Your temporary password is: <strong>${tempPassword}</strong></p><p>Please change your password after logging in.</p>`
        };

        try {
            await transporter.sendMail(mailOptions);
            res.json({ message: 'Temporary password sent to email' });
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            res.status(500).json({ error: 'Password reset successful, but failed to send email. Please check SMTP configuration.' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Middleware to verify JWT
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, role, name, created_at FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin endpoints for user management
router.get('/users', authenticateToken, async (req, res) => {
    // Should check req.user.role === 'Issuer' ideally
    try {
        const result = await pool.query('SELECT id, email, name, role FROM users ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/users/:id', authenticateToken, async (req, res) => {
    const { name, role } = req.body;
    try {
        const result = await pool.query(
            'UPDATE users SET name = COALESCE($1, name), role = COALESCE($2, role) WHERE id = $3 RETURNING id, email, name, role',
            [name, role, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/users/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
