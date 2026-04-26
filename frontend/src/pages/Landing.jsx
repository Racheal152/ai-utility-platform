import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, ShieldCheck, Zap, TrendingUp, TrendingDown, Users, ArrowRight,
  CheckCircle, MousePointer2, Play, ChevronRight, Menu, X,
  FileText, Droplet, Wifi, Smartphone, Globe, CreditCard
} from 'lucide-react';

const Landing = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-violet-100 selection:text-violet-700">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md border-b border-slate-200 py-3' : 'bg-transparent py-5'
        }`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-2 text-violet-600">
            <Sparkles size={28} className="text-violet-500 fill-violet-500" />
            <span className="text-2xl tracking-tight">
              <span className="font-poppins font-extrabold text-violet-900">Aiva</span>
              <span className="font-poppins font-medium text-violet-500">Pay</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-violet-600 transition-colors">Features</a>
            <Link to="/about" className="hover:text-violet-600 transition-colors">About Us</Link>
            <Link to="/guide" className="hover:text-violet-600 transition-colors">User Guide</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="px-5 py-2 text-sm font-bold text-slate-700 hover:text-violet-600 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-full shadow-lg shadow-violet-200 transition-all transform hover:-translate-y-0.5 active:scale-95">
              Get Started
            </Link>
          </div>

          <button className="md:hidden text-slate-900" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-white p-6 flex flex-col">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-2 text-violet-600">
              <Sparkles size={28} className="text-violet-500 fill-violet-500" />
              <span className="text-2xl font-bold text-violet-900">AivaPay</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="text-slate-900">
              <X size={28} />
            </button>
          </div>
          <div className="flex flex-col gap-6 text-xl font-bold text-slate-800">
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
            <Link to="/guide" onClick={() => setMobileMenuOpen(false)}>User Guide</Link>
            <hr className="border-slate-100" />
            <Link to="/login" className="text-violet-600">Sign In</Link>
            <Link to="/register" className="w-full py-4 bg-violet-600 text-white text-center rounded-2xl shadow-xl shadow-violet-200">
              Get Started
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-violet-100 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-pink-100 rounded-full blur-[120px] -z-10 animate-pulse delay-700" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
        >
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-50 border border-violet-100 rounded-full text-violet-600 text-xs font-bold uppercase tracking-wider animate-bounce">
              <Zap size={14} className="fill-violet-600" /> AI-Powered Utility Management
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
              Master Your Bills with <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">AI Intelligence.</span>
            </h1>
            <p className="text-base md:text-lg text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              AivaPay automates your utility tracking, splits household expenses fairly, and uses predictive AI to save you money every month.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl shadow-xl shadow-violet-200 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 group">
                Start Free Trial <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => setShowDemo(true)}
                className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group"
              >
                <Play size={18} className="fill-slate-700 group-hover:scale-110 transition-transform" /> Watch Demo
              </button>
            </div>
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-slate-400">
              <p className="text-xs font-semibold uppercase tracking-widest">Join our growing community of households</p>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-violet-500/10 rounded-3xl blur-3xl group-hover:bg-violet-500/20 transition-all duration-500 -z-10" />
            <img
              src="/aivapay_hero_mockup_1777127547710.png"
              alt="AivaPay App Interface"
              className="w-full h-auto rounded-[2.5rem] shadow-2xl border-8 border-white transform hover:scale-[1.02] transition-transform duration-500"
            />
            {/* Floating elements */}
            <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 hidden md:block animate-float">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingDown size={20} /></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Track your</p>
                  <p className="text-lg font-bold text-slate-900">Monthly Savings</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-20 space-y-4"
        >
          <h2 className="text-sm font-bold text-violet-600 uppercase tracking-widest">Why AivaPay?</h2>
          <p className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Everything you need for financial harmony.</p>
          <p className="text-base text-slate-500 font-medium leading-relaxed">We combine AI-driven insights with practical household tools to remove the stress of monthly bills.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<FileText className="text-violet-600" />}
            title="OCR Smart Scanning"
            desc="Simply take a photo of your receipt. Our AI extracts amounts, dates, and vendors instantly with 99% accuracy."
            color="bg-violet-50"
          />
          <FeatureCard
            icon={<Users className="text-emerald-600" />}
            title="Fair-Split Algorithm"
            desc="Automate household splits. Choose between equal shares or custom weights based on room size or usage."
            color="bg-emerald-50"
          />
          <FeatureCard
            icon={<TrendingUp className="text-amber-600" />}
            title="Predictive Analytics"
            desc="Our models analyze your usage trends to project next month's bills, helping you budget before the invoice arrives."
            color="bg-amber-50"
          />
          <FeatureCard
            icon={<ShieldCheck className="text-blue-600" />}
            title="Fraud Detection"
            desc="AivaPay flags unusual spikes in your utility usage, helping you catch leaks or phantom power drains early."
            color="bg-blue-50"
          />
          <FeatureCard
            icon={<Globe className="text-pink-600" />}
            title="Multi-Utility Support"
            desc="Manage electricity, water, internet, and rent in one place. Centralized history for all your monthly obligations."
            color="bg-pink-50"
          />
          <FeatureCard
            icon={<CheckCircle className="text-indigo-600" />}
            title="Automated Reminders"
            desc="Never miss a due date again. Smart notifications keep the whole household informed and on schedule."
            color="bg-indigo-50"
          />
        </div>
      </section>

      {/* Bento Showcase Section */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden rounded-[4rem] mx-6 md:mx-12 mb-32 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px]" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="max-w-7xl mx-auto px-8 md:px-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
        >
          <div className="lg:col-span-5 space-y-8">
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">Designed for the <span className="text-violet-400">Modern Household.</span></h2>
            <p className="text-slate-400 text-base leading-relaxed">Whether you're a student sharehouse or a growing family, AivaPay scales to fit your lifestyle.</p>

            <div className="space-y-4">
              {[
                "Instant cross-platform syncing",
                "End-to-end encryption for data",
                "Direct utility portal integration"
              ].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center"><CheckCircle size={12} className="text-white" /></div>
                  <span className="font-semibold text-slate-300">{item}</span>
                </div>
              ))}
            </div>

            <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-violet-50 transition-all transform hover:scale-105">
              Explore Dashboard <ChevronRight size={18} />
            </Link>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="h-48 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6 flex flex-col justify-end">
                <div className="p-3 bg-violet-500/20 text-violet-400 rounded-2xl w-fit mb-4"><TrendingUp size={24} /></div>
                <p className="font-bold text-xl">Real-time Analytics</p>
              </div>
              <div className="h-64 bg-violet-600 rounded-3xl p-8 flex flex-col justify-between">
                <div className="p-3 bg-white/20 text-white rounded-2xl w-fit mb-4"><Zap size={24} /></div>
                <p className="font-bold text-lg leading-tight">Save money effortlessly with our smart optimization tools.</p>
              </div>
            </div>
            <div className="space-y-4 pt-12">
              <div className="h-64 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-8 flex flex-col justify-between">
                <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl w-fit mb-4"><Users size={24} /></div>
                <p className="font-bold text-xl">Collaborative household management.</p>
              </div>
              <div className="h-48 bg-indigo-500/20 rounded-3xl border border-indigo-500/30 p-6 flex flex-col justify-center items-center text-center">
                <Sparkles size={40} className="text-indigo-400 mb-2" />
                <p className="font-bold">AI Driven</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA Footer */}
      <footer className="py-24 text-center space-y-12">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Ready to simplify your <span className="text-violet-600 underline decoration-violet-200 underline-offset-8">finances?</span></h2>
          <p className="text-lg text-slate-500 mb-12">Join thousands of households who trust AivaPay to handle the boring stuff.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 text-lg">
              Create Free Account
            </Link>
            <Link to="/login" className="w-full sm:w-auto px-10 py-5 bg-white border border-slate-200 text-slate-900 font-bold rounded-2xl hover:bg-slate-50 transition-all text-lg">
              Log In
            </Link>
          </div>
        </div>

        <div className="pt-24 border-t border-slate-100 text-slate-400 text-sm font-semibold max-w-7xl mx-auto px-12 grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-violet-600 opacity-60">
              <Sparkles size={20} className="text-violet-500 fill-violet-500" />
              <span className="text-lg font-bold text-violet-900">AivaPay</span>
            </div>
            <p className="text-sm">Simplifying household finances with AI.</p>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-slate-900 font-bold uppercase tracking-wider text-xs">Product</h3>
            <a href="#features" className="hover:text-violet-600 transition-colors">Features</a>
            <Link to="/guide" className="hover:text-violet-600 transition-colors">User Guide</Link>
            <span className="text-slate-500 cursor-not-allowed">Pricing (Coming Soon)</span>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-slate-900 font-bold uppercase tracking-wider text-xs">Company</h3>
            <Link to="/about" className="hover:text-violet-600 transition-colors">About Us</Link>
            <a href="#" className="hover:text-violet-600 transition-colors">Contact</a>
            <a href="#" className="hover:text-violet-600 transition-colors">Careers</a>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-slate-900 font-bold uppercase tracking-wider text-xs">Legal</h3>
            <Link to="/terms" className="hover:text-violet-600 transition-colors">Terms & Conditions</Link>
            <Link to="/terms" className="hover:text-violet-600 transition-colors">Privacy Policy</Link>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-slate-100 text-slate-400 text-sm font-semibold max-w-7xl mx-auto px-12 text-center">
          <p>© 2026 AivaPay AI Inc. All rights reserved.</p>
        </div>
      </footer>

      {/* Video Modal */}
      {showDemo && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 scale-in-center">
            <button
              onClick={() => setShowDemo(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
            >
              <X size={24} />
            </button>
            <video
              className="w-full h-full"
              src="/demo.mp4"
              controls
              autoPlay
            />
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, color }) => (
  <div className="group p-8 rounded-[2rem] border border-slate-100 bg-white hover:border-violet-200 hover:shadow-2xl hover:shadow-violet-500/5 transition-all duration-500">
    <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
      {React.cloneElement(icon, { size: 28 })}
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-sm text-slate-500 leading-relaxed font-medium">{desc}</p>
  </div>
);

export default Landing;
