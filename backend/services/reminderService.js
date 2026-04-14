const cron = require('node-cron');
const db = require('../db');

/**
 * Checks for bills due tomorrow (exactly 24-48 hours from now) 
 * and notifies members who haven't paid their share.
 */
const checkDeadlines = async () => {
    try {
        console.log('[ReminderService] Running daily deadline check...');
        
        // Find bills due tomorrow
        // We look for bills with due_date = current_date + 1 day
        const result = await db.query(`
            SELECT b.id, b.utility_type, b.period, b.due_date, b.household_id
            FROM Bills b
            WHERE b.due_date = CURRENT_DATE + INTERVAL '1 day'
            AND b.status != 'paid'
        `);

        if (result.rows.length === 0) {
            console.log('[ReminderService] No bills due tomorrow.');
            return;
        }

        for (let bill of result.rows) {
            console.log(`[ReminderService] Processing bill: ${bill.utility_type} (${bill.period}) for household ${bill.household_id}`);

            // Find unpaid members for this specific bill
            const participants = await db.query(`
                SELECT sl.user_id, sl.amount, u.name
                FROM ShareLines sl
                JOIN ExpenseShares es ON sl.expense_share_id = es.id
                JOIN Users u ON sl.user_id = u.id
                WHERE es.bill_id = $1 AND sl.status = 'unpaid'
            `, [bill.id]);

            for (let p of participants.rows) {
                const message = `Reminder: The ${bill.utility_type} bill for ${bill.period} is due tomorrow (${new Date(bill.due_date).toLocaleDateString()})! You still have an unpaid share of KES ${Number(p.amount).toLocaleString()}.`;
                
                await db.query(
                    'INSERT INTO Notifications (user_id, message, type) VALUES ($1, $2, $3)',
                    [p.user_id, message, 'deadline_approaching']
                );
                console.log(`[ReminderService] Sent reminder to ${p.name} for bill ${bill.id}`);
            }
        }
    } catch (err) {
        console.error('[ReminderService] Error in checkDeadlines:', err.message);
    }
};

const initCronTasks = () => {
    // Schedule to run every day at 9:00 AM
    // Pattern: '0 9 * * *'
    // For demo/dev verification, we might want to run it more frequently (e.g. every minute)
    // but the query logic filters by exact date, so it will only send once per day anyway 
    // unless the date changes.
    
    cron.schedule('0 9 * * *', checkDeadlines);
    
    // Optional: Immediate check on startup
    // checkDeadlines();
    
    console.log('[ReminderService] Cron tasks scheduled (9:00 AM daily).');
};

module.exports = { initCronTasks };
