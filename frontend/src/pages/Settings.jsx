import React, { useState } from 'react';
import { Home, FileText, Users, Settings as SettingsIcon, LogOut, Sparkles, Save, Loader2, AlertCircle, CheckCircle, ShieldCheck, TrendingUp, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { updateProfile, fetchUserProfile } from '../services/api';
import NotificationBell from '../components/NotificationBell';
import MobileNav from '../components/MobileNav';

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
  });
  
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  React.useEffect(() => {
    const getLatestProfile = async () => {
      try {
        const res = await fetchUserProfile();
        const userData = res.data;
        setUser(userData);
        setName(userData.name || '');
        setPhone(userData.phone || '');
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (err) {
        console.error('Failed to fetch latest profile:', err);
      }
    };
    getLatestProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    // ── Client-side validation ────────────────────────────────
    if (phone) {
      const cleaned = phone.replace(/\s+/g, '');
      const phoneRegex = /^(0\d{9}|\+254\d{9})$/;
      if (!phoneRegex.test(cleaned)) {
        setMsg({ type: 'error', text: 'Phone must be 10 digits (e.g. 0712345678) or +254XXXXXXXXX' });
        return;
      }
    }
    if (password && password.length < 6) {
      setMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setSaving(true);
    try {
      const payload = { name, phone };
      if (password) payload.password = password;
      const res = await updateProfile(payload);
      
      const updatedUser = { ...user, name: res.data.user.name, phone: res.data.user.phone };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setPassword('');
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const initials = (nameStr) => (nameStr || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-violet-600 font-poppins">
            <Sparkles size={24} className="text-violet-500 fill-violet-500" />
            <span className="text-xl tracking-tight">
              <span className="font-extrabold text-violet-900">Aiva</span>
              <span className="font-medium text-violet-500">Pay</span>
            </span>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 text-slate-600 font-medium">
          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
            <Home size={20} /> Dashboard
          </Link>
          <Link to="/bills" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
            <FileText size={20} /> Bills &amp; Splits
          </Link>
          <Link to="/household" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
            <Users size={20} /> Household
          </Link>
          <Link to="/reports" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
            <TrendingUp size={20} /> Reports
          </Link>
          <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 bg-violet-50 text-violet-700 rounded-xl transition-colors">
            <SettingsIcon size={20} /> Settings
          </Link>
          {user.role === 'admin' && (
            <Link to="/admin" className="flex items-center gap-3 px-3 py-2.5 text-violet-500 hover:bg-violet-50 hover:text-violet-700 rounded-xl transition-colors mt-4 border border-violet-100 bg-violet-50/50">
              <ShieldCheck size={20} /> Admin Panel
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm">
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Soft luxury glow background elements */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-pink-300/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-0 w-[30rem] h-[30rem] bg-violet-300/20 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse delay-1000"></div>

        <header className="py-4 md:h-16 flex flex-wrap md:flex-nowrap items-center justify-between px-4 md:px-8 bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-20 gap-4">
          <h1 className="text-xl font-semibold text-slate-800">Account Settings</h1>
          <NotificationBell className="ml-auto" />
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-24 md:p-8 max-w-3xl mx-auto w-full">
          {msg.text && (
            <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm border ${msg.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
              {msg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
              {msg.text}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                {initials(user.name)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{user.name}</h2>
                <p className="text-slate-500">{user.email}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  value={user.email} 
                  disabled
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 text-slate-500 cursor-not-allowed" 
                />
                <p className="text-xs text-slate-400 mt-1.5">Email address cannot be changed currently.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white focus:scale-[1.01] transition-all" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Phone Number</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white focus:scale-[1.01] transition-all" 
                />
              </div>

              <div className="relative">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">New Password (Optional)</label>
                <div className="relative group">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white focus:scale-[1.01] transition-all" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-violet-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="py-3 px-6 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(139,92,246,0.3)]"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
};

export default Settings;
