const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middleware/authMiddleware');

// Get unread notifications for current user
router.get('/', protect, async (req, res) => {
    try {
        const { history } = req.query;
        let queryStr = 'SELECT * FROM Notifications WHERE user_id = $1 AND is_read = FALSE ORDER BY created_at DESC';
        if (history === 'true') {
            queryStr = 'SELECT * FROM Notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50';
        }
        const result = await db.query(queryStr, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Failed to fetch notifications', err);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark a notification as read
router.patch('/:id/read', protect, async (req, res) => {
    try {
        await db.query(
            'UPDATE Notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        res.json({ message: 'Notification marked as read' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// Clear all notifications
router.delete('/', protect, async (req, res) => {
    try {
        await db.query('UPDATE Notifications SET is_read = TRUE WHERE user_id = $1', [req.user.id]);
        res.json({ message: 'All notifications cleared' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to clear notifications' });
    }
});

// (System Use) Create a notification
router.post('/', protect, async (req, res) => {
    const { user_id, message, type } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO Notifications (user_id, message, type) VALUES ($1, $2, $3) RETURNING *',
            [user_id, message, type || 'info']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create notification' });
    }
});

module.exports = router;
