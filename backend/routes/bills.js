const express = require('express');
const router = express.Router();
const { addBill, getBills } = require('../controllers/billController');
const { uploadProof } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.post('/', protect, addBill);
router.get('/household/:householdId', protect, getBills);
router.post('/upload-proof', protect, upload.single('receipt'), uploadProof);

module.exports = router;
