const db = require('./db');

async function migrate() {
    try {
        console.log('Adding rejection_reason column to PaymentProofs...');
        await db.query('ALTER TABLE PaymentProofs ADD COLUMN IF NOT EXISTS rejection_reason TEXT');
        console.log('Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
