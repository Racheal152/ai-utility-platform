require('dotenv').config();
const db = require('../db');

async function listTables() {
    try {
        const res = await db.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
        console.log("TABLES:", res.rows.map(r => r.tablename));
        
        const cols = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'households'");
        console.log("HOUSEHOLD COLUMNS:", cols.rows.map(r => r.column_name));
    } catch (err) {
        console.error(err);
    }
    process.exit();
}
listTables();
