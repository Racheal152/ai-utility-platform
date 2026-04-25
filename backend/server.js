const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Basic test route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'AI Utility Platform Backend is running.' });
});

// Import basic routes (we will create these next)
const authRoutes = require('./routes/auth');
const householdRoutes = require('./routes/households');
const billRoutes = require('./routes/bills');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const reportRoutes = require('./routes/reports');
const { initCronTasks } = require('./services/reminderService');

app.use('/api/auth', authRoutes);
app.use('/api/households', householdRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

initCronTasks();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
