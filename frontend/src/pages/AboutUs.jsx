import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft } from 'lucide-react';

const AboutUs = () => {
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
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-8">About Us</h1>
          <div className="prose text-slate-600 max-w-none space-y-6">
          <p>At AivaPay, we believe that managing household utilities should be invisible, stress-free, and incredibly smart. We are a team of problem-solvers, technologists, and designers building the ultimate AI-powered multi-utility platform.</p>
          <p>Whether you're sharing an apartment with roommates or managing a family home, keeping track of electricity, water, internet, and other bills can quickly become a chore. We built AivaPay to eliminate the spreadsheets, the awkward group chats asking for money, and the surprise utility spikes.</p>
          <h2 className="text-xl font-bold text-slate-900 mt-12 mb-4">Our Mission</h2>
          <p>Our mission is to bring financial harmony to every household. By leveraging artificial intelligence, OCR receipt scanning, and predictive analytics, we aim to automate the entire lifecycle of utility management—from tracking usage and splitting expenses to timely automated reminders.</p>
            <h2 className="text-xl font-bold text-slate-900 mt-12 mb-4">Our Vision</h2>
            <p>We envision a world where nobody ever misses a bill payment or argues over who owes what. AivaPay strives to become the central nervous system of the modern home, helping users not just pay bills, but proactively reduce their carbon footprint and save money through intelligent usage insights.</p>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default AboutUs;
