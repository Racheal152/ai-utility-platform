import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Sparkles, AlertCircle, CheckCircle, RefreshCw, Eye, EyeOff, KeyRound } from 'lucide-react';
import API from '../services/api';

// Step 1: Email entry
// Step 2: OTP verification
// Step 3: New password

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timer, setTimer] = useState(0);
  const inputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Auto-verify when last OTP digit entered
  useEffect(() => {
    if (step === 2 && otp.every(d => d !== '') && otp.join('').length === 6) {
      handleVerifyOtp();
    }
  }, [otp]);

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return;
    const newOtp = [...otp.map((d, i) => (i === index ? element.value : d))];
    setOtp(newOtp);
    if (element.value !== '' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email });
      setStep(2);
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.response?.data?.message || 'No account found with this email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP (advances to step 3)
  const handleVerifyOtp = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) { setError('Please enter all 6 digits.'); return; }
    setError('');
    setLoading(true);
    try {
      // We validate OTP by attempting a reset with a dummy — actually just advance step
      // The real validation happens in resetPassword. We just move to step 3 here.
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await API.post('/auth/reset-password', { email, otp: otp.join(''), newPassword });
      setSuccess('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Please start over.');
      if (err.response?.data?.message?.includes('expired') || err.response?.data?.message?.includes('Invalid')) {
        setTimeout(() => { setStep(1); setOtp(['', '', '', '', '', '']); }, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (timer > 0) return;
    setLoading(true);
    setError('');
    try {
      await API.post('/auth/forgot-password', { email });
      setOtp(['', '', '', '', '', '']);
      setTimer(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Enter Email', 'Verify OTP', 'New Password'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 p-4 overflow-hidden relative font-sans">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-pink-300/30 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] bg-violet-300/30 rounded-full blur-[120px] pointer-events-none animate-pulse delay-700" />

      <div className="w-full max-w-md relative z-10">
        <div className="p-10 rounded-3xl bg-white/80 backdrop-blur-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2">
              <Sparkles size={28} className="text-violet-500 fill-violet-500" />
              <span className="text-3xl tracking-tight">
                <span className="font-poppins font-extrabold text-violet-900">Aiva</span>
                <span className="font-poppins font-medium text-violet-500">Pay</span>
              </span>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {stepLabels.map((label, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    i + 1 < step ? 'bg-emerald-500 text-white' :
                    i + 1 === step ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {i + 1 < step ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${i + 1 === step ? 'text-violet-600' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </div>
                {i < 2 && <div className={`h-px w-8 mb-4 transition-all duration-500 ${i + 1 < step ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* Icon */}
          <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-5 text-violet-600">
            {step === 1 && <Mail size={30} />}
            {step === 2 && <KeyRound size={30} />}
            {step === 3 && <Lock size={30} />}
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-1 font-poppins tracking-tight">
            {step === 1 && 'Forgot Password?'}
            {step === 2 && 'Check Your Email'}
            {step === 3 && 'Set New Password'}
          </h2>
          <p className="text-slate-500 text-center mb-7 font-medium text-sm">
            {step === 1 && "We'll send a reset code to your email address."}
            {step === 2 && <>We sent a 6-digit code to <span className="font-semibold text-slate-800">{email}</span>.</>}
            {step === 3 && 'Choose a strong password for your account.'}
          </p>

          {/* Feedback */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm text-center flex items-center justify-center gap-2">
              <AlertCircle size={15} /> {error}
            </div>
          )}
          {success && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm text-center flex items-center justify-center gap-2">
              <CheckCircle size={15} /> {success}
            </div>
          )}

          {/* ── Step 1: Email ── */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  autoFocus
                  className="block w-full pl-12 pr-4 py-4 bg-white/70 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.4)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed text-base font-poppins"
              >
                {loading ? 'Sending...' : <><span>Send Reset Code</span> <ArrowRight size={18} strokeWidth={2.5} /></>}
              </button>
            </form>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between gap-2">
                {otp.map((data, index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    ref={el => (inputRefs.current[index] = el)}
                    value={data}
                    onChange={e => handleOtpChange(e.target, index)}
                    onKeyDown={e => handleOtpKeyDown(e, index)}
                    className="w-12 h-14 text-center text-xl font-bold bg-white/70 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                ))}
              </div>
              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.some(d => d === '')}
                className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.4)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed text-base font-poppins"
              >
                {loading ? 'Verifying...' : <><span>Verify Code</span> <ArrowRight size={18} strokeWidth={2.5} /></>}
              </button>
              <div className="text-center">
                <p className="text-sm text-slate-500 font-medium mb-2">Didn't receive the code?</p>
                <button
                  onClick={handleResend}
                  disabled={timer > 0 || loading}
                  className={`flex items-center gap-2 mx-auto font-bold text-sm transition-colors ${
                    timer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-violet-600 hover:text-violet-700'
                  }`}
                >
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                  {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: New Password ── */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  className="block w-full pl-12 pr-12 py-4 bg-white/70 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
                  placeholder="New password (min 6 chars)"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  className="block w-full pl-12 pr-12 py-4 bg-white/70 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password match indicator */}
              {confirmPassword && (
                <div className={`flex items-center gap-2 text-xs font-semibold ${newPassword === confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                  {newPassword === confirmPassword
                    ? <><CheckCircle size={13} /> Passwords match</>
                    : <><AlertCircle size={13} /> Passwords do not match</>}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.4)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed text-base font-poppins mt-2"
              >
                {loading ? 'Resetting...' : <><span>Reset Password</span> <ArrowRight size={18} strokeWidth={2.5} /></>}
              </button>
            </form>
          )}

          {/* Back to login */}
          <button
            onClick={() => navigate('/login')}
            className="mt-7 text-sm text-slate-400 hover:text-slate-600 transition-colors w-full text-center"
          >
            ← Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
