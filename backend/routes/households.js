const express = require('express');
const router = express.Router();
const { createHousehold, getHouseholds, ensureHousehold, getMembers, generateInvite, joinHousehold, removeMember, transferOwnership, updateHousehold } = require('../controllers/householdController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createHousehold).get(protect, getHouseholds);
router.patch('/:id', protect, updateHousehold);
router.post('/ensure', protect, ensureHousehold);
router.get('/:id/members', protect, getMembers);
router.post('/:id/invite', protect, generateInvite);
router.post('/join', protect, joinHousehold);
router.delete('/:id/members/:userId', protect, removeMember);
router.patch('/:id/transfer-ownership', protect, transferOwnership);

module.exports = router;
