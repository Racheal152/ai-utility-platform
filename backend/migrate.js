require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        console.log('Connecting to database:', process.env.DATABASE_URL.split('@')[1]); // Log part of it safely
        await pool.query('ALTER TABLE Households ADD COLUMN IF NOT EXISTS invite_code VARCHAR(20) UNIQUE;');
        await pool.query('ALTER TABLE Users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);');
        await pool.query('ALTER TABLE Users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10);');
        await pool.query('ALTER TABLE Users ADD COLUMN IF NOT EXISTS otp_expires TIMESTAMP;');
        await pool.query('ALTER TABLE Users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;');
        console.log('Successfully updated database schema.');
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}

run();
