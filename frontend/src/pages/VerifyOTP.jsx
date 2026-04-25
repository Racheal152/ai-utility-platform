import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowRight, ShieldCheck, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import API from '../services/api';

const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const inviteToken = location.state?.inviteToken;

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/verify-otp', { email, otp: otpValue });
      const { token, user: userData } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      if (inviteToken) {
        try {
          await API.post('/households/join', { token: inviteToken });
        } catch (e) {
          console.error('Join via invite failed:', e);
        }
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setResending(true);
    setError('');
    try {
      await API.post('/auth/forgot-password', { email }); // Using forgot-password for resend logic as it also sends OTP
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  // Auto-verify when last digit is entered
  useEffect(() => {
    if (otp.every(digit => digit !== '') && otp.join('').length === 6) {
      handleVerify();
    }
  }, [otp]);

  if (!email) return null;

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

        <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-violet-600">
          <ShieldCheck size={32} />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2 font-poppins tracking-tight">
          Verify Email
        </h2>
        <p className="text-slate-500 text-center mb-8 font-medium text-sm">
          We've sent a 6-digit code to <span className="text-slate-900 font-semibold">{email}</span>.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm text-center flex items-center justify-center gap-2 animate-shake">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-between gap-2">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                ref={(el) => (inputRefs.current[index] = el)}
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-12 h-14 text-center text-xl font-bold bg-white/70 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || otp.some(d => d === '')}
            className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 transform transition-all shadow-[0_4px_14px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.4)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed text-base font-poppins"
          >
            {loading ? 'Verifying...' : (<>Verify Account <ArrowRight size={18} strokeWidth={2.5} /></>)}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 font-medium mb-2">
            Didn't receive the code?
          </p>
          <button
            onClick={handleResend}
            disabled={timer > 0 || resending}
            className={`flex items-center gap-2 mx-auto font-bold text-sm transition-colors ${
              timer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-violet-600 hover:text-violet-700'
            }`}
          >
            {resending ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
          </button>
        </div>

        <button
          onClick={() => navigate('/register')}
          className="mt-6 text-sm text-slate-400 hover:text-slate-600 transition-colors w-full text-center"
        >
          Use a different email address
        </button>
      </div>
    </div>
  );
};

export default VerifyOTP;
