const express = require('express');
const router = express.Router();
const { addBill, getBills, updateBillStatus, deleteBill, getPredictions } = require('../controllers/billController');
const { uploadProof, approveProof } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    allowed.includes(file.mimetype)
        ? cb(null, true)
        : cb(new Error('Only JPG, PNG, WebP images and PDF files are allowed'), false);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/', protect, addBill);
router.get('/household/:householdId', protect, getBills);
router.get('/household/:householdId/predictions', protect, getPredictions);
router.patch('/:id/status', protect, updateBillStatus);
router.delete('/:id', protect, deleteBill);
router.post('/upload-proof', protect, upload.single('receipt'), uploadProof);
router.patch('/proofs/:proofId/approve', protect, approveProof);

// Multer error handler
router.use((err, req, res, next) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
});

module.exports = router;