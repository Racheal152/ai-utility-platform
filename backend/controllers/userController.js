const db = require('../db');
const bcrypt = require('bcryptjs');

const updateProfile = async (req, res) => {
    const { name, password } = req.body;
    try {
        let query = 'UPDATE Users SET name = $1';
        const values = [name];
        let paramIndex = 2;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            query += `, password = $${paramIndex}`;
            values.push(hashedPassword);
            paramIndex++;
        }

        query += ` WHERE id = $${paramIndex} RETURNING id, name, email`;
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

module.exports = { updateProfile };
