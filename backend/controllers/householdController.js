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
        const hRes = await db.query('SELECT id, name, created_by FROM Households WHERE invite_code = $1', [token]);
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

        // Notify the household owner
        await db.query(
            'INSERT INTO Notifications (user_id, message, type) VALUES ($1, $2, $3)',
            [household.created_by, `A new member has joined your household: ${household.name}.`, 'user_added']
        );

        res.json({ message: `Successfully joined ${household.name}`, household });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Remove a member from a household
const removeMember = async (req, res) => {
    const { id, userId } = req.params; // id is householdId, userId is target to remove
    const requesterId = req.user.id;

    try {
        await db.query('BEGIN');

        // 1. Get requester's role and target's role in this household
        const rolesRes = await db.query(
            'SELECT user_id, role FROM HouseholdMembers WHERE household_id = $1 AND (user_id = $2 OR user_id = $3)',
            [id, requesterId, userId]
        );

        const requester = rolesRes.rows.find(r => r.user_id === requesterId);
        const target = rolesRes.rows.find(r => r.user_id === parseInt(userId));

        if (!target) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'Target member not found in this household.' });
        }

        // 2. Permission logic
        const isSelf = requesterId === parseInt(userId);
        const isOwner = requester?.role === 'owner';

        if (!isSelf && !isOwner) {
            await db.query('ROLLBACK');
            return res.status(403).json({ message: 'You do not have permission to remove members.' });
        }

        if (target.role === 'owner') {
            await db.query('ROLLBACK');
            return res.status(403).json({ message: 'Household owners cannot be removed.' });
        }

        // 3. Delete membership
        await db.query('DELETE FROM HouseholdMembers WHERE household_id = $1 AND user_id = $2', [id, userId]);

        // 4. Notify both parties
        if (!isSelf) {
            // Notify the removed member
            await db.query(
                'INSERT INTO Notifications (user_id, message, type) VALUES ($1, $2, $3)',
                [userId, `You have been removed from the household.`, 'member_removed']
            );
            // Notify the owner (requester)
            await db.query(
                'INSERT INTO Notifications (user_id, message, type) VALUES ($1, $2, $3)',
                [requesterId, `Successfully removed member from your household.`, 'member_removed']
            );
        }

        await db.query('COMMIT');
        res.json({ message: isSelf ? 'You have left the household.' : 'Member removed successfully.' });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Transfer ownership of a household
const transferOwnership = async (req, res) => {
    const { id } = req.params;
    const { newOwnerId } = req.body;
    const requesterId = req.user.id;

    try {
        await db.query('BEGIN');

        // 1. Verify requester is the current owner
        const ownerRes = await db.query(
            'SELECT role FROM HouseholdMembers WHERE household_id = $1 AND user_id = $2',
            [id, requesterId]
        );

        if (ownerRes.rows.length === 0 || ownerRes.rows[0].role !== 'owner') {
            await db.query('ROLLBACK');
            return res.status(403).json({ message: 'Only the current owner can transfer ownership.' });
        }

        // 2. Verify target is a member
        const memberRes = await db.query(
            'SELECT role FROM HouseholdMembers WHERE household_id = $1 AND user_id = $2',
            [id, newOwnerId]
        );

        if (memberRes.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'Target user is not a member of this household.' });
        }

        // 3. Atomically transfer ownership
        // Update Household creator
        await db.query('UPDATE Households SET created_by = $1 WHERE id = $2', [newOwnerId, id]);
        
        // Downgrade old owner
        await db.query(
            "UPDATE HouseholdMembers SET role = 'member' WHERE household_id = $1 AND user_id = $2",
            [id, requesterId]
        );

        // Upgrade new owner
        await db.query(
            "UPDATE HouseholdMembers SET role = 'owner' WHERE household_id = $1 AND user_id = $2",
            [id, newOwnerId]
        );

        // 4. Notify both parties
        // New owner
        await db.query(
            'INSERT INTO Notifications (user_id, message, type) VALUES ($1, $2, $3)',
            [newOwnerId, `You have been appointed the new owner of the household.`, 'ownership_transfer']
        );
        // Old owner
        await db.query(
            'INSERT INTO Notifications (user_id, message, type) VALUES ($1, $2, $3)',
            [requesterId, `You have successfully transferred ownership to another member.`, 'ownership_transfer']
        );

        await db.query('COMMIT');
        res.json({ message: 'Ownership transferred successfully.' });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update household name
const updateHousehold = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const requesterId = req.user.id;

    try {
        await db.query('BEGIN');

        // Verify ownership
        const ownerRes = await db.query(
            'SELECT role FROM HouseholdMembers WHERE household_id = $1 AND user_id = $2',
            [id, requesterId]
        );

        if (ownerRes.rows.length === 0 || ownerRes.rows[0].role !== 'owner') {
            await db.query('ROLLBACK');
            return res.status(403).json({ message: 'Only the owner can rename the household.' });
        }

        // Update name
        const result = await db.query(
            'UPDATE Households SET name = $1 WHERE id = $2 RETURNING *',
            [name, id]
        );
        const household = result.rows[0];

        // Notify ALL members
        const members = await db.query('SELECT user_id FROM HouseholdMembers WHERE household_id = $1', [id]);
        for (let m of members.rows) {
            await db.query(
                'INSERT INTO Notifications (user_id, message, type) VALUES ($1, $2, $3)',
                [m.user_id, `The household has been renamed to "${name}".`, 'household_update']
            );
        }

        await db.query('COMMIT');
        res.json(household);
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { createHousehold, getHouseholds, ensureHousehold, getMembers, generateInvite, joinHousehold, removeMember, transferOwnership, updateHousehold };
