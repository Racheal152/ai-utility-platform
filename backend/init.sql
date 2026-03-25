-- AI-Powered Multi-Utility Bill Management Platform Schema

CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Households (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_by INT REFERENCES Users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE HouseholdMembers (
    user_id INT REFERENCES Users(id) ON DELETE CASCADE,
    household_id INT REFERENCES Households(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- owner, member
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, household_id)
);

CREATE TABLE Bills (
    id SERIAL PRIMARY KEY,
    household_id INT REFERENCES Households(id) ON DELETE CASCADE,
    utility_type VARCHAR(50) NOT NULL, -- electricity, water, internet, rent
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    period VARCHAR(50), -- e.g., 'March 2026'
    status VARCHAR(50) DEFAULT 'pending', -- pending, partially_paid, paid
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ExpenseShares (
    id SERIAL PRIMARY KEY,
    bill_id INT UNIQUE REFERENCES Bills(id) ON DELETE CASCADE,
    split_type VARCHAR(50) DEFAULT 'equal', -- equal, custom
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ShareLines (
    id SERIAL PRIMARY KEY,
    expense_share_id INT REFERENCES ExpenseShares(id) ON DELETE CASCADE,
    user_id INT REFERENCES Users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'unpaid' -- unpaid, paid
);

CREATE TABLE PaymentProofs (
    id SERIAL PRIMARY KEY,
    bill_id INT REFERENCES Bills(id) ON DELETE CASCADE,
    user_id INT REFERENCES Users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    ocr_data JSONB, -- stores extracted text like { amount, date, type }
    status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Forecasts (
    id SERIAL PRIMARY KEY,
    household_id INT REFERENCES Households(id) ON DELETE CASCADE,
    utility_type VARCHAR(50) NOT NULL,
    predicted_amount DECIMAL(10, 2) NOT NULL,
    prediction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
