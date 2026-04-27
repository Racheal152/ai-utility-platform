import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, Briefcase, Sparkle } from 'lucide-react';

const Careers = () => {
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
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Careers at AivaPay</h1>
          <p className="text-slate-500 mb-12">Help us build the future of household financial harmony. We are a remote-first team of thinkers and builders.</p>

          <div className="bg-slate-50 rounded-[3rem] border border-slate-100 p-12 text-center relative overflow-hidden">
             {/* Decorative backgrounds */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-violet-200/20 rounded-full blur-3xl -z-10" />
             <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-200/20 rounded-full blur-3xl -z-10" />

             <div className="w-20 h-20 bg-white rounded-3xl shadow-xl border border-slate-100 flex items-center justify-center mx-auto mb-8">
               <Briefcase size={40} className="text-slate-400" />
             </div>
             
             <h2 className="text-2xl font-extrabold text-slate-900 mb-4 tracking-tight">No opportunities for now</h2>
             <p className="text-slate-500 max-w-sm mx-auto leading-relaxed mb-10 font-medium">
               We're not currently hiring for any positions, but we're always excited to meet talented builders. Stay tuned for future openings!
             </p>

             <div className="pt-8 border-t border-slate-200/50">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                 <Sparkle size={14} className="text-violet-400" /> Work with purpose
               </p>
             </div>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="p-8 rounded-3xl bg-violet-50/50 border border-violet-100">
                <h3 className="font-bold text-violet-900 mb-2">Our Culture</h3>
                <p className="text-sm text-violet-700 leading-relaxed">We value transparency, efficiency, and a deep obsession with solving real problems for real families.</p>
             </div>
             <div className="p-8 rounded-3xl bg-indigo-50/50 border border-indigo-100">
                <h3 className="font-bold text-indigo-900 mb-2">Remote First</h3>
                <p className="text-sm text-indigo-700 leading-relaxed">We work across time zones to bring together the best talent, no matter where they are located.</p>
             </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Careers;
