require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function s() {
  try {
    const r = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'bills'");
    console.log(JSON.stringify(r.rows, null, 2));
  } finally {
    await pool.end();
  }
}
s();
