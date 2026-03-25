const db = require('../db');

// Create a new household
const createHousehold = async (req, res) => {
    const { name } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO Households (name, created_by) VALUES ($1, $2) RETURNING *',
            [name, req.user.id]
        );
        const household = result.rows[0];
        
        // Add creator as owner
        await db.query(
            'INSERT INTO HouseholdMembers (user_id, household_id, role) VALUES ($1, $2, $3)',
            [req.user.id, household.id, 'owner']
        );
        res.status(201).json(household);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get user's households
const getHouseholds = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT h.*, hm.role FROM Households h
            JOIN HouseholdMembers hm ON h.id = hm.household_id
            WHERE hm.user_id = $1
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { createHousehold, getHouseholds };
