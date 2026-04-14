const db = require('../backend/db');

async function migrate() {
    try {
        console.log('Adding usage columns to Bills...');
        await db.query('ALTER TABLE Bills ADD COLUMN IF NOT EXISTS usage_value DECIMAL(10, 2)');
        await db.query('ALTER TABLE Bills ADD COLUMN IF NOT EXISTS usage_unit VARCHAR(50)');
        console.log('Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
