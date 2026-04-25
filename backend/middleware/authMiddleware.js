const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
        token = req.query.token;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            req.user = decoded; // contains { id, name, role }
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = async (req, res, next) => {
    try {
        const db = require('../db');
        const result = await db.query('SELECT role FROM Users WHERE id = $1', [req.user.id]);
        if (result.rows.length > 0 && result.rows[0].role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Not authorized as an admin' });
        }
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({ message: 'Server error during role verification' });
    }
};

module.exports = { protect, admin };
