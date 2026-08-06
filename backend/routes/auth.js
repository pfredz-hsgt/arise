import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import pool from '../db.js';
import { encrypt, decrypt } from '../utils/crypto.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_in_production';

// Register a new user
router.post('/register', async (req, res) => {
    const { email, password, role, name } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const encryptedPhisPassword = req.body.phis_password ? encrypt(req.body.phis_password) : null;
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, role, name, phis_username, phis_password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role, name, phis_username, phis_password',
            [email, hashedPassword, role || 'Indenter', name, req.body.phis_username || null, encryptedPhisPassword]
        );
        const user = result.rows[0];
        if (user && user.phis_password) {
            user.phis_password = decrypt(user.phis_password);
        }
        res.status(201).json({ user });
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
            await pool.query(
                'INSERT INTO audit_logs (action, details) VALUES ($1, $2)',
                ['LOGIN_FAILED', JSON.stringify({ email, reason: 'Invalid credentials - User not found' })]
            );
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        if (user.is_active === false) {
            await pool.query(
                'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
                [user.id, 'LOGIN_FAILED', JSON.stringify({ email, reason: 'Inactive account' })]
            );
            return res.status(401).json({ error: 'Your account is inactive. Please contact your administrator.' });
        }

        let isMatch = await bcrypt.compare(password, user.password_hash);
        let usedTempPassword = false;

        if (isMatch) {
            if (user.temp_password_hash) {
                await pool.query('UPDATE users SET temp_password_hash = NULL WHERE id = $1', [user.id]);
            }
        } else if (user.temp_password_hash) {
            const isTempMatch = await bcrypt.compare(password, user.temp_password_hash);
            if (isTempMatch) {
                isMatch = true;
                usedTempPassword = true;
                await pool.query('UPDATE users SET password_hash = $1, temp_password_hash = NULL, must_change_password = true WHERE id = $2', [user.temp_password_hash, user.id]);
            }
        }

        if (!isMatch) {
            await pool.query(
                'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
                [user.id, 'LOGIN_FAILED', JSON.stringify({ email, reason: 'Invalid credentials - Wrong password' })]
            );
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const requiresPasswordChange = usedTempPassword || user.must_change_password;

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name, requiresPasswordChange },
            JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '6h' }
        );

        await pool.query(
            'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [user.id, 'LOGIN_SUCCESS', JSON.stringify({ email, message: 'User logged in successfully' })]
        );

        res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name }, requiresPasswordChange });
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

        // Generate 8 character random password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        await pool.query('UPDATE users SET temp_password_hash = $1, must_change_password = false WHERE email = $2', [hashedPassword, email]);

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
            subject: '(ARISE) Your Password Has Been Reset',
            text: `Your ARISE system password has been successfully reset. Your temporary password is: ${tempPassword}\n\For security reasons, please change your password on your next login.`,
            html: `<p>Your ARISE system password has been successfully reset.</p><p>Your temporary password is: <strong>${tempPassword}</strong></p><p>For security reasons, please change your password on your next login.</p>`
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

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
    const { newPassword } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = $1, temp_password_hash = NULL, must_change_password = false WHERE id = $2', [hashedPassword, req.user.id]);
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update profile (name, email, phis_username, phis_password)
router.put('/profile', authenticateToken, async (req, res) => {
    const { name, email, phis_username, phis_password } = req.body;
    try {
        // We update name and email if provided, and always update phis_username/phis_password (even if empty string)
        // using COALESCE for name and email, but direct assignment for phis fields to allow clearing them.
        const encryptedPhisPassword = phis_password ? encrypt(phis_password) : (phis_password === '' ? '' : null);
        const result = await pool.query(
            'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), phis_username = $3, phis_password = $4 WHERE id = $5 RETURNING id, email, name, role, phis_username, phis_password',
            [name, email, encryptedPhisPassword, req.user.id]
        );
        const user = result.rows[0];
        if (user && user.phis_password) {
            user.phis_password = decrypt(user.phis_password);
        }
        res.json({ success: true, user });
    } catch (err) {
        if (err.code === '23505') { // unique violation
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, role, name, phis_username, phis_password, created_at, must_change_password, is_active FROM users WHERE id = $1', [req.user.id]);
        const user = result.rows[0];
        if (user && user.phis_password) {
            user.phis_password = decrypt(user.phis_password);
        }
        res.json({ user, requiresPasswordChange: user.must_change_password });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin endpoints for user management
router.get('/users', authenticateToken, async (req, res) => {
    // Should check req.user.role === 'Issuer' ideally
    try {
        const result = await pool.query('SELECT id, email, name, role, phis_username, phis_password, is_active FROM users ORDER BY name ASC');
        const users = result.rows.map(u => ({
            ...u,
            phis_password: u.phis_password ? decrypt(u.phis_password) : u.phis_password
        }));
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/users/:id', authenticateToken, async (req, res) => {
    const { name, email, role, phis_username, phis_password, is_active } = req.body;
    try {
        const encryptedPhisPassword = phis_password ? encrypt(phis_password) : (phis_password === '' ? '' : null);
        const result = await pool.query(
            'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), role = COALESCE($3, role), phis_username = COALESCE($4, phis_username), phis_password = COALESCE($5, phis_password), is_active = COALESCE($6, is_active) WHERE id = $7 RETURNING id, email, name, role, phis_username, phis_password, is_active',
            [name, email, role, phis_username, encryptedPhisPassword, is_active, req.params.id]
        );
        const user = result.rows[0];
        if (user && user.phis_password) {
            user.phis_password = decrypt(user.phis_password);
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/users/:id/reset-password', authenticateToken, async (req, res) => {
    try {
        const defaultPassword = 'F@rmasi.1234';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        await pool.query(
            'UPDATE users SET password_hash = $1, temp_password_hash = NULL, must_change_password = true WHERE id = $2',
            [hashedPassword, req.params.id]
        );
        res.json({ success: true, message: 'Password reset to default successfully' });
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
