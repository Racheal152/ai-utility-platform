import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Sparkles, AlertCircle, ShieldX, Ban, AlertTriangle } from 'lucide-react';
import API from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [accountStatus, setAccountStatus] = useState(null); // 'suspended' | 'deleted' | 'restricted' | null
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setAccountStatus(null);
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      const { token, ...userData } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      const searchParams = new URLSearchParams(window.location.search);
      const inviteToken = searchParams.get('invite');
      if (inviteToken) {
        try {
          await API.post('/households/join', { token: inviteToken });
        } catch (e) {
          console.error('Join via invite failed:', e);
        }
      }

      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.status) {
        setAccountStatus(data.status); // suspended | deleted | restricted
      } else {
        setError(data?.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const inviteToken = new URLSearchParams(window.location.search).get('invite');
      if (inviteToken) {
        API.post('/households/join', { token: inviteToken })
          .finally(() => navigate('/dashboard'));
      } else {
        navigate('/dashboard');
      }
    }
  }, [navigate]);

  const searchParams = new URLSearchParams(window.location.search);
  const inviteToken = searchParams.get('invite');

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 p-4 overflow-hidden relative font-sans transition-all duration-500">
      {/* Soft luxury glow background elements */}
      <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-pink-300/30 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] bg-violet-300/30 rounded-full blur-[120px] pointer-events-none animate-pulse delay-700"></div>

      <div className="w-full max-w-md p-10 rounded-3xl bg-white/80 backdrop-blur-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative z-10 transition-all duration-500">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <Sparkles size={28} className="text-violet-500 fill-violet-500" />
            <span className="text-3xl tracking-tight">
              <span className="font-poppins font-extrabold text-violet-900">Aiva</span>
              <span className="font-poppins font-medium text-violet-500">Pay</span>
            </span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2 font-poppins tracking-tight">
          Welcome Back
        </h2>
        <p className="text-slate-500 text-center mb-8 font-medium text-sm">AI-powered financial clarity.</p>

        {/* Generic error */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm text-center flex items-center justify-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Account status banners */}
        {accountStatus === 'suspended' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <div className="flex items-center gap-2 font-bold mb-1">
              <Ban size={16} className="text-amber-500" /> Account Suspended
            </div>
            <p className="text-amber-700 text-xs leading-relaxed">Your account has been suspended by an administrator. Please contact support for assistance.</p>
          </div>
        )}
        {accountStatus === 'deleted' && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
            <div className="flex items-center gap-2 font-bold mb-1">
              <ShieldX size={16} className="text-red-500" /> Account Deactivated
            </div>
            <p className="text-red-700 text-xs leading-relaxed">This account has been deactivated. Please contact support if you believe this is a mistake.</p>
          </div>
        )}
        {accountStatus === 'restricted' && (
          <div className="mb-6 p-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-800 text-sm">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertTriangle size={16} className="text-orange-500" /> Access Restricted
            </div>
            <p className="text-orange-700 text-xs leading-relaxed">Your account access has been restricted. Please contact support for more information.</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
            </div>
            <input
              type="email"
              required
              className="block w-full pl-12 pr-4 py-4 bg-white/70 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:scale-[1.01] transition-all font-medium"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
            </div>
            <input
              type="password"
              required
              className="block w-full pl-12 pr-4 py-4 bg-white/70 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:scale-[1.01] transition-all font-medium"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 transform transition-all shadow-[0_4px_14px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.4)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed text-base font-poppins"
          >
            {loading ? 'Authenticating...' : (<>Sign In <ArrowRight size={18} strokeWidth={2.5} /></>)}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500 font-medium">
          New to AivaPay?{' '}
          <Link to={inviteToken ? `/register?invite=${inviteToken}` : '/register'} className="text-violet-600 hover:text-violet-700 font-bold transition-colors ml-1">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;