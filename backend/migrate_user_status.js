require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    try {
        console.log('Running user status migration...');
        await pool.query("ALTER TABLE Users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';");
        console.log('✓ Added status column to Users');
        await pool.query("ALTER TABLE Users ADD COLUMN IF NOT EXISTS risk_score INT DEFAULT 0;");
        console.log('✓ Added risk_score column to Users');
        await pool.query("ALTER TABLE Households ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';");
        console.log('✓ Added status column to Households');
        await pool.query(`CREATE TABLE IF NOT EXISTS ActivityLogs (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES Users(id) ON DELETE SET NULL,
            action VARCHAR(255) NOT NULL,
            details JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`);
        console.log('✓ Created ActivityLogs table');
        console.log('\n✅ Migration complete!');
    } catch (e) {
        console.error('Migration error:', e.message);
    } finally {
        await pool.end();
    }
}

run();
