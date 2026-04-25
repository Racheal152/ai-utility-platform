const express = require('express');
const router = express.Router();
const { 
    getPersonalReport, 
    getHouseholdReport, 
    exportPDF, 
    exportCSV 
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/personal', getPersonalReport);
router.get('/household/:id', getHouseholdReport);
router.get('/export/pdf', exportPDF);
router.get('/export/csv', exportCSV);

module.exports = router;
