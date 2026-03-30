import React, { useState, useEffect } from 'react';
import {
  Home, FileText, Users, Settings, Zap,
  TrendingUp, TrendingDown, Minus, Droplet, Wifi,
  DollarSign, Plus, AlertCircle, Loader2, LogOut
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { ensureHousehold, fetchBills, addBill, fetchPredictions } from '../services/api';
import NotificationBell from '../components/NotificationBell';
import MobileNav from '../components/MobileNav';

// ─── helpers ──────────────────────────────────────────────────
const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
const UTILITY_TYPES = ['Electricity', 'Water', 'Internet', 'Rent', 'Gas', 'Other'];

const utilityIcon = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('electric')) return <Zap size={20} className="text-amber-500" />;
  if (t.includes('water')) return <Droplet size={20} className="text-blue-500" />;
  if (t.includes('internet') || t.includes('fiber')) return <Wifi size={20} className="text-slate-500" />;
  return <DollarSign size={20} />;
};

// ─── Modal helpers ─────────────────────────────────────────────
const ModalBackdrop = ({ children, onClose }) => (
  <div
    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    onClick={e => e.target === e.currentTarget && onClose()}
  >
    {children}
  </div>
);

const AddBillModal = ({ householdId, onClose, onSaved }) => {
  const [form, setForm] = useState({ utility_type: 'Electricity', amount: '', due_date: '', period: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      await addBill({ ...form, household_id: householdId, amount: parseFloat(form.amount) });
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">✕</button>
        <h2 className="text-xl font-bold text-slate-800 mb-5">New Bill Entry</h2>
        {err && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{err}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Utility Type', el: (
              <select value={form.utility_type} onChange={e => set('utility_type', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                {UTILITY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            )},
            { label: 'Total Amount (KES)', el: (
              <input type="number" min="1" step="0.01" required placeholder="e.g. 3000"
                value={form.amount} onChange={e => set('amount', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            )},
            { label: 'Period (e.g. March 2026)', el: (
              <input type="text" required placeholder="March 2026"
                value={form.period} onChange={e => set('period', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            )},
            { label: 'Due Date', el: (
              <input type="date" required value={form.due_date} onChange={e => set('due_date', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            )},
          ].map(({ label, el }) => (
            <div key={label}>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{label}</label>
              {el}
            </div>
          ))}
          <button type="submit" disabled={saving}
            className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all">
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Plus size={16} /> Add Bill</>}
          </button>
        </form>
      </div>
    </ModalBackdrop>
  );
};

// ─── Main Dashboard ────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } })();

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const hRes = await ensureHousehold();
      const h = hRes.data;
      setHousehold(h);
      const bRes = await fetchBills(h.id);
      setBills(bRes.data);
      try {
        const pRes = await fetchPredictions(h.id);
        setPrediction(pRes.data);
      } catch (e) {
        console.error('Failed to load predictions', e);
      }
    } catch (e) {
      setError('Could not load data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const totalShare = bills.reduce((s, b) => s + Number(b.user_share || 0), 0);
  const unpaidCount = bills.filter(b => b.status !== 'paid').length;
  const byType = (type) => bills.find(b => b.utility_type.toLowerCase().includes(type.toLowerCase()));

  const electricBill = byType('Electricity') || byType('Electric');
  const waterBill = byType('Water');
  const internetBill = byType('Internet') || byType('Fiber');

  const analyticsData = (() => {
    const map = {};
    bills.forEach(b => {
      const share = Number(b.user_share || 0);
      if (b.status === 'paid') {
         map[b.utility_type] = (map[b.utility_type] || 0) + share;
      }
    });
    return Object.entries(map).map(([name, amount]) => ({ name, amount })).sort((a,b) => b.amount - a.amount);
  })();

  const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];
  const pendingBills = bills.filter(b => b.status !== 'paid').slice(0, 5);
  const initials = (name) => (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-indigo-600">
            <Zap size={24} className="fill-indigo-600" />
            <span className="text-xl font-bold tracking-tight text-slate-900">AI Utility</span>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 text-slate-600 font-medium">
          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl transition-colors">
            <Home size={20} /> Dashboard
          </Link>
          <Link to="/bills" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
            <FileText size={20} /> Bills &amp; Splits
          </Link>
          <Link to="/household" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
            <Users size={20} /> Household
          </Link>
          <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
            <Settings size={20} /> Settings
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{household?.role === 'owner' ? 'Household Owner' : 'Member'}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Household Overview</h1>
            {household && <p className="text-xs text-slate-400 -mt-0.5">{household.name}</p>}
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-indigo-200 transition-all flex items-center gap-1.5"
            >
              <Plus size={16} /> New Bill
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 pb-24 md:p-8">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-28 animate-pulse" />
              ))
            ) : (
              <>
                <MetricCard title="Your Total Share" amount={fmtKES(totalShare)} icon={<DollarSign size={20} />} trend={`${unpaidCount} unpaid`} isIncreasing={unpaidCount > 0} />
                <MetricCard title="Electricity" amount={electricBill ? fmtKES(electricBill.user_share) : 'No bill'} icon={<Zap size={20} className="text-amber-500" />} trend={electricBill?.status || '—'} />
                <MetricCard title="Water" amount={waterBill ? fmtKES(waterBill.user_share) : 'No bill'} icon={<Droplet size={20} className="text-blue-500" />} trend={waterBill?.status || '—'} />
                <MetricCard title="Internet" amount={internetBill ? fmtKES(internetBill.user_share) : 'No bill'} icon={<Wifi size={20} className="text-slate-500" />} trend={internetBill?.status || '—'} />
                <MetricCard title="AI Projected Next Month" amount={prediction ? fmtKES(prediction.total_predicted) : '—'} icon={<Zap size={20} className="text-indigo-500" />} trend={prediction && prediction.predictions.length > 0 ? prediction.predictions[0].trend : 'calculating'} />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Visual Analytics Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-800">Expense Analytics</h2>
                    <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-600 rounded-lg">Verified Paid Shares</span>
                  </div>
                  
                  {loading ? (
                    <div className="h-64 flex items-center justify-center text-slate-400"><Loader2 size={28} className="animate-spin" /></div>
                  ) : analyticsData.length === 0 ? (
                     <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No paid bills yet.</div>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `KES ${val}`} />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value) => [`KES ${value.toLocaleString()}`, 'Amount']}
                          />
                          <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                            {analyticsData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* AI Prediction Breakdown */}
                {prediction && prediction.predictions.length > 0 && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                         <Zap size={20} className="text-indigo-500 fill-indigo-500" /> AI Prediction Breakdown
                      </h2>
                      <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg">Next Month</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {prediction.predictions.map((p, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between group hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 text-slate-500">
                              <DollarSign size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{p.utility_type}</p>
                              <p className="text-xs text-slate-400">Confidence: <span className="font-semibold text-slate-600">{p.confidence}</span></p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-indigo-700">{fmtKES(p.predicted_amount)}</p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              {p.trend === 'increasing' ? <TrendingUp size={12} className="text-red-500" /> : p.trend === 'lowering' ? <TrendingDown size={12} className="text-emerald-500" /> : <Minus size={12} className="text-slate-400" />}
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${p.trend === 'increasing' ? 'text-red-500' : p.trend === 'lowering' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                {p.trend}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            {/* Pending Splits */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
              <h2 className="text-lg font-bold text-slate-800 mb-4">
                Pending Bills
                {unpaidCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">{unpaidCount}</span>
                )}
              </h2>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : pendingBills.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm gap-2 py-8">
                  <span className="text-3xl">🎉</span>
                  All bills are paid!
                </div>
              ) : (
                <div className="space-y-3 flex-1">
                  {pendingBills.map(b => (
                    <SplitItem
                      key={b.id}
                      name={b.utility_type}
                      amount={fmtKES(b.user_share)}
                      date={`Due ${fmtDate(b.due_date)}`}
                      isOverdue={new Date(b.due_date) < new Date()}
                      icon={utilityIcon(b.utility_type)}
                    />
                  ))}
                </div>
              )}
              <Link to="/bills">
                <button className="w-full mt-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-indigo-600 font-semibold rounded-xl text-sm transition-colors border border-slate-200">
                  View All Bills →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {showAddModal && household && (
        <AddBillModal
          householdId={household.id}
          onClose={() => setShowAddModal(false)}
          onSaved={loadData}
        />
      )}
      <MobileNav />
    </div>
  );
};

// ─── Sub-components ────────────────────────────────────────────
const MetricCard = ({ title, amount, icon, trend, isIncreasing }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-200 hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
        {icon}
      </div>
      <div className={`px-2 py-1 flex items-center gap-1 text-xs font-bold rounded-md capitalize
        ${trend === '—' || trend === 'Fixed' ? 'bg-slate-100 text-slate-500' :
          trend === 'paid' ? 'bg-emerald-50 text-emerald-600' :
          isIncreasing ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
        {isIncreasing && <TrendingUp size={12} />}
        {trend}
      </div>
    </div>
    <div>
      <h3 className="text-slate-500 font-medium text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-slate-900 tracking-tight">{amount}</p>
    </div>
  </div>
);

const SplitItem = ({ name, amount, date, isOverdue, icon }) => (
  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors">
    <div className="flex items-center gap-3">
      <div className={`w-1.5 h-8 rounded-full ${isOverdue ? 'bg-red-400' : 'bg-amber-400'}`} />
      <div className="p-1.5 bg-slate-50 rounded-lg">{icon}</div>
      <div>
        <h4 className="font-semibold text-slate-800 text-sm">{name}</h4>
        <p className={`text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>{date}</p>
      </div>
    </div>
    <div className="font-bold text-slate-900 text-sm">{amount}</div>
  </div>
);

export default Dashboard;
