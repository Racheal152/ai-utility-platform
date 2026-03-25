const db = require('./db');
const bcrypt = require('bcryptjs');

const seedData = async () => {
    console.log('Seeding database...');
    try {
        await db.query('BEGIN');
        
        // Users
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('password123', salt);
        const userRes = await db.query(
            "INSERT INTO Users (name, email, password_hash, role) VALUES ('Admin User', 'admin@aiutility.com', $1, 'admin') RETURNING id",
            [hash]
        );
        const userId = userRes.rows[0].id;
        
        // Household
        const hhRes = await db.query(
            "INSERT INTO Households (name, created_by) VALUES ('Racheal Residence', $1) RETURNING id",
            [userId]
        );
        const hhId = hhRes.rows[0].id;

        await db.query(
            "INSERT INTO HouseholdMembers (user_id, household_id, role) VALUES ($1, $2, 'owner')",
            [userId, hhId]
        );

        // Bill
        const billRes = await db.query(
            "INSERT INTO Bills (household_id, utility_type, amount, due_date, period, status) VALUES ($1, 'electricity', 1500.00, '2026-04-01', 'March 2026', 'pending') RETURNING id",
            [hhId]
        );
        const billId = billRes.rows[0].id;
        
        // Share
        const shareRes = await db.query(
            "INSERT INTO ExpenseShares (bill_id, split_type) VALUES ($1, 'equal') RETURNING id",
            [billId]
        );
        
        await db.query(
            "INSERT INTO ShareLines (expense_share_id, user_id, amount, status) VALUES ($1, $2, 1500.00, 'unpaid')",
            [shareRes.rows[0].id, userId]
        );

        await db.query('COMMIT');
        console.log('Database seeded successfully.');
    } catch (e) {
        await db.query('ROLLBACK');
        console.error('Seeding error: ', e);
    } finally {
        process.exit();
    }
};

seedData();
