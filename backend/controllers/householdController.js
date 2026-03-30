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
            ORDER BY h.created_at ASC
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Ensure the user has at least one household — creates a default one if not
const ensureHousehold = async (req, res) => {
    try {
        const existing = await db.query(`
            SELECT h.*, hm.role FROM Households h
            JOIN HouseholdMembers hm ON h.id = hm.household_id
            WHERE hm.user_id = $1
            ORDER BY h.created_at ASC
            LIMIT 1
        `, [req.user.id]);

        if (existing.rows.length > 0) {
            return res.json(existing.rows[0]);
        }

        // Create a default household named after the user
        const createResult = await db.query(
            'INSERT INTO Households (name, created_by) VALUES ($1, $2) RETURNING *',
            [`${req.user.name}'s Household`, req.user.id]
        );
        const household = createResult.rows[0];

        await db.query(
            'INSERT INTO HouseholdMembers (user_id, household_id, role) VALUES ($1, $2, $3)',
            [req.user.id, household.id, 'owner']
        );

        res.status(201).json({ ...household, role: 'owner' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get members of a household
const getMembers = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`
            SELECT u.id, u.name, u.email, hm.role, hm.joined_at 
            FROM HouseholdMembers hm
            JOIN Users u ON hm.user_id = u.id
            WHERE hm.household_id = $1
            ORDER BY hm.role DESC, hm.joined_at ASC
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Generate an invite token for a household
const generateInvite = async (req, res) => {
    const { id } = req.params;
    try {
        // Simple token generation (can be replaced by crypto package if more security is needed)
        const token = Math.random().toString(36).substr(2, 8).toUpperCase();
        
        await db.query(`
            UPDATE Households 
            SET invite_code = $1 
            WHERE id = $2 AND created_by = $3
            RETURNING invite_code
        `, [token, id, req.user.id]);
        
        res.json({ invite_code: token });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Join a household via invite token
const joinHousehold = async (req, res) => {
    const { token } = req.body;
    try {
        const hRes = await db.query('SELECT id, name FROM Households WHERE invite_code = $1', [token]);
        if (hRes.rows.length === 0) {
            return res.status(404).json({ message: 'Invalid or expired invite token.' });
        }
        const household = hRes.rows[0];

        // Check if already a member
        const mRes = await db.query('SELECT * FROM HouseholdMembers WHERE user_id = $1 AND household_id = $2', [req.user.id, household.id]);
        if (mRes.rows.length > 0) {
            return res.status(400).json({ message: 'You are already a member of this household.' });
        }

        await db.query(
            'INSERT INTO HouseholdMembers (user_id, household_id, role) VALUES ($1, $2, $3)',
            [req.user.id, household.id, 'member']
        );

        res.json({ message: `Successfully joined ${household.name}`, household });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { createHousehold, getHouseholds, ensureHousehold, getMembers, generateInvite, joinHousehold };
