import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import { 
  FileText, Download, Filter, Calendar, Home, Users, Sparkles, 
  Zap, TrendingUp, TrendingDown, DollarSign, Loader2, AlertCircle, 
  ArrowLeft, LayoutDashboard, Settings, LogOut, ChevronDown, CheckCircle, Minus, Droplet, Wifi
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  fetchPersonalReport, fetchHouseholdReport, fetchAiInsights, fetchPredictions,
  getExportUrl, fetchHouseholds 
} from '../services/api';
import NotificationBell from '../components/NotificationBell';
import MobileNav from '../components/MobileNav';
import UsageInsights from '../components/UsageInsights';

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];
const UTILITY_TYPES = ['Electricity', 'Water', 'Internet', 'Rent', 'Gas', 'Other'];

const utilityIcon = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('electric')) return <Zap size={20} className="text-amber-500" />;
  if (t.includes('water')) return <Droplet size={20} className="text-blue-500" />;
  if (t.includes('internet') || t.includes('fiber')) return <Wifi size={20} className="text-slate-500" />;
  return <DollarSign size={20} />;
};

const Reports = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [myHouseholds, setMyHouseholds] = useState([]);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [insights, setInsights] = useState([]);
  const [householdSubTab, setHouseholdSubTab] = useState('usage');
  const [error, setError] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [predictionView, setPredictionView] = useState('list');
  const [chartType, setChartType] = useState('bar');
  const [filterPeriod, setFilterPeriod] = useState('All');

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } })();

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const hRes = await fetchHouseholds();
        setMyHouseholds(hRes.data);
        if (hRes.data.length > 0) setSelectedHouseholdId(hRes.data[0].id);
      } catch (e) {
        console.error('Failed to load households', e);
      }
    };
    loadInitial();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null); // Clear stale data to prevent render crashes
    try {
      let res;
      if (activeTab === 'personal') {
        res = await fetchPersonalReport({ startDate, endDate });
      } else if (selectedHouseholdId) {
        res = await fetchHouseholdReport(selectedHouseholdId, { startDate, endDate });
        // Also load insights for the household
        try {
           const iRes = await fetchAiInsights(selectedHouseholdId);
           setInsights(iRes.data);
        } catch (e) { console.error('Insights load fail', e); }
        try {
           const pRes = await fetchPredictions(selectedHouseholdId);
           setPrediction(pRes.data);
        } catch (e) { console.error('Predictions load fail', e); }
      }
      setReportData(res.data);
    } catch (e) {
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReport(); }, [activeTab, selectedHouseholdId, startDate, endDate]);

  const handleExport = (format) => {
    const url = getExportUrl(activeTab, selectedHouseholdId, startDate, endDate, format);
    window.location.href = url;
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const availablePeriods = (() => {
    const rawBills = activeTab === 'personal' ? (reportData?.history || []) : (reportData?.bills || []);
    const months = [...new Set(rawBills.map(b => b.period))].filter(Boolean);
    return ['All', ...months];
  })();

  const analyticsData = (() => {
    const map = {};
    const rawBills = activeTab === 'personal' ? (reportData?.history || []) : (reportData?.bills || []);
    rawBills.forEach(b => {
      const amt = Number(b.amount || 0);
      const billMonth = b.period || 'Unknown';
      if (filterPeriod !== 'All' && billMonth !== filterPeriod) return;
      if (b.status === 'paid' || b.share_status === 'paid') {
        map[b.utility_type] = (map[b.utility_type] || 0) + amt;
      }
    });
    return Object.entries(map).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  })();

  const initials = (name) => (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

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
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link to="/bills" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
            <FileText size={20} /> Bills &amp; Splits
          </Link>
          <Link to="/household" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
            <Users size={20} /> Household
          </Link>
          <Link to="/reports" className="flex items-center gap-3 px-3 py-2.5 bg-violet-50 text-violet-700 rounded-xl transition-colors">
            <TrendingUp size={20} /> Reports
          </Link>
          <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
            <Settings size={20} /> Settings
          </Link>
          {user.role === 'admin' && (
            <Link to="/admin" className="flex items-center gap-3 px-3 py-2.5 text-violet-500 hover:bg-violet-50 hover:text-violet-700 rounded-xl transition-colors mt-4 border border-violet-100 bg-violet-50/50">
              <Sparkles size={20} /> Admin Panel
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
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Financial Reports</h1>
            <p className="text-xs text-slate-400 -mt-0.5">Insights and analytics for your spending</p>
          </div>
          <div className="flex items-center gap-3 md:gap-4 ml-auto">
             <NotificationBell />
             <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveTab('personal')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'personal' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Personal
                </button>
                <button 
                  onClick={() => setActiveTab('household')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'household' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Household
                </button>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-3 animate-shake">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {/* Filters Bar */}
          <div className="mb-8 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-4 shadow-sm">
             <div className="flex items-center gap-2">
                <Filter size={16} className="text-slate-400" />
                <span className="text-sm font-bold text-slate-700">Filters:</span>
             </div>

             {activeTab === 'household' && (
               <div className="relative">
                  <select 
                    value={selectedHouseholdId}
                    onChange={(e) => setSelectedHouseholdId(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  >
                    {myHouseholds.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
               </div>
             )}

             <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20" 
                />
                <span className="text-slate-400">to</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20" 
                />
             </div>

             <div className="flex items-center gap-2 ml-auto">
                <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10">
                   <Download size={14} /> PDF
                </button>
                <button onClick={() => handleExport('csv')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors">
                   <FileText size={14} /> CSV
                </button>
             </div>
          </div>

          {loading ? (
             <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-4">
                <Loader2 size={40} className="animate-spin text-violet-500" />
                <p className="font-semibold animate-pulse">Compiling financial data...</p>
             </div>
          ) : reportData ? (
             <div className="space-y-8 animate-in fade-in duration-500">
                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {activeTab === 'personal' ? (
                      <>
                        <SummaryCard title="Total Paid" value={fmtKES(reportData?.summary?.totalPaid)} icon={<CheckCircle size={20} className="text-emerald-500" />} />
                        <SummaryCard title="Pending Payments" value={fmtKES(reportData?.summary?.totalPending)} icon={<AlertCircle size={20} className="text-amber-500" />} />
                        <SummaryCard title="Bills Participated" value={reportData?.summary?.totalBillsParticipated || 0} icon={<FileText size={20} className="text-blue-500" />} />
                      </>
                    ) : (
                      <>
                        <SummaryCard title="Household Total" value={fmtKES(reportData?.summary?.totalAmount)} icon={<DollarSign size={20} className="text-violet-500" />} />
                        <SummaryCard title="Paid Amount" value={fmtKES(reportData?.summary?.paidAmount)} icon={<CheckCircle size={20} className="text-emerald-500" />} />
                        <SummaryCard title="Collection Rate" value={`${reportData?.summary?.paidRatio || 0}%`} icon={<TrendingUp size={20} className="text-blue-500" />} />
                      </>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   {/* Charts Section */}
                   <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
                         <div>
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                              {activeTab === 'personal' ? 'Contribution Trends' : 'Household Analytics'}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                               {activeTab === 'personal' ? 'Spending over time' : 'Usage & Distribution'}
                            </p>
                         </div>
                         {activeTab === 'household' && (
                            <div className="flex bg-slate-50 p-1 rounded-lg">
                               <button 
                                 onClick={() => setHouseholdSubTab('usage')}
                                 className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${householdSubTab === 'usage' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400'}`}
                               >
                                 Usage
                               </button>
                               <button 
                                 onClick={() => setHouseholdSubTab('financial')}
                                 className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${householdSubTab === 'financial' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400'}`}
                               >
                                 Financial
                               </button>
                            </div>
                         )}
                      </div>
                      <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            {activeTab === 'personal' ? (
                              <LineChart data={reportData?.trends || []}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                 <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                 <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                 <Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                              </LineChart>
                            ) : householdSubTab === 'usage' ? (
                               <AreaChart data={reportData?.consumptionTrends || []}>
                                  <defs>
                                     <linearGradient id="colorElec" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                     </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                  <Tooltip 
                                     contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                  />
                                  {UTILITY_TYPES.map((type, idx) => (
                                     <Area 
                                        key={type}
                                        type="monotone" 
                                        dataKey={type.toLowerCase()} 
                                        stroke={COLORS[idx % COLORS.length]} 
                                        fillOpacity={1} 
                                        fill={`url(#colorElec)`} 
                                        strokeWidth={3}
                                        connectNulls
                                     />
                                  ))}
                               </AreaChart>
                            ) : (
                              <PieChart>
                                 <Pie
                                   data={reportData?.utilityBreakdown || []}
                                   innerRadius={60}
                                   outerRadius={80}
                                   paddingAngle={5}
                                   dataKey="value"
                                 >
                                   {(reportData?.utilityBreakdown || []).map((entry, index) => (
                                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                   ))}
                                 </Pie>
                                 <Tooltip />
                                 <Legend verticalAlign="bottom" height={36}/>
                              </PieChart>
                            )}
                         </ResponsiveContainer>
                      </div>
                   </div>

                   {/* AI Insights & Contributions */}
                   <div className="space-y-8">
                      {activeTab === 'household' && (
                         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Member Contributions</h3>
                            <div className="space-y-4">
                               {activeTab === 'household' && (reportData?.memberContributions || []).map((m, idx) => (
                                 <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs">
                                          {initials(m.name)}
                                       </div>
                                       <div>
                                          <p className="text-sm font-bold text-slate-800">{m.name}</p>
                                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{m.status}</p>
                                       </div>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700">{fmtKES(m.total_contribution)}</p>
                                 </div>
                               ))}
                            </div>
                         </div>
                      )}
                      
                      <div className="animate-in slide-in-from-right-4 duration-700">
                        <UsageInsights insights={insights.length > 0 ? insights : [{ type: 'info', title: 'Spending Analysis', message: 'Your electricity bills have been consistent over the last 3 months. Good job on maintaining a stable consumption!' }]} />
                      </div>
                    </div>

                    {/* Expense Analytics */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mt-8">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                          <h2 className="text-lg font-bold text-slate-800">Expense Analytics</h2>
                          <p className="text-xs text-slate-400 font-medium">Historical breakdown of your paid bills</p>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                          <select
                            value={filterPeriod}
                            onChange={(e) => setFilterPeriod(e.target.value)}
                            className="bg-white px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 border-none outline-none shadow-sm focus:scale-[1.01] transition-all cursor-pointer"
                          >
                            {availablePeriods.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>

                          <div className="h-4 w-[1px] bg-slate-300 mx-1"></div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setChartType('bar')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartType === 'bar' ? 'bg-violet-500 text-white shadow-md' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
                            >
                              Bar
                            </button>
                            <button
                              onClick={() => setChartType('line')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartType === 'line' ? 'bg-violet-500 text-white shadow-md' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
                            >
                              Line
                            </button>
                          </div>
                        </div>
                      </div>

                      {analyticsData.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No paid bills for this period.</div>
                      ) : (
                        <div className="h-64 w-full relative" style={{ minWidth: 0, minHeight: '256px' }}>
                          <ResponsiveContainer width="99%" height="100%">
                            {chartType === 'bar' ? (
                              <BarChart data={analyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `KES ${val}`} />
                                <Tooltip
                                  cursor={{ fill: '#f8fafc' }}
                                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                  formatter={(value) => [`KES ${value.toLocaleString()}`, 'Amount']}
                                />
                                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                                  {analyticsData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            ) : (
                              <LineChart data={analyticsData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `KES ${val}`} />
                                <Tooltip
                                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                  formatter={(value) => [`KES ${value.toLocaleString()}`, 'Amount']}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="amount"
                                  stroke="#8b5cf6"
                                  strokeWidth={3}
                                  dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                                  activeDot={{ r: 6, fill: '#7c3aed', shadow: '0 0 10px rgba(139, 92, 246, 0.5)' }}
                                />
                              </LineChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                 </div>

                {/* AI Prediction Breakdown */}
                {activeTab === 'household' && prediction && prediction.predictions.length > 0 && (
                  <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm overflow-hidden min-h-[16rem]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <Zap size={20} className="text-violet-500 fill-violet-500" /> Advanced AI Predictions
                        </h2>
                        <p className="text-xs text-slate-400 font-medium mt-1">Detailed cost estimates and trends for next month</p>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl w-fit">
                        <button
                          onClick={() => setPredictionView('list')}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${predictionView === 'list' ? 'bg-white text-violet-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          List View
                        </button>
                        <button
                          onClick={() => setPredictionView('bar')}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${predictionView === 'bar' ? 'bg-white text-violet-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Chart
                        </button>
                      </div>
                    </div>

                    {predictionView === 'list' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {prediction.predictions.map((p, idx) => (
                          <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between group hover:border-violet-200 hover:bg-violet-50/30 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 text-slate-500 group-hover:text-violet-600 group-hover:scale-110 transition-all">
                                {utilityIcon(p.utility_type)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm">{p.utility_type}</p>
                                <p className="text-[10px] text-slate-400 font-medium">Confidence: {Math.round(p.confidence * 100)}%</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-violet-700 text-lg">{fmtKES(p.predicted_amount)}</p>
                              <div className="flex items-center justify-end gap-1 mt-0.5">
                                {p.trend === 'increasing' ? <TrendingUp size={12} className="text-red-500" /> : p.trend === 'lowering' ? <TrendingDown size={12} className="text-emerald-500" /> : <Minus size={12} className="text-slate-400" />}
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${p.trend === 'increasing' ? 'text-red-500' : p.trend === 'lowering' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                  {p.trend} trend
                               </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-64 w-full relative" style={{ minWidth: 0, minHeight: '256px' }}>
                        <ResponsiveContainer width="99%" height="100%">
                          <BarChart data={prediction.predictions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="utility_type" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `KES ${val}`} />
                            <Tooltip
                              cursor={{ fill: '#f8fafc' }}
                              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                              formatter={(value) => [`KES ${value.toLocaleString()}`, 'Projected']}
                            />
                            <Bar dataKey="predicted_amount" radius={[8, 8, 0, 0]}>
                              {prediction.predictions.map((entry, index) => (
                                <Cell key={`cell-p-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}

                {/* Detailed Table */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                   <div className="p-6 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Detailed History</h3>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-600">
                         <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase">
                            <tr>
                               <th className="px-6 py-4">Utility</th>
                               <th className="px-6 py-4">Period</th>
                               <th className="px-6 py-4">Amount</th>
                               <th className="px-6 py-4">Status</th>
                               <th className="px-6 py-4 text-right">Due Date</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            {(activeTab === 'personal' ? (reportData.history || []) : (reportData.bills || [])).map((r, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                 <td className="px-6 py-4 font-bold text-slate-800">{r.utility_type}</td>
                                 <td className="px-6 py-4 text-slate-500 font-medium">{r.period || '—'}</td>
                                 <td className="px-6 py-4 font-bold text-violet-600">{fmtKES(activeTab === 'personal' ? r.amount : r.amount)}</td>
                                 <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.share_status === 'paid' || r.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                       {activeTab === 'personal' ? r.share_status : r.status}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4 text-right text-slate-400">{fmtDate(r.due_date)}</td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white/50 rounded-3xl border border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                   <FileText size={40} className="opacity-20 text-slate-900" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No report data found</h3>
                <p className="text-sm max-w-xs text-center mt-2">
                   {activeTab === 'personal' 
                     ? "You haven't participated in any shared bills yet. Once you pay your first split, your reports will appear here."
                     : "Please select a household with active bills to view the financial breakdown."}
                </p>
                {activeTab === 'household' && myHouseholds.length === 0 && (
                   <Link to="/household" className="mt-6 px-6 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-900/20 hover:bg-violet-700 transition-all">
                      Create a Household
                   </Link>
                )}
             </div>
          )}
        </div>
      </main>
      <MobileNav />
    </div>
  );
};

const SummaryCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-violet-300 transition-all">
    <div className="p-4 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</p>
    </div>
  </div>
);

export default Reports;
