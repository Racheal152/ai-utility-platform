const db = require('../db');

// Add a bill (with optional splits)
const addBill = async (req, res) => {
    const { household_id, utility_type, amount, due_date, period, splits, usage_value, usage_unit } = req.body;
    try {
        await db.query('BEGIN');

        const billResult = await db.query(
            'INSERT INTO Bills (household_id, utility_type, amount, due_date, period, usage_value, usage_unit) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [household_id, utility_type, amount, due_date, period, usage_value, usage_unit]
        );
        const bill = billResult.rows[0];

        const shareResult = await db.query(
            'INSERT INTO ExpenseShares (bill_id, split_type) VALUES ($1, $2) RETURNING id',
            [bill.id, splits && splits.length > 0 ? 'custom' : 'equal']
        );
        const shareId = shareResult.rows[0].id;

        if (splits && splits.length > 0) {
            for (let split of splits) {
                await db.query(
                    'INSERT INTO ShareLines (expense_share_id, user_id, amount) VALUES ($1, $2, $3)',
                    [shareId, split.user_id, split.amount]
                );
                await db.query(
                    'INSERT INTO Notifications (user_id, message, type) VALUES ($1, $2, $3)',
                    [split.user_id, `A new ${utility_type} bill of KES ${split.amount} has been assigned to you.`, 'bill_added']
                );
            }
        } else {
            // Auto-create an equal share for ALL members
            const members = await db.query('SELECT user_id FROM HouseholdMembers WHERE household_id = $1', [household_id]);
            const splitAmount = (amount / (members.rows.length || 1)).toFixed(2);
            for (let m of members.rows) {
                await db.query(
                    'INSERT INTO ShareLines (expense_share_id, user_id, amount) VALUES ($1, $2, $3)',
                    [shareId, m.user_id, splitAmount]
                );
                await db.query(
                    'INSERT INTO Notifications (user_id, message, type) VALUES ($1, $2, $3)',
                    [m.user_id, `A new ${utility_type} bill of KES ${splitAmount} has been assigned to you.`, 'bill_added']
                );
            }
        }

        await db.query('COMMIT');
        res.status(201).json(bill);
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get bills for household — enriched with user share and verification status
const getBills = async (req, res) => {
    const { householdId } = req.params;
    const userId = req.user.id;
    try {
        const result = await db.query(`
            SELECT
                b.id, b.utility_type, b.amount, b.due_date, b.period, b.status, b.created_at, b.usage_value, b.usage_unit,
                (
                    SELECT JSON_AGG(JSON_BUILD_OBJECT(
                        'user_id', sl.user_id,
                        'name', u.name,
                        'amount', sl.amount,
                        'share_status', sl.status,
                        'proof_id', pp.id,
                        'verification', COALESCE(pp.status, 'none'),
                        'proof_image', pp.image_url,
                        'ocr_data', pp.ocr_data
                    ))
                    FROM ShareLines sl
                    JOIN ExpenseShares es ON sl.expense_share_id = es.id
                    JOIN Users u ON sl.user_id = u.id
                    LEFT JOIN LATERAL (
                        SELECT id, status, image_url, ocr_data, rejection_reason 
                        FROM PaymentProofs 
                        WHERE bill_id = b.id AND user_id = sl.user_id 
                        ORDER BY uploaded_at DESC LIMIT 1
                    ) pp ON true
                    WHERE es.bill_id = b.id
                ) AS shares
            FROM Bills b
            WHERE b.household_id = $1
            ORDER BY b.due_date DESC
        `, [householdId]);

        // Map over result to easily surface the current user's specific share at the root level for easy UI handling
        const enrichedBills = result.rows.map(bill => {
            const userShareObj = (bill.shares || []).find(s => s.user_id === userId) || {};
            return {
                ...bill,
                user_share: userShareObj.amount || bill.amount,
                share_status: userShareObj.share_status || 'unpaid',
                verification: userShareObj.verification || 'none',
                proof_id: userShareObj.proof_id,
                proof_image: userShareObj.proof_image,
                ocr_data: userShareObj.ocr_data,
                rejection_reason: userShareObj.rejection_reason
            };
        });

        res.json(enrichedBills);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update bill status
const updateBillStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending', 'partially_paid', 'paid'];
    if (!allowed.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }
    try {
        await db.query('BEGIN');
        const result = await db.query(
            'UPDATE Bills SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        if (result.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'Bill not found' });
        }
        
        const bill = result.rows[0];
        
        // Notify all participants about the status update
        const participants = await db.query(`
            SELECT DISTINCT sl.user_id
            FROM ShareLines sl
            JOIN ExpenseShares es ON sl.expense_share_id = es.id
            WHERE es.bill_id = $1
        `, [id]);

        for (let p of participants.rows) {
            await db.query(
                'INSERT INTO Notifications (user_id, message, type) VALUES ($1, $2, $3)',
                [p.user_id, `The ${bill.utility_type} bill status has been updated to ${status.replace('_', ' ')}.`, 'bill_updated']
            );
        }

        await db.query('COMMIT');
        res.json(bill);
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Delete a bill
const deleteBill = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('BEGIN');
        
        // Fetch participants before deleting to notify them
        const participants = await db.query(`
            SELECT DISTINCT sl.user_id, b.utility_type, b.period
            FROM ShareLines sl
            JOIN ExpenseShares es ON sl.expense_share_id = es.id
            JOIN Bills b ON es.bill_id = b.id
            WHERE b.id = $1
        `, [id]);

        await db.query('DELETE FROM Bills WHERE id = $1', [id]);

        for (let p of participants.rows) {
            await db.query(
                'INSERT INTO Notifications (user_id, message, type) VALUES ($1, $2, $3)',
                [p.user_id, `The ${p.utility_type} bill for ${p.period || 'current period'} has been removed.`, 'bill_deleted']
            );
        }

        await db.query('COMMIT');
        res.json({ message: 'Bill deleted successfully' });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// AI Predictive Analytics
const getPredictions = async (req, res) => {
    const { householdId } = req.params;
    try {
        const result = await db.query(`
            SELECT utility_type, amount, period, due_date
            FROM Bills 
            WHERE household_id = $1
            ORDER BY due_date ASC
        `, [householdId]);

        const bills = result.rows;
        if (bills.length === 0) return res.json({ message: 'Not enough data points yet.', predictions: [] });

        // Simple moving average grouped by utility_type
        const historical = {};
        for (let b of bills) {
            if (!historical[b.utility_type]) historical[b.utility_type] = [];
            historical[b.utility_type].push(Number(b.amount));
        }

        const predictions = [];
        let totalPredicted = 0;
        
        for (let [type, amounts] of Object.entries(historical)) {
            // Take the average of the last 3 payments
            const recent = amounts.slice(-3);
            const avg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
            
            // Add a slight randomization factor to simulate an "AI Model" margin of error (± 5%)
            const variance = avg * 0.05 * (Math.random() > 0.5 ? 1 : -1);
            const predictedAmount = Math.round(avg + variance);
            
            predictions.push({
                utility_type: type,
                predicted_amount: predictedAmount,
                confidence: amounts.length > 2 ? 'High' : 'Low',
                trend: amounts.length > 1 && amounts[amounts.length - 1] > amounts[amounts.length - 2] ? 'increasing' : 'stable'
            });
            totalPredicted += predictedAmount;
        }

        res.json({
            total_predicted: totalPredicted,
            predictions
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// AI Automated Insights & Sustainability Kudos
const getAiInsights = async (req, res) => {
    const { householdId } = req.params;
    try {
        const result = await db.query(`
            SELECT utility_type, amount, usage_value, usage_unit, period, due_date
            FROM Bills 
            WHERE household_id = $1
            ORDER BY utility_type, due_date DESC
        `, [householdId]);

        const groups = {};
        result.rows.forEach(b => {
            if (!groups[b.utility_type]) groups[b.utility_type] = [];
            groups[b.utility_type].push(b);
        });

        const insights = [];

        for (const [type, bills] of Object.entries(groups)) {
            if (bills.length < 2) continue;

            const current = bills[0];
            const previous = bills[1];

            const amtChange = ((current.amount - previous.amount) / previous.amount) * 100;
            const usageChange = current.usage_value && previous.usage_value ? 
                ((current.usage_value - previous.usage_value) / previous.usage_value) * 100 : null;

            // 🟢 Kudos for Savings
            if (amtChange <= -5) {
                insights.push({
                    type: 'success',
                    title: `Excellent Savings on ${type}!`,
                    message: `Your ${type} bill dropped by ${Math.abs(amtChange).toFixed(0)}% compared to last month. Great job keeping expenses down!`,
                    utility: type
                });
            } else if (usageChange && usageChange <= -5) {
                insights.push({
                    type: 'success',
                    title: `Eco-Hero Status: ${type}`,
                    message: `Consumption of ${type} is down by ${Math.abs(usageChange).toFixed(0)}% ${current.usage_unit}. The planet (and your wallet) thanks you!`,
                    utility: type
                });
            }

            // 🔴 Warnings & Solutions for Spikes
            if (amtChange >= 15) {
                let solution = "Try identifying high-consumption appliances.";
                if (type.toLowerCase() === 'water') solution = "Check for silent leaks in toilets or dripping faucets.";
                if (type.toLowerCase() === 'electricity') solution = "Switching to LED bulbs or unplugging idle devices can help.";
                
                insights.push({
                    type: 'warning',
                    title: `${type} Spike Detected`,
                    message: `Your ${type} bill jumped by ${amtChange.toFixed(0)}%. ${solution}`,
                    utility: type
                });
            }
        }

        // General greeting if no specific trends
        if (insights.length === 0) {
            insights.push({
                type: 'info',
                title: 'Data Gathering in Progress',
                message: 'Keep adding your monthly bills to unlock more personalized AI sustainability tips and kudos!',
                utility: 'General'
            });
        }

        res.json(insights);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { addBill, getBills, updateBillStatus, deleteBill, getPredictions, getAiInsights };
