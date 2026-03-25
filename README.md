# AI-Powered Multi-Utility Bill Management Platform

This project is an AI-powered platform for Kenyan households to manage utility bills, predict expenses, and split costs.

## Architecture

* **Frontend:** Built with React/Vite and modern TailwindCSS + Lucide Icons for aesthetic UI.
* **Backend:** Node.js with Express and PostgreSQL handling households, authentication, billing, and OCR uploading logic.
* **AI Service:** A Python microservice providing Machine Learning forecasts utilizing Scikit-Learn.

## Setup Instructions

Ensure PostgreSQL is running locally and update `backend/.env` with your DB URL.

### 1. Database Initialization
Run the schema inside your postgres database:
```bash
psql -U postgres -d postgres -f backend/init.sql
```

### 2. Run Backend
```bash
cd backend
npm install
node seed.js # optional: seed data
node server.js
```

### 3. Run AI Service
```bash
cd ai-service
pip install -r requirements.txt
python model.py # Run this once to train the synthetic models
python app.py
```

### 4. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to use the application.
