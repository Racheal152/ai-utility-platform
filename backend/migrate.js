require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        console.log('Connecting to database:', process.env.DATABASE_URL.split('@')[1]); // Log part of it safely
        await pool.query('ALTER TABLE Households ADD COLUMN IF NOT EXISTS invite_code VARCHAR(20) UNIQUE;');
        console.log('Successfully added invite_code column.');
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}

run();
