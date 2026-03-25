const express = require('express');
const router = express.Router();
const { createHousehold, getHouseholds } = require('../controllers/householdController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createHousehold).get(protect, getHouseholds);

module.exports = router;
