const express = require('express');
const router = express.Router();
const { updateProfile, getProfile, getUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getUsers);
router.get('/me', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
