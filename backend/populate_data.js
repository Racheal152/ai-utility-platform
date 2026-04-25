const db = require('./db');

const UTILITIES = ['Electricity', 'Water', 'Internet', 'Rent', 'Gas'];
const MONTHS = ['Jan 2026', 'Feb 2026', 'March 2026'];
const DATES = ['2026-01-15', '2026-02-15', '2026-03-15'];

async function populate() {
    try {
        console.log('🚀 Starting data population...');

        // 1. Get all users
        const usersRes = await db.query('SELECT id, name FROM Users');
        const users = usersRes.rows;
        if (users.length === 0) {
            console.log('No users found. Please register some users first.');
            process.exit(0);
        }

        // 2. Ensure each user has at least one household
        for (const user of users) {
            const hRes = await db.query('SELECT household_id FROM householdmembers WHERE user_id = $1', [user.id]);
            if (hRes.rows.length === 0) {
                const newH = await db.query(
                    'INSERT INTO households (name, created_by) VALUES ($1, $2) RETURNING id',
                    [`${user.name}'s Family`, user.id]
                );
                await db.query(
                    'INSERT INTO householdmembers (user_id, household_id, role) VALUES ($1, $2, $3)',
                    [user.id, newH.rows[0].id, 'owner']
                );
            }
        }

        // 3. Mix members (Add neighbors/friends)
        console.log('👥 Cross-pollinating household members...');
        const householdsRes = await db.query('SELECT id FROM households');
        const households = householdsRes.rows;

        for (let i = 0; i < households.length; i++) {
            const hId = households[i].id;
            // Add a random other user as a member
            const otherUser = users[(i + 1) % users.length];
            const check = await db.query('SELECT * FROM householdmembers WHERE user_id = $1 AND household_id = $2', [otherUser.id, hId]);
            if (check.rows.length === 0) {
                await db.query(
                    'INSERT INTO householdmembers (user_id, household_id, role) VALUES ($1, $2, $3)',
                    [otherUser.id, hId, 'member']
                );
            }
        }

        // 4. Generate Bills for 3 months
        console.log('🧾 Generating bills for Jan, Feb, March...');
        for (const h of households) {
            for (let mIdx = 0; mIdx < MONTHS.length; mIdx++) {
                for (const util of UTILITIES) {
                    const amount = Math.floor(Math.random() * 5000) + 1000;
                    let consumption = 0;
                    let units = 'Units';
                    
                    if (util === 'Electricity') { consumption = Math.floor(Math.random() * 300) + 50; units = 'kWh'; }
                    else if (util === 'Water') { consumption = Math.floor(Math.random() * 50) + 10; units = 'm³'; }
                    else if (util === 'Gas') { consumption = Math.floor(Math.random() * 20) + 5; units = 'kg'; }
                    else { consumption = 1; units = 'Subscription'; }

                    const bRes = await db.query(
                        'INSERT INTO bills (household_id, utility_type, amount, due_date, period, status, consumption, units) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
                        [h.id, util, amount, DATES[mIdx], MONTHS[mIdx], Math.random() > 0.3 ? 'paid' : 'pending', consumption, units]
                    );
                    const billId = bRes.rows[0].id;

                    // Create ExpenseShare
                    const esRes = await db.query(
                        'INSERT INTO expenseshares (bill_id) VALUES ($1) RETURNING id',
                        [billId]
                    );
                    const esId = esRes.rows[0].id;

                    // Create ShareLines for each member
                    const membersRes = await db.query('SELECT user_id FROM householdmembers WHERE household_id = $1', [h.id]);
                    const members = membersRes.rows;
                    const shareAmount = amount / members.length;

                    for (const member of members) {
                        await db.query(
                            'INSERT INTO sharelines (expense_share_id, user_id, amount, status) VALUES ($1, $2, $3, $4)',
                            [esId, member.user_id, shareAmount, Math.random() > 0.5 ? 'paid' : 'unpaid']
                        );
                    }
                }
            }
        }

        console.log('✅ Database populated successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Population failed:', err);
        process.exit(1);
    }
}

populate();
