import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-violet-100 selection:text-violet-700">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 py-3">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-violet-600">
            <Sparkles size={28} className="text-violet-500 fill-violet-500" />
            <span className="text-2xl tracking-tight">
              <span className="font-poppins font-extrabold text-violet-900">Aiva</span>
              <span className="font-poppins font-medium text-violet-500">Pay</span>
            </span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-violet-600 transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </nav>

      <section className="pt-32 pb-20 max-w-4xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-8">Terms and Conditions</h1>
          <div className="prose text-slate-600 max-w-none space-y-6">
          <p>Last updated: April 2026</p>
          <p>Welcome to AivaPay. These Terms and Conditions govern your use of our AI-powered utility tracking and household management platform. By creating an account or using our services, you agree to comply with these terms.</p>
          <h2 className="text-xl font-bold text-slate-900 mt-12 mb-4">1. Acceptance of Terms</h2>
          <p>By accessing AivaPay, you confirm that you are legally capable of entering into binding contracts. AivaPay provides tools for tracking bills, OCR scanning, and calculating split expenses. The platform does not directly process utility payments to the provider unless explicitly authorized via supported integrations.</p>
          <h2 className="text-xl font-bold text-slate-900 mt-12 mb-4">2. User Responsibilities</h2>
          <p>Users are responsible for the accuracy of the data uploaded, including utility receipts and split ratios among household members. While our AI offers 99% accuracy in OCR scanning, you must verify the extracted amounts before finalizing household splits. You agree not to use the platform for any fraudulent or illegal financial activities.</p>
            <h2 className="text-xl font-bold text-slate-900 mt-12 mb-4">3. Privacy Policy & Data Usage</h2>
            <p>Your privacy is paramount. AivaPay encrypts all uploaded receipts and financial data. We use aggregated, anonymized data to improve our predictive analytics and fraud detection models. We do not sell your personal financial information to third parties. For full details, please refer to our comprehensive Privacy Policy.</p>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Terms;
