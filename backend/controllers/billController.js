const db = require('../db');

// Add a bill
const addBill = async (req, res) => {
    const { household_id, utility_type, amount, due_date, period, splits } = req.body;
    
    // splits array of { user_id, amount }
    try {
        await db.query('BEGIN');
        
        // Insert Bill
        const billResult = await db.query(
            'INSERT INTO Bills (household_id, utility_type, amount, due_date, period) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [household_id, utility_type, amount, due_date, period]
        );
        const bill = billResult.rows[0];
        
        // Insert ExpenseShare
        const shareResult = await db.query(
            'INSERT INTO ExpenseShares (bill_id, split_type) VALUES ($1, $2) RETURNING id',
            [bill.id, splits ? 'custom' : 'equal']
        );
        const shareId = shareResult.rows[0].id;
        
        if (splits && splits.length > 0) {
            for (let split of splits) {
                await db.query(
                    'INSERT INTO ShareLines (expense_share_id, user_id, amount) VALUES ($1, $2, $3)',
                    [shareId, split.user_id, split.amount]
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

// Get bills for household
const getBills = async (req, res) => {
    const { householdId } = req.params;
    try {
        const result = await db.query('SELECT * FROM Bills WHERE household_id = $1 ORDER BY due_date DESC', [householdId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { addBill, getBills };
