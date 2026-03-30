const express = require('express');
const router = express.Router();
const { createHousehold, getHouseholds, ensureHousehold, getMembers, generateInvite, joinHousehold } = require('../controllers/householdController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createHousehold).get(protect, getHouseholds);
router.post('/ensure', protect, ensureHousehold);
router.get('/:id/members', protect, getMembers);
router.post('/:id/invite', protect, generateInvite);
router.post('/join', protect, joinHousehold);

module.exports = router;
