const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    verifyEmailOTP, 
    forgotPassword, 
    resetPassword 
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyEmailOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;

