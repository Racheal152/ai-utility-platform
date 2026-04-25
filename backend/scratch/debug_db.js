require('dotenv').config();
const db = require('../db');

async function checkSchema() {
    try {
        console.log("Checking tables...");
        const tables = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("Tables:", tables.rows.map(r => r.table_name));

        console.log("\nChecking Users table columns...");
        const columns = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
        console.log("Columns:", columns.rows);

        console.log("\nChecking constraints on 'users'...");
        const constraints = await db.query("SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'users'::regclass");
        console.log("Constraints:", constraints.rows);

        console.log("\nChecking triggers on 'users'...");
        const triggers = await db.query("SELECT tgname FROM pg_trigger WHERE tgrelid = 'users'::regclass");
        console.log("Triggers:", triggers.rows);

        console.log("\nTrying to set status to 'suspended' for user 2...");
        const update3 = await db.query("UPDATE users SET status = 'suspended' WHERE id = 2 RETURNING id, status");
        console.log("Update result (suspended):", update3.rows);

        console.log("\nVerifying status again...");
        const verify = await db.query("SELECT id, status FROM users WHERE id = 2");
        console.log("Verified status:", verify.rows);

    } catch (err) {
        console.error("ERROR:", err.message);
    }
    process.exit();
}

checkSchema();
