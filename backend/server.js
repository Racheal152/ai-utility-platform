const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const pool = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── 1. CORS ─────────────────────────────────────────────────
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── 2. Body Parsing (MUST be before routes) ─────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// ─── 3. Health Check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'AI Utility Platform Backend is running.' });
});

// ─── 4. DB Test ──────────────────────────────────────────────
app.get('/api/db-test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ success: true, time: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Debug: List files in uploads
app.get('/api/debug-uploads', (req, res) => {
    try {
        const files = fs.readdirSync(path.join(__dirname, 'uploads'));
        res.json({ count: files.length, files });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ─── 5. DB Setup ─────────────────────────────────────────────
app.get('/api/setup-db', async (req, res) => {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
        await pool.query(sql);
        res.json({ success: true, message: 'Database initialized successfully!' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── 5b. Run All Migrations ───────────────────────────────────
app.get('/api/run-migrations', async (req, res) => {
    const results = [];
    const run = async (sql, label) => {
        try {
            await pool.query(sql);
            results.push({ ok: true, label });
        } catch (e) {
            results.push({ ok: false, label, error: e.message });
        }
    };

    // Households
    await run('ALTER TABLE Households ADD COLUMN IF NOT EXISTS invite_code VARCHAR(20) UNIQUE', 'Households.invite_code');
    await run("ALTER TABLE Households ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'", 'Households.status');

    // Users
    await run('ALTER TABLE Users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)', 'Users.phone');
    await run('ALTER TABLE Users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10)', 'Users.otp_code');
    await run('ALTER TABLE Users ADD COLUMN IF NOT EXISTS otp_expires TIMESTAMP', 'Users.otp_expires');
    await run('ALTER TABLE Users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE', 'Users.email_verified');
    await run("ALTER TABLE Users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'", 'Users.status');
    await run('ALTER TABLE Users ADD COLUMN IF NOT EXISTS risk_score INT DEFAULT 0', 'Users.risk_score');

    // Bills
    await run('ALTER TABLE Bills ADD COLUMN IF NOT EXISTS consumption DECIMAL(10,2)', 'Bills.consumption');
    await run('ALTER TABLE Bills ADD COLUMN IF NOT EXISTS units VARCHAR(50)', 'Bills.units');
    await run('ALTER TABLE Bills ADD COLUMN IF NOT EXISTS usage_value DECIMAL(10,2)', 'Bills.usage_value');
    await run('ALTER TABLE Bills ADD COLUMN IF NOT EXISTS usage_unit VARCHAR(50)', 'Bills.usage_unit');


    // ActivityLogs
    await run(`CREATE TABLE IF NOT EXISTS ActivityLogs (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES Users(id) ON DELETE SET NULL,
        action VARCHAR(255) NOT NULL,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, 'ActivityLogs table');

    res.json({ success: true, results });
});

// ─── 5c. Make Admin (by email) ────────────────────────────────
app.get('/api/make-admin', async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Provide ?email=yourmail@example.com' });
    try {
        const result = await pool.query(
            "UPDATE Users SET role = 'admin' WHERE email = $1 RETURNING id, email, role",
            [email]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── 6. Routes ───────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const householdRoutes = require('./routes/households');
const billRoutes = require('./routes/bills');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const reportRoutes = require('./routes/reports');

app.use('/api/auth', authRoutes);
app.use('/api/households', householdRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// ─── 7. Cron Tasks ───────────────────────────────────────────
const { initCronTasks } = require('./services/reminderService');
initCronTasks();

// ─── 8. Global Error Handler ─────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ─── 9. 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── 10. Start Server ────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'not set'}`);
    console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'connected' : 'not set'}`);
});