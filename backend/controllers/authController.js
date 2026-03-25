const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const generateToken = (id, name, role) => {
    return jwt.sign({ id, name, role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await db.query('SELECT * FROM Users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const result = await db.query(
            'INSERT INTO Users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role',
            [name, email, hashedPassword]
        );
        const user = result.rows[0];
        res.status(201).json({
            id: user.id, name: user.name, email: user.email, role: user.role,
            token: generateToken(user.id, user.name, user.role)
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM Users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (user && (await bcrypt.compare(password, user.password_hash))) {
            res.json({
                id: user.id, name: user.name, email: user.email, role: user.role,
                token: generateToken(user.id, user.name, user.role)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { registerUser, loginUser };
