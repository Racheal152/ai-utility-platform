import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const UserGuide = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-violet-100 selection:text-violet-700">
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

      <section className="pt-32 pb-20 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-6">User Guide</h1>
          <p className="text-base text-slate-600">Master your household finances with AivaPay. Follow this comprehensive guide to configure your household, automate expense splits, and harness our AI to reduce your utility bills.</p>
        </motion.div>

        <div className="space-y-32">
          {/* Step 1 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div className="space-y-6 order-2 lg:order-1">
              <div className="inline-block px-4 py-2 bg-violet-100 text-violet-700 font-bold rounded-full text-xs">Step 1</div>
              <h2 className="text-2xl font-bold text-slate-900">Household Setup & Member Invites</h2>
              <div className="space-y-4 text-base text-slate-600 leading-relaxed">
                <p>After creating your account, your first task is to set up your digital household. Navigate to the <strong>Household</strong> tab on your dashboard.</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Invite Members:</strong> Add your roommates, partner, or family members by entering their email addresses. They will receive a secure link to join your specific household.</li>
                  <li><strong>Configure Split Ratios:</strong> Establish your default expense distribution. You can choose a standard <em>Equal Split</em>, or define a <em>Custom Weighting</em> (e.g., based on room size or specific usage agreements).</li>
                </ul>
              </div>
            </div>
            <div className="order-1 lg:order-2 rounded-3xl h-[28rem] overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-200 bg-white flex items-center justify-center p-4">
              <img src="/Screenshot (223).png" alt="Household Setup" className="max-w-full max-h-full object-contain rounded-xl" />
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div className="rounded-3xl h-[28rem] overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-200 bg-white flex items-center justify-center p-4">
              <img src="/Screenshot (225).png" alt="Smart OCR Bill Scanning" className="max-w-full max-h-full object-contain rounded-xl" />
            </div>
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 bg-violet-100 text-violet-700 font-bold rounded-full text-xs">Step 2</div>
              <h2 className="text-2xl font-bold text-slate-900">Uploading Bills via Smart Scan</h2>
              <div className="space-y-4 text-base text-slate-600 leading-relaxed">
                <p>When a new utility bill arrives (electricity, water, internet), head over to the <strong>Bill Tracking</strong> section to process it instantly.</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Upload Receipt:</strong> Snap a photo with your phone or upload a PDF invoice directly into the platform.</li>
                  <li><strong>AI Data Extraction:</strong> Our advanced OCR (Optical Character Recognition) engine will scan the document in seconds, automatically extracting the <em>Vendor Name</em>, <em>Total Amount</em>, and <em>Due Date</em> with 99% accuracy.</li>
                  <li><strong>Verification:</strong> Quickly review the extracted data and hit "Confirm" to log the bill into your household ledger.</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div className="space-y-6 order-2 lg:order-1">
              <div className="inline-block px-4 py-2 bg-violet-100 text-violet-700 font-bold rounded-full text-xs">Step 3</div>
              <h2 className="text-2xl font-bold text-slate-900">Automated Splitting & Reminders</h2>
              <div className="space-y-4 text-base text-slate-600 leading-relaxed">
                <p>Once a bill is verified, AivaPay's Fair-Split algorithm takes over the heavy lifting so you never have to do the math yourself.</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Instant Calculation:</strong> The total amount is immediately divided among household members based on your pre-configured split ratios.</li>
                  <li><strong>Smart Notifications:</strong> The system automatically pushes email and dashboard notifications to everyone, detailing exactly what they owe and when it's due.</li>
                  <li><strong>Late Fee Prevention:</strong> To ensure bills are paid on time, AivaPay sends automated follow-up reminders exactly 3 days before the scheduled due date.</li>
                </ul>
              </div>
            </div>
            <div className="order-1 lg:order-2 rounded-3xl h-[28rem] overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-200 bg-white flex items-center justify-center p-4">
              <img src="/Screenshot (224).png" alt="Expense Splitting & Reminders" className="max-w-full max-h-full object-contain rounded-xl" />
            </div>
          </motion.div>

          {/* Step 4 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div className="rounded-3xl h-[28rem] overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-200 bg-white flex items-center justify-center p-4">
              <img src="/Screenshot (226).png" alt="Predictive Analytics Dashboard" className="max-w-full max-h-full object-contain rounded-xl" />
            </div>
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 bg-violet-100 text-violet-700 font-bold rounded-full text-xs">Step 4</div>
              <h2 className="text-2xl font-bold text-slate-900">Predictive Analytics & Savings</h2>
              <div className="space-y-4 text-base text-slate-600 leading-relaxed">
                <p>AivaPay goes beyond simple tracking by turning your historical bill data into actionable insights available right on your <strong>Dashboard</strong>.</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Budget Forecasting:</strong> Using machine learning, the system analyzes your past consumption trends to accurately predict your upcoming utility expenses, allowing you to budget proactively.</li>
                  <li><strong>Anomaly Detection:</strong> If the AI detects a sudden, unusual spike in consumption (which could indicate an unknown water leak or phantom power drain), it immediately flags the anomaly so you can investigate and prevent a massive bill.</li>
                  <li><strong>Savings Tracking:</strong> Monitor your household's month-over-month reductions and track your overall savings goals effortlessly.</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default UserGuide;
