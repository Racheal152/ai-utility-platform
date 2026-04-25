const express = require('express');
const router = express.Router();
const { 
    getAllUsers, 
    manageUserStatus, 
    deleteUser, 
    getAllHouseholds,
    manageHouseholdStatus,
    getAllBills, 
    getAllPaymentProofs, 
    getSystemStats,
    getSystemLogs,
    exportAdminData
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes here are protected and require admin role
router.use(protect);
router.use(admin);

router.get('/stats', getSystemStats);
router.get('/logs', getSystemLogs);
router.get('/users', getAllUsers);
router.put('/users/:id', manageUserStatus);
router.delete('/users/:id', deleteUser);
router.get('/households', getAllHouseholds);
router.put('/households/:id', manageHouseholdStatus);
router.get('/bills', getAllBills);
router.get('/proofs', getAllPaymentProofs);
router.get('/export', exportAdminData);

module.exports = router;
