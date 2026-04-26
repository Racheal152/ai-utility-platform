-- AI-Powered Multi-Utility Bill Management Platform Schema (Complete)

CREATE TABLE IF NOT EXISTS Users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(50) DEFAULT 'active',
    risk_score INT DEFAULT 0,
    otp_code VARCHAR(10),
    otp_expires TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Households (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    invite_code VARCHAR(20) UNIQUE,
    status VARCHAR(50) DEFAULT 'active',
    created_by INT REFERENCES Users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS HouseholdMembers (
    user_id INT REFERENCES Users(id) ON DELETE CASCADE,
    household_id INT REFERENCES Households(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- owner, member
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, household_id)
);

CREATE TABLE IF NOT EXISTS Bills (
    id SERIAL PRIMARY KEY,
    household_id INT REFERENCES Households(id) ON DELETE CASCADE,
    utility_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    period VARCHAR(50), -- e.g., 'March 2026'
    status VARCHAR(50) DEFAULT 'pending', -- pending, partially_paid, paid
    consumption DECIMAL(10, 2),
    units VARCHAR(50),
    usage_value DECIMAL(10, 2),
    usage_unit VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ExpenseShares (
    id SERIAL PRIMARY KEY,
    bill_id INT UNIQUE REFERENCES Bills(id) ON DELETE CASCADE,
    split_type VARCHAR(50) DEFAULT 'equal', -- equal, custom
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ShareLines (
    id SERIAL PRIMARY KEY,
    expense_share_id INT REFERENCES ExpenseShares(id) ON DELETE CASCADE,
    user_id INT REFERENCES Users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'unpaid' -- unpaid, paid
);

CREATE TABLE IF NOT EXISTS PaymentProofs (
    id SERIAL PRIMARY KEY,
    bill_id INT REFERENCES Bills(id) ON DELETE CASCADE,
    user_id INT REFERENCES Users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    ocr_data JSONB, -- stores extracted text like { amount, date, type }
    status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
    rejection_reason TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Forecasts (
    id SERIAL PRIMARY KEY,
    household_id INT REFERENCES Households(id) ON DELETE CASCADE,
    utility_type VARCHAR(50) NOT NULL,
    predicted_amount DECIMAL(10, 2) NOT NULL,
    prediction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ActivityLogs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
