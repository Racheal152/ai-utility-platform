const db = require('../db');
const { extractPaymentDetails } = require('../services/ocrService');

const uploadProof = async (req, res) => {
    const { bill_id } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: 'No image file uploaded' });

    try {
        // Run OCR
        const ocrData = await extractPaymentDetails(file.path);

        // Insert proof and set status to pending for admin/owner review
        const result = await db.query(
            'INSERT INTO PaymentProofs (bill_id, user_id, image_url, ocr_data, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [bill_id, req.user.id, file.path, ocrData, 'pending']
        );
        
        res.status(201).json({
            message: 'Payment proof uploaded and OCR extracted successfully',
            proof: result.rows[0],
            extracted_data: ocrData
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { uploadProof };
