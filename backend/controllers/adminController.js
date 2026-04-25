const db = require('../db');
const PDFDocument = require('pdfkit');

// Helper to gracefully log actions
const logAdminAction = async (userId, action, details) => {
    try {
        await db.query('INSERT INTO ActivityLogs (user_id, action, details) VALUES ($1, $2, $3)', [userId, action, JSON.stringify(details)]);
    } catch (err) {
        console.warn('ActivityLogs table missing or error:', err.message);
    }
};

// 1. User Management
const getAllUsers = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, email, role, phone, email_verified, created_at,
                   COALESCE(status, 'active') as status,
                   COALESCE(risk_score, 0) as risk_score
            FROM users ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const manageUserStatus = async (req, res) => {
    const { id } = req.params;
    const { status, role } = req.body;
    try {
        if (!status && !role) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        let query;
        let params;

        if (status && role) {
            query = 'UPDATE users SET status = $1, role = $2 WHERE id = $3 RETURNING id, name, role, status';
            params = [status, role, id];
        } else if (status) {
            query = 'UPDATE users SET status = $1 WHERE id = $2 RETURNING id, name, role, status';
            params = [status, id];
        } else {
            query = 'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, role, status';
            params = [role, id];
        }

        const result = await db.query(query, params);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        await logAdminAction(req.user.id, 'UPDATE_USER_STATUS', { targetUserId: id, status, role });
        res.json({ message: 'User updated successfully', user: result.rows[0] });
    } catch (err) {
        console.error('Update User Status Error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        // Attempt soft delete first
        await db.query("UPDATE users SET status = 'deleted' WHERE id = $1", [id]).catch(async err => {
            // Hard delete fallback
            await db.query('DELETE FROM users WHERE id = $1', [id]);
        });
        await logAdminAction(req.user.id, 'DELETE_USER', { targetUserId: id });
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// 2. Household Management
const getAllHouseholds = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT h.*, u.name as creator_name, 
                   (SELECT json_agg(json_build_object('id', hm.user_id, 'name', m.name, 'email', m.email, 'role', hm.role)) 
                    FROM householdmembers hm 
                    JOIN users m ON hm.user_id = m.id 
                    WHERE hm.household_id = h.id) as members,
                   (SELECT COUNT(*) FROM householdmembers WHERE household_id = h.id) as member_count
            FROM households h
            LEFT JOIN users u ON h.created_by = u.id
            ORDER BY h.created_at DESC
        `);
        // Manually inject status if missing
        const rows = result.rows.map(r => ({ ...r, status: r.status || 'active', members: r.members || [] }));
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const manageHouseholdStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await db.query('UPDATE Households SET status = $1 WHERE id = $2', [status, id]);
        await logAdminAction(req.user.id, 'UPDATE_HOUSEHOLD_STATUS', { householdId: id, status });
        res.json({ message: 'Household updated' });
    } catch (err) {
        res.status(500).json({ message: 'Server error (Migration needed?)', error: err.message });
    }
};

// 3. Bill Management
const getAllBills = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT b.*, h.name as household_name
            FROM Bills b
            JOIN Households h ON b.household_id = h.id
            ORDER BY b.due_date DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// 4. Payment Proof Verification (Global)
const getAllPaymentProofs = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT pp.*, b.utility_type, b.amount as bill_amount, u.name as user_name
            FROM PaymentProofs pp
            JOIN Bills b ON pp.bill_id = b.id
            JOIN Users u ON pp.user_id = u.id
            ORDER BY pp.uploaded_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// 7. System Analytics
const getSystemStats = async (req, res) => {
    try {
        const usersCount = await db.query('SELECT COUNT(*) FROM Users');
        const householdsCount = await db.query('SELECT COUNT(*) FROM Households');
        const billsCount = await db.query('SELECT COUNT(*) FROM Bills');
        const proofsCount = await db.query('SELECT COUNT(*) FROM PaymentProofs');
        const verifiedCount = await db.query("SELECT COUNT(*) FROM PaymentProofs WHERE status = 'verified'");
        const rejectedCount = await db.query("SELECT COUNT(*) FROM PaymentProofs WHERE status = 'rejected'");
        const revenueTotal = await db.query("SELECT SUM(amount) FROM Bills WHERE status = 'paid'");

        res.json({
            totalUsers: parseInt(usersCount.rows[0].count),
            totalHouseholds: parseInt(householdsCount.rows[0].count),
            totalBills: parseInt(billsCount.rows[0].count),
            totalProofs: parseInt(proofsCount.rows[0].count),
            verifiedProofs: parseInt(verifiedCount.rows[0].count),
            rejectedProofs: parseInt(rejectedCount.rows[0].count),
            totalRevenue: parseFloat(revenueTotal.rows[0].sum || 0),
            verificationRate: proofsCount.rows[0].count > 0 
                ? (parseInt(verifiedCount.rows[0].count) / parseInt(proofsCount.rows[0].count) * 100).toFixed(1) 
                : 0
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getSystemLogs = async (req, res) => {
    try {
        const logs = await db.query(`
            SELECT a.*, u.name as admin_name 
            FROM ActivityLogs a 
            LEFT JOIN Users u ON a.user_id = u.id 
            ORDER BY a.created_at DESC LIMIT 100
        `);
        res.json(logs.rows);
    } catch (err) {
        res.status(500).json({ message: 'Logs table not found', error: err.message });
    }
};

// 8. Universal Export
const exportAdminData = async (req, res) => {
    const { type, format } = req.query; // type: users, households, bills, proofs | format: csv, pdf
    try {
        let data = [];
        let headers = [];
        let title = '';

        if (type === 'users') {
            const result = await db.query('SELECT name, email, role, phone, email_verified, created_at FROM Users ORDER BY created_at DESC');
            data = result.rows;
            headers = ['Name', 'Email', 'Role', 'Phone', 'Verified', 'Joined'];
            title = 'System Users Report';
        } else if (type === 'households') {
            const result = await db.query(`
                SELECT h.name, u.name as owner, h.created_at 
                FROM Households h LEFT JOIN Users u ON h.created_by = u.id
            `);
            data = result.rows.map(r => ({ name: r.name, owner: r.owner, created_at: r.created_at }));
            headers = ['Name', 'Owner', 'Created At'];
            title = 'Platform Households Report';
        } else if (type === 'bills') {
            const result = await db.query('SELECT utility_type, amount, period, status, due_date FROM Bills');
            data = result.rows;
            headers = ['Utility', 'Amount', 'Period', 'Status', 'Due Date'];
            title = 'Global Bills Report';
        } else {
            return res.status(400).json({ message: 'Invalid export type' });
        }

        await logAdminAction(req.user.id, 'EXPORT_DATA', { type, format });

        if (format === 'csv') {
            let csv = headers.join(',') + '\n';
            data.forEach(row => {
                csv += Object.values(row).map(val => `"${val || ''}"`).join(',') + '\n';
            });
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=${type}_export.csv`);
            return res.send(csv);
        } else if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 50 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${type}_export.pdf`);
            doc.pipe(res);

            doc.font('Helvetica-Bold').fontSize(20).text(title, { align: 'center' });
            doc.moveDown();
            doc.font('Helvetica').fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
            doc.moveDown(2);

            // Simple PDF Table
            const startX = 50;
            let currentY = doc.y;
            const columnWidth = 500 / headers.length;

            doc.font('Helvetica-Bold').fontSize(10);
            headers.forEach((h, i) => doc.text(h, startX + (i * columnWidth), currentY, { width: columnWidth }));
            currentY += 15;
            doc.moveTo(startX, currentY).lineTo(550, currentY).stroke();
            currentY += 10;

            doc.font('Helvetica').fontSize(9);
            data.forEach(row => {
                if (currentY > 700) { doc.addPage(); currentY = 50; }
                const values = Object.values(row);
                values.forEach((val, i) => {
                    let text = String(val || '');
                    if (val instanceof Date) text = new Date(val).toLocaleDateString();
                    doc.text(text.substring(0, 30), startX + (i * columnWidth), currentY, { width: columnWidth });
                });
                currentY += 15;
            });

            doc.end();
        } else {
            res.status(400).json({ message: 'Invalid format' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Export failed', error: err.message });
    }
};

module.exports = {
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
};
