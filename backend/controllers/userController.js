const db = require('../db');
const bcrypt = require('bcryptjs');

const updateProfile = async (req, res) => {
    const { name, password, phone } = req.body;
    try {
        let query = 'UPDATE Users SET name = $1';
        const values = [name];
        let paramIndex = 2;

        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ message: 'Password must be at least 6 characters.' });
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            query += `, password_hash = $${paramIndex}`;
            values.push(hashedPassword);
            paramIndex++;
        }

        if (phone) {
            const cleaned = phone.replace(/\s+/g, '');
            const phoneRegex = /^(0\d{9}|\+254\d{9})$/;
            if (!phoneRegex.test(cleaned)) {
                return res.status(400).json({ message: 'Phone must be 10 digits (e.g. 0712345678) or international format (+254712345678).' });
            }
            query += `, phone = $${paramIndex}`;
            values.push(cleaned);
            paramIndex++;
        }

        query += ` WHERE id = $${paramIndex} RETURNING id, name, email, phone`;
        values.push(req.user.id);

        const result = await db.query(query, values);

        res.json({
            message: 'Profile updated successfully',
            user: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const result = await db.query('SELECT id, name, email, phone, role, email_verified, created_at FROM Users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getUsers = async (req, res) => {
    try {
        const result = await db.query('SELECT id, name, email, phone, role, created_at FROM Users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { updateProfile, getProfile, getUsers };
