const db = require('../db');
const path = require('path');

// Try to use OCR service if available
let extractPaymentDetails;
try {
    extractPaymentDetails = require('../services/ocrService').extractPaymentDetails;
} catch {
    extractPaymentDetails = async () => ({ note: 'OCR service not configured' });
}

// Upload payment proof
const uploadProof = async (req, res) => {
    const { bill_id } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: 'No image file uploaded' });

    try {
        let ocrData = {};
        try {
            // Pass the original mimetype so ocrService knows if it's a PDF
            ocrData = await extractPaymentDetails(file.path, file.mimetype);
        } catch {
            ocrData = { note: 'OCR processing skipped or failed' };
        }

        // Store the proof, status defaults to pending
        let proofStatus = 'pending';
        let autoApproved = false;

        // AI Auto-Approval Logic:
        // Fetch the specific user's ShareLine amount to compare
        const shareResult = await db.query(`
            SELECT sl.amount 
            FROM ShareLines sl
            JOIN ExpenseShares es ON sl.expense_share_id = es.id
            WHERE es.bill_id = $1 AND sl.user_id = $2
        `, [bill_id, req.user.id]);

        if (shareResult.rows.length > 0) {
            const userShareAmount = parseFloat(shareResult.rows[0].amount);
            const extractedAmount = parseFloat(ocrData.extractedAmount);
            
            // Cleanup OCR text for substring searching
            const cleanText = (ocrData.fullText || ocrData.rawText || '').replace(/,/g, '');
            const amountStr = Math.floor(userShareAmount).toString();

            // Relaxed matching: exactly matches extracted amount OR the raw amount string is found in the text
            if ((extractedAmount && Math.abs(extractedAmount - userShareAmount) < 0.5) || cleanText.includes(amountStr)) {
                proofStatus = 'verified';
                autoApproved = true;
                ocrData.autoApproved = true;
            } else {
                ocrData.autoApproved = false;
            }
        }

        await db.query('BEGIN');

        const result = await db.query(
            'INSERT INTO PaymentProofs (bill_id, user_id, image_url, ocr_data, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [bill_id, req.user.id, file.path, JSON.stringify(ocrData), proofStatus]
        );

        if (autoApproved) {
            // Update the user's specific ShareLine to paid
            await db.query(`
                UPDATE ShareLines sl 
                SET status = 'paid' 
                FROM ExpenseShares es
                WHERE sl.expense_share_id = es.id AND es.bill_id = $1 AND sl.user_id = $2
            `, [bill_id, req.user.id]);

            // Check if all shares for the bill are paid
            const allShares = await db.query(`
                SELECT sl.status 
                FROM ShareLines sl 
                JOIN ExpenseShares es ON sl.expense_share_id = es.id
                WHERE es.bill_id = $1
            `, [bill_id]);
            
            const allPaid = allShares.rows.every(row => row.status === 'paid');
            if (allPaid) {
                await db.query("UPDATE Bills SET status = 'paid' WHERE id = $1", [bill_id]);
            } else {
                await db.query("UPDATE Bills SET status = 'partially_paid' WHERE id = $1", [bill_id]);
            }
        }

        await db.query('COMMIT');

        res.status(201).json({
            message: autoApproved ? 'Payment proof uploaded and auto-verified by AI' : 'Payment proof uploaded successfully, awaiting review',
            proof: result.rows[0],
            extracted_data: ocrData,
            autoApproved
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Approve a payment proof
const approveProof = async (req, res) => {
    const { proofId } = req.params;
    try {
        await db.query('BEGIN');

        const proofResult = await db.query(
            "UPDATE PaymentProofs SET status = 'verified' WHERE id = $1 RETURNING *",
            [proofId]
        );
        if (proofResult.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'Proof not found' });
        }

        const proof = proofResult.rows[0];

        // Update the specific user's ShareLine to paid
        await db.query(`
            UPDATE ShareLines sl 
            SET status = 'paid' 
            FROM ExpenseShares es
            WHERE sl.expense_share_id = es.id AND es.bill_id = $1 AND sl.user_id = $2
        `, [proof.bill_id, proof.user_id]);

        // Roll up status to the parent Bill
        const allShares = await db.query(`
            SELECT sl.status 
            FROM ShareLines sl 
            JOIN ExpenseShares es ON sl.expense_share_id = es.id
            WHERE es.bill_id = $1
        `, [proof.bill_id]);
        
        const allPaid = allShares.rows.every(row => row.status === 'paid');
        await db.query(
            "UPDATE Bills SET status = $1 WHERE id = $2", 
            [allPaid ? 'paid' : 'partially_paid', proof.bill_id]
        );

        await db.query('COMMIT');
        res.json({ message: 'Proof approved successfully', proof });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { uploadProof, approveProof };
