import React, { useState, useEffect } from 'react';
import {
  Home, FileText, Users, Settings, Sparkles, Zap,
  TrendingUp, TrendingDown, Minus, Droplet, Wifi,
  DollarSign, Plus, AlertCircle, Loader2, LogOut, ShieldCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { ensureHousehold, fetchBills, addBill, fetchPredictions, fetchMembers, fetchAiInsights } from '../services/api';
import NotificationBell from '../components/NotificationBell';
import MobileNav from '../components/MobileNav';
import AddBillModal from '../components/AddBillModal';
import UsageInsights from '../components/UsageInsights';

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

// ─── Main Dashboard ────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [insights, setInsights] = useState([]);
  const [chartType, setChartType] = useState('bar');
  const [filterPeriod, setFilterPeriod] = useState('All');
  const [predictionView, setPredictionView] = useState('list'); // 'list', 'bar', or 'line'

  const [user, setUser] = useState(() => { 
    try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } 
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const hRes = await ensureHousehold();
      const h = hRes.data;
      setHousehold(h);
      const bRes = await fetchBills(h.id);
      let fetchedBills = bRes.data;
      // If member (not owner), only show bills they are participating in
      if (h.role !== 'owner') {
        fetchedBills = fetchedBills.filter(b => b.is_participant);
      }
      setBills(fetchedBills);
      try {
        const pRes = await fetchPredictions(h.id);
        setPrediction(pRes.data);
      } catch (e) {
        console.error('Failed to load predictions', e);
      }
      try {
        const { fetchUserProfile } = await import('../services/api');
        const uRes = await fetchUserProfile();
        setUser(uRes.data);
        localStorage.setItem('user', JSON.stringify(uRes.data));
      } catch (e) {
        console.error('Failed to load user profile', e);
      }
      try {
        const iRes = await fetchAiInsights(h.id);
        setInsights(iRes.data);
      } catch (e) {
        console.error('Failed to load insights', e);
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
      const billMonth = b.period || 'Unknown';

      // Filter by period if not 'All'
      if (filterPeriod !== 'All' && billMonth !== filterPeriod) return;

      if (b.status === 'paid') {
        map[b.utility_type] = (map[b.utility_type] || 0) + share;
      }
    });
    return Object.entries(map).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  })();

  const usageTrendData = (() => {
    // Group usage by period (e.g., month)
    const periods = [...new Set(bills.map(b => b.period))].filter(Boolean).reverse();
    return periods.map(p => {
      const data = { period: p };
      bills.filter(b => b.period === p).forEach(b => {
        if (b.consumption) {
          data[b.utility_type.toLowerCase()] = Number(b.consumption);
        }
      });
      return data;
    });
  })();

  const availablePeriods = (() => {
    const months = [...new Set(bills.map(b => b.period))].filter(Boolean);
    return ['All', ...months];
  })();

  const miniChartData = (() => {
    const map = {};
    bills.forEach(b => {
      const p = b.period || 'Unknown';
      map[p] = (map[p] || 0) + Number(b.user_share || 0);
    });
    return Object.entries(map).map(([period, total]) => ({ period, total })).reverse().slice(-6);
  })();

  const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];
  const pendingBills = bills.filter(b => b.status !== 'paid').slice(0, 5);
  const initials = (name) => (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-violet-600">
            <Sparkles size={24} className="text-violet-500 fill-violet-500" />
            <span className="text-xl tracking-tight">
              <span className="font-poppins font-extrabold text-violet-900">Aiva</span>
              <span className="font-poppins font-medium text-violet-500">Pay</span>
            </span>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 text-slate-600 font-medium">
          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 bg-violet-50 text-violet-700 rounded-xl transition-colors">
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
          <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
            <Settings size={20} /> Settings
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
        <header className="py-4 md:h-16 flex flex-wrap md:flex-nowrap items-center justify-between px-4 md:px-8 bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-20 gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Household Overview</h1>
            {household &&
              <p className="text-xs text-slate-400 -mt-0.5">{household.name}</p>}
          </div>
          <div className="flex items-center gap-3 md:gap-4 ml-auto">
            <NotificationBell />
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white text-sm font-semibold rounded-xl shadow-[0_4px_14px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.4)] transition-all flex items-center gap-1.5 transform hover:-translate-y-0.5"
            >
              <Plus size={16} /> New Bill
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-24 md:p-8 relative">
          {/* Soft balance blobs */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-pink-300/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse"></div>
          <div className="absolute bottom-20 right-0 w-[30rem] h-[30rem] bg-violet-300/20 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse delay-1000"></div>

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
                <MetricCard title="AI Projected Next Month" amount={prediction ? fmtKES(prediction.total_predicted) : '—'} icon={<Zap size={20} className="text-violet-500" />} trend={prediction && prediction.predictions.length > 0 ? prediction.predictions[0].trend : 'calculating'} />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* AI Insights Section */}
              {insights.length > 0 && (
                <div className="animate-in slide-in-from-bottom-2 duration-500">
                  <UsageInsights insights={insights} />
                </div>
              )}

              {/* Mini Summary Chart */}
              {miniChartData.length > 0 && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group hover:border-violet-200 transition-all overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => navigate('/reports')} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-600 rounded-lg text-xs font-bold transition-all hover:bg-violet-100">
                       Full Reports <TrendingUp size={14} />
                     </button>
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <TrendingUp size={20} className="text-violet-500" /> Recent Spending Trend
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mb-6">Your total share over the last few periods</p>
                  
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={miniChartData}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '8px' }}
                          formatter={(value) => [fmtKES(value), 'Total Share']}
                          labelStyle={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                      </AreaChart>
                    </ResponsiveContainer>
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
                <button className="w-full mt-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-violet-600 font-semibold rounded-xl text-sm transition-colors border border-slate-200">
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
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-violet-200 hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600 group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
        {icon}
      </div>
      <div className={`px-2 py-1 flex items-center gap-1 text-xs font-bold rounded-full capitalize
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
