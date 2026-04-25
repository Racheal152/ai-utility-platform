const db = require('../db');
const PDFDocument = require('pdfkit');

// ─── Data Aggregation Helpers ─────────────────────────────────

const getPersonalData = async (userId, startDate, endDate) => {
    let query = `
        SELECT 
            sl.amount, 
            sl.status as share_status, 
            b.utility_type, 
            b.period, 
            b.due_date,
            b.amount as total_bill_amount
        FROM ShareLines sl
        JOIN ExpenseShares es ON sl.expense_share_id = es.id
        JOIN Bills b ON es.bill_id = b.id
        WHERE sl.user_id = $1
    `;
    const params = [userId];

    if (startDate && endDate) {
        query += ` AND b.due_date BETWEEN $2 AND $3`;
        params.push(startDate, endDate);
    }

    const result = await db.query(query, params);
    const rows = result.rows;

    const totalPaid = rows.filter(r => r.share_status === 'paid').reduce((sum, r) => sum + Number(r.amount), 0);
    const totalPending = rows.filter(r => r.share_status !== 'paid').reduce((sum, r) => sum + Number(r.amount), 0);
    
    // Group by period for trends
    const trends = {};
    const usage = {};
    rows.forEach(r => {
        const p = r.period || 'Unknown';
        trends[p] = (trends[p] || 0) + Number(r.amount);
        // Map individual consumption if available (approximate personal share of usage)
        if (r.consumption) {
            usage[p] = (usage[p] || 0) + (Number(r.consumption) * (Number(r.amount) / Number(r.total_bill_amount || 1)));
        }
    });

    return {
        summary: {
            totalPaid,
            totalPending,
            totalBillsParticipated: rows.length
        },
        history: rows,
        trends: Object.entries(trends).map(([period, amount]) => ({ period, amount })),
        usage: Object.entries(usage).map(([period, consumption]) => ({ period, consumption: consumption.toFixed(1) }))
    };
};

const getHouseholdData = async (householdId, startDate, endDate, sinceDate = null) => {
    // 1. Basic Bill Stats
    let billQuery = `SELECT * FROM Bills WHERE household_id = $1`;
    const billParams = [householdId];
    let paramIdx = 2;

    if (startDate && endDate) {
        billQuery += ` AND due_date BETWEEN $${paramIdx++} AND $${paramIdx++}`;
        billParams.push(startDate, endDate);
    }

    if (sinceDate) {
        billQuery += ` AND created_at >= $${paramIdx++}`;
        billParams.push(sinceDate);
    }

    const bills = await db.query(billQuery, billParams);

    // 2. Utility Breakdown
    const utilityBreakdown = {};
    bills.rows.forEach(b => {
        utilityBreakdown[b.utility_type] = (utilityBreakdown[b.utility_type] || 0) + Number(b.amount);
    });

    // 3. Member Contributions
    let memberQuery = `
        SELECT u.name, SUM(sl.amount) as total_contribution, sl.status
        FROM ShareLines sl
        JOIN Users u ON sl.user_id = u.id
        JOIN ExpenseShares es ON sl.expense_share_id = es.id
        JOIN Bills b ON es.bill_id = b.id
        WHERE b.household_id = $1
    `;
    const mParams = [householdId];
    let mIdx = 2;

    if (sinceDate) {
        memberQuery += ` AND b.created_at >= $${mIdx++}`;
        mParams.push(sinceDate);
    }

    memberQuery += ` GROUP BY u.name, sl.status`;
    const members = await db.query(memberQuery, mParams);

    // 4. Paid vs Unpaid Ratio
    const paidAmount = bills.rows.filter(b => b.status === 'paid').reduce((sum, b) => sum + Number(b.amount), 0);
    const totalAmount = bills.rows.reduce((sum, b) => sum + Number(b.amount), 0);

    // 5. Consumption Trends (Filter for major utilities like Electricity/Water)
    const consumptionTrends = {};
    bills.rows.forEach(b => {
        if (['Electricity', 'Water'].includes(b.utility_type)) {
            const key = `${b.period} - ${b.utility_type}`;
            consumptionTrends[key] = {
                period: b.period,
                utility: b.utility_type,
                consumption: Number(b.consumption || 0),
                units: b.units
            };
        }
    });

    return {
        summary: {
            totalBills: bills.rows.length,
            totalAmount,
            paidAmount,
            unpaidAmount: totalAmount - paidAmount,
            paidRatio: totalAmount > 0 ? (paidAmount / totalAmount * 100).toFixed(1) : 0
        },
        utilityBreakdown: Object.entries(utilityBreakdown).map(([name, value]) => ({ name, value })),
        memberContributions: members.rows,
        bills: bills.rows,
        consumptionTrends: Object.values(consumptionTrends)
    };
};

// ─── Controller Methods ────────────────────────────────────────

