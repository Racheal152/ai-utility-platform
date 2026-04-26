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