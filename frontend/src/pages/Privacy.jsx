import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, Shield } from 'lucide-react';

const Privacy = () => {
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
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl">
              <Shield size={32} />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
          </div>
          
          <div className="prose text-slate-600 max-w-none space-y-6 leading-relaxed">
            <p className="text-lg font-medium text-slate-900">Last updated: April 2026</p>
            <p>At AivaPay, we take your privacy seriously. This policy explains how we collect, use, and protect your information when you use our AI-powered utility platform.</p>

            <h2 className="text-xl font-bold text-slate-900 mt-12 mb-4">1. Data We Collect</h2>
            <p>We collect information necessary to provide our services, including:</p>
            <ul className="list-disc pl-6 space-y-2 ml-4">
              <li><strong>Personal Info:</strong> Name, email address, and phone number.</li>
              <li><strong>Financial Documents:</strong> Utility bills and payment receipts you upload for OCR processing.</li>
              <li><strong>Household Data:</strong> Information about your household members and how you split expenses.</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-900 mt-12 mb-4">2. How We Use Your Data</h2>
            <p>Your data is used specifically to:</p>
            <ul className="list-disc pl-6 space-y-2 ml-4">
              <li>Process and verify your utility payments using AI OCR technology.</li>
              <li>Generate predictive analytics for your future household expenses.</li>
              <li>Provide sustainability insights and usage trend analysis.</li>
              <li>Facilitate fair expense sharing within your household.</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-900 mt-12 mb-4">3. Data Security</h2>
            <p>We implement industry-standard security measures to protect your data. All sensitive documents (like receipts) are stored with end-to-end encryption. Access to household data is restricted to members of that specific household and authorized system administrators.</p>

            <h2 className="text-xl font-bold text-slate-900 mt-12 mb-4">4. Sharing Your Information</h2>
            <p><strong>We do not sell your personal or financial data to third parties.</strong> Data is only shared with other members of your household for transparency and payment verification purposes.</p>

            <h2 className="text-xl font-bold text-slate-900 mt-12 mb-4">5. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal information at any time. If you choose to delete your account, all associated personal data and uploaded documents will be permanently removed from our active servers within 30 days.</p>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Privacy;