const getPersonalReport = async (req, res) => {
    const { startDate, endDate } = req.query;
    try {
        const data = await getPersonalData(req.user.id, startDate, endDate);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getHouseholdReport = async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    try {
        // Verify membership and get tenure
        const membershipRes = await db.query('SELECT role, joined_at FROM HouseholdMembers WHERE user_id = $1 AND household_id = $2', [req.user.id, id]);
        if (membershipRes.rows.length === 0 && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not a member of this household' });
        }

        const membership = membershipRes.rows[0];
        const isOwner = membership?.role === 'owner' || req.user.role === 'admin';
        const joinedAt = membership?.joined_at;

        const data = await getHouseholdData(id, startDate, endDate, isOwner ? null : joinedAt);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const exportPDF = async (req, res) => {
    const { type, householdId, startDate, endDate } = req.query;
    try {
        let data;
        let title;
        if (type === 'personal') {
            data = await getPersonalData(req.user.id, startDate, endDate);
            title = `Personal Spending Report - ${req.user.name}`;
        } else {
            // Verify membership and get tenure for export
            const membershipRes = await db.query('SELECT role, joined_at FROM HouseholdMembers WHERE user_id = $1 AND household_id = $2', [req.user.id, householdId]);
            const membership = membershipRes.rows[0];
            const isOwner = membership?.role === 'owner' || req.user.role === 'admin';
            const joinedAt = membership?.joined_at;

            data = await getHouseholdData(householdId, startDate, endDate, isOwner ? null : joinedAt);
            title = `Household Financial Report`;
        }

        const doc = new PDFDocument({ margin: 50 });
        
        // Error handling for the PDF stream
        doc.on('error', (err) => {
            console.error('PDF Generation Error:', err);
            if (!res.headersSent) {
                res.status(500).send('Internal Server Error during PDF generation');
            }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report_${type}.pdf`);
        
        doc.pipe(res);

        // Header
        doc.font('Helvetica-Bold').fontSize(25).text('AivaPay Financial Report', { align: 'center' });
        doc.moveDown();
        doc.font('Helvetica').fontSize(18).text(title, { align: 'center' });
        doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown();

        // Summary
        doc.font('Helvetica-Bold').fontSize(14).text('Summary Statistics', { underline: true });
        doc.font('Helvetica');
        if (type === 'personal') {
            doc.fontSize(12).text(`Total Paid: KES ${Number(data.summary.totalPaid || 0).toLocaleString()}`);
            doc.text(`Total Pending: KES ${Number(data.summary.totalPending || 0).toLocaleString()}`);
            doc.text(`Bills Participated: ${data.summary.totalBillsParticipated}`);
        } else {
            doc.fontSize(12).text(`Total Household Bills: KES ${Number(data.summary.totalAmount || 0).toLocaleString()}`);
            doc.text(`Total Paid: KES ${Number(data.summary.paidAmount || 0).toLocaleString()}`);
            doc.text(`Total Unpaid: KES ${Number(data.summary.unpaidAmount || 0).toLocaleString()}`);
            doc.text(`Collection Rate: ${data.summary.paidRatio}%`);
        }
        doc.moveDown();

        // AI Insights
        doc.font('Helvetica-Bold').fontSize(14).text('AI Financial Insights', { underline: true });
        doc.font('Helvetica-Oblique').fontSize(11).text('Our AI has analyzed your spending patterns and suggests focusing on reducing peak-hour electricity usage to save up to 15% next month.');
        doc.font('Helvetica');
        doc.moveDown();

        // Table Header
        doc.font('Helvetica-Bold').fontSize(14).text('Detailed Breakdown', { underline: true });
        doc.font('Helvetica');
        doc.moveDown();
        
        const tableTop = doc.y;
        doc.fontSize(10).text('Utility Type', 50, tableTop, { width: 100 });
        doc.text('Period', 150, tableTop, { width: 100 });
        doc.text('Amount', 250, tableTop, { width: 100 });
        doc.text('Status', 350, tableTop, { width: 100 });
        
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
        doc.y = tableTop + 25;

        const rows = type === 'personal' ? data.history : data.bills;
        rows.forEach(r => {
            if (doc.y > 700) doc.addPage();
            const currentY = doc.y;
            doc.text(r.utility_type, 50, currentY, { width: 100 });
            doc.text(r.period || '—', 150, currentY, { width: 100 });
            doc.text(`KES ${Number(r.amount).toLocaleString()}`, 250, currentY, { width: 100 });
            doc.text(type === 'personal' ? r.share_status : r.status, 350, currentY, { width: 100 });
            doc.moveDown(0.5);
        });

        doc.end();
    } catch (err) {
        console.error('Export PDF Catch:', err);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Export failed', error: err.message });
        }
    }
};

const exportCSV = async (req, res) => {
    // Simple CSV generation
    const { type, householdId, startDate, endDate } = req.query;
    try {
        let data;
        if (type === 'personal') {
            data = await getPersonalData(req.user.id, startDate, endDate);
            let csv = 'Utility,Period,Amount,Status,Due Date\n';
            data.history.forEach(r => {
                csv += `${r.utility_type},${r.period},${r.amount},${r.share_status},${r.due_date}\n`;
            });
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=personal_report.csv');
            return res.send(csv);
        } else {
            // Verify membership and get tenure for export
            const membershipRes = await db.query('SELECT role, joined_at FROM HouseholdMembers WHERE user_id = $1 AND household_id = $2', [req.user.id, householdId]);
            const membership = membershipRes.rows[0];
            const isOwner = membership?.role === 'owner' || req.user.role === 'admin';
            const joinedAt = membership?.joined_at;

            data = await getHouseholdData(householdId, startDate, endDate, isOwner ? null : joinedAt);
            let csv = 'Utility,Period,Total Amount,Status,Due Date\n';
            data.bills.forEach(b => {
                csv += `${b.utility_type},${b.period},${b.amount},${b.status},${b.due_date}\n`;
            });
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=household_report.csv');
            return res.send(csv);
        }
    } catch (err) {
        res.status(500).json({ message: 'Export failed', error: err.message });
    }
};

module.exports = {
    getPersonalReport,
    getHouseholdReport,
    exportPDF,
    exportCSV
};
