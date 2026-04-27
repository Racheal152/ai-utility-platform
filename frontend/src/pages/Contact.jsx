import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, Mail, Phone, MapPin, Briefcase } from 'lucide-react';

const Contact = () => {
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
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Contact & Careers</h1>
          <p className="text-slate-500 mb-12">We'd love to hear from you. Whether you have a question about features, trials, pricing, or anything else, our team is ready to answer all your questions.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-slate-900">Get in Touch</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
                    <Mail size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1 text-[10px]">Email Us</p>
                    <a href="mailto:kacheracheal152@gmail.com" className="text-slate-600 hover:text-violet-600 transition-colors text-lg font-medium">
                      kacheracheal152@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
                    <Phone size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1 text-[10px]">Call Us</p>
                    <a href="tel:0705214157" className="text-slate-600 hover:text-violet-600 transition-colors text-lg font-medium">
                      0705214157
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1 text-[10px]">Office</p>
                    <p className="text-slate-600 text-lg font-medium">Nairobi, Kenya</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-xl font-bold text-slate-900">Careers</h2>
              <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center">
                 <div className="p-4 bg-white rounded-2xl shadow-sm mb-6">
                   <Briefcase size={32} className="text-slate-400" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-800 mb-2">No opportunities for now</h3>
                 <p className="text-sm text-slate-500 leading-relaxed">
                   We're not currently hiring, but we're always looking for talented people to join our community. Check back later!
                 </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Contact;
