-- Admin Panel Enhancements Migration Script

-- 1. Users Table Enhancements
ALTER TABLE Users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE Users ADD COLUMN IF NOT EXISTS risk_score INT DEFAULT 0;

-- 2. Households Table Enhancements
ALTER TABLE Households ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- 3. Activity Logs Table
CREATE TABLE IF NOT EXISTS ActivityLogs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
