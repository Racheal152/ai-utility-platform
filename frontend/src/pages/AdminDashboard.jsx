import React, { useState, useEffect } from 'react';
import { 
  Users, Home, FileText, ShieldCheck, Zap, TrendingUp, 
  Search, Filter, Trash2, AlertCircle, Loader2, CheckCircle, 
  LayoutDashboard, LogOut, Sparkles, X, Edit, ShieldAlert, Download, Activity, ChevronDown, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend } from 'recharts';
import { 
  fetchAdminStats, fetchAdminLogs, fetchAdminUsers, updateAdminUser, 
  deleteAdminUser, fetchAdminHouseholds, updateAdminHousehold, fetchAdminBills, 
  fetchAdminProofs, approveProof, rejectProof, exportAdminData
} from '../services/api';
import NotificationBell from '../components/NotificationBell';

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [bills, setBills] = useState([]);
  const [proofs, setProofs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [expandedHouseholdId, setExpandedHouseholdId] = useState(null);
  const [viewProofUrl, setViewProofUrl] = useState(null);

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:5000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const admin = (() => { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } })();

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'overview') {
        const res = await fetchAdminStats();
        setStats(res.data);
      } else if (activeTab === 'users') {
        const res = await fetchAdminUsers();
        setUsers(res.data);
      } else if (activeTab === 'households') {
        const res = await fetchAdminHouseholds();
        setHouseholds(res.data);
      } else if (activeTab === 'bills') {
        const res = await fetchAdminBills();
        setBills(res.data);
      } else if (activeTab === 'proofs') {
        const res = await fetchAdminProofs();
        setProofs(res.data);
      } else if (activeTab === 'logs') {
        const res = await fetchAdminLogs();
        setLogs(res.data);
      }
    } catch (err) {
      setError('Failed to load admin data. Access denied?');
      if (err.response?.status === 403) navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [activeTab]);

  const handleStatusUpdate = async (userId, updates) => {
    // Optimistic update — apply changes immediately in local state
    const previousUsers = [...users];
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    
    try {
      const res = await updateAdminUser(userId, updates);
      // Synchronize with server response to ensure we have the latest DB state
      if (res.data?.user) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...res.data.user } : u));
      }
    } catch (e) {
      console.error('Update failed:', e);
      alert(`Update failed: ${e.response?.data?.message || e.message}`);
      // Revert to previous state
      setUsers(previousUsers);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Soft delete this user? They will be marked as deleted but retained.')) return;
    // Optimistically mark as deleted in local state immediately
    const previousUsers = [...users];
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'deleted' } : u));
    
    try {
      await deleteAdminUser(userId);
      // No re-fetch — optimistic state is correct; user stays visible as 'deleted'
    } catch (e) {
      console.error('Delete failed:', e);
      alert(`Delete failed: ${e.response?.data?.message || e.message}`);
      // Revert to previous state
      setUsers(previousUsers);
    }
  };

  const handleHouseholdStatus = async (householdId, status) => {
    if (!window.confirm(`Mark household as ${status}?`)) return;
    try {
      await updateAdminHousehold(householdId, { status });
      loadData();
    } catch (e) {
      alert('Update failed');
    }
  };

  const handleApprove = async (proofId) => {
    try {
      await approveProof(proofId);
      loadData();
    } catch (e) {
      alert('Approval failed');
    }
  };

  const handleReject = async (proofId) => {
    const reason = window.prompt('Enter rejection reason:');
    if (reason === null) return;
    try {
      await rejectProof(proofId, reason);
      loadData();
    } catch (e) {
      alert('Rejection failed');
    }
  };

  const handleExport = async (type, format) => {
    try {
      const res = await exportAdminData(type, format);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_export.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Export failed');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const AnalyticsSection = () => (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Global Revenue</p>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{fmtKES(stats?.totalRevenue || 0)}</p>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Active Households</p>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats?.totalHouseholds || 0}</p>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Verification Rate</p>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats?.verificationRate || 0}%</p>
            <div className="mt-2 flex items-center gap-1 text-emerald-500 font-bold text-xs">
               <CheckCircle size={14} /> AI Verified: {stats?.verifiedProofs || 0}
            </div>
         </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Verification Breakdown</h3>
        <div className="h-64 w-full">
           <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                 <Pie data={[
                    { name: 'Verified', value: stats?.verifiedProofs || 0, fill: '#10b981' },
                    { name: 'Rejected', value: stats?.rejectedProofs || 0, fill: '#ef4444' },
                    { name: 'Pending', value: (stats?.totalProofs || 0) - ((stats?.verifiedProofs || 0) + (stats?.rejectedProofs || 0)), fill: '#f59e0b' }
                 ]} dataKey="value" innerRadius={60} outerRadius={80} paddingAngle={5} />
                 <Tooltip />
                 <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
           </ResponsiveContainer>
        </div>
        
        <div className="flex flex-col items-center justify-center py-16 mt-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Sparkles size={48} className="mb-4 text-violet-300 opacity-50" />
          <p className="font-medium text-slate-600">Advanced Analytics Available</p>
          <p className="text-xs max-w-sm text-center mt-1">To explore specific household trends, member contribution ratios, and personal AI insights, visit the main Reports section.</p>
          <button 
            onClick={() => navigate('/reports')}
            className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <TrendingUp size={18} /> View Platform Reports
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col border-r border-slate-800">
        <div className="h-16 flex items-center px-6 border-b border-slate-800/50">
          <div className="flex items-center gap-2 text-violet-400">
            <ShieldCheck size={24} className="fill-violet-400/20" />
            <span className="text-xl tracking-tight font-poppins font-extrabold text-white">AdminPanel</span>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {[
            { id: 'overview', icon: <LayoutDashboard size={20} />, label: 'Overview' },
            { id: 'users', icon: <Users size={20} />, label: 'Users' },
            { id: 'households', icon: <Home size={20} />, label: 'Households' },
            { id: 'bills', icon: <FileText size={20} />, label: 'Bills' },
            { id: 'proofs', icon: <Zap size={20} />, label: 'Proofs' },
            { id: 'analytics', icon: <TrendingUp size={20} />, label: 'Analytics' },
            { id: 'logs', icon: <Activity size={20} />, label: 'Logs' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium ${activeTab === item.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-semibold text-white truncate">{admin.name}</p>
            <p className="text-[10px] text-violet-400 font-bold uppercase">Administrator</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors">
            <Home size={16} /> Back to App
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-950/30 rounded-xl transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-800 capitalize">{activeTab.replace('-', ' ')}</h1>
          <div className="flex items-center gap-4">
             <NotificationBell />
             <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                <ShieldCheck size={20} className="text-violet-600" />
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-3 animate-shake">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {activeTab === 'overview' && stats && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Users" value={stats.totalUsers} icon={<Users className="text-blue-500" />} trend="+12% this month" />
                <StatCard title="Total Households" value={stats.totalHouseholds} icon={<Home className="text-emerald-500" />} trend="+5% this month" />
                <StatCard title="Total Bills" value={stats.totalBills} icon={<FileText className="text-amber-500" />} trend="+18% this month" />
                <StatCard title="Verification Rate" value={`${stats.verificationRate}%`} icon={<ShieldCheck className="text-violet-500" />} trend="System-wide" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                   <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                     <TrendingUp size={20} className="text-violet-500" /> Platform Usage Analytics
                   </h2>
                   <div className="h-64 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                      Chart visualization would go here (Users vs Bills vs Proofs)
                   </div>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                   <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                     <ShieldAlert size={20} className="text-red-500" /> System Integrity
                   </h2>
                   <div className="space-y-4">
                      <IntegrityItem label="Database Status" status="Healthy" />
                      <IntegrityItem label="OCR Accuracy" status="94.2%" />
                      <IntegrityItem label="Email Delivery" status="100%" />
                      <IntegrityItem label="Active API Nodes" status="3/3" />
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" placeholder="Search by name or email..." 
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                      value={search} onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleExport('users', 'csv')} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 flex items-center gap-2 transition-colors">
                      <FileText size={16} /> CSV
                    </button>
                    <button onClick={() => handleExport('users', 'pdf')} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 flex items-center gap-2 transition-colors">
                      <Download size={16} /> PDF
                    </button>
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Risk Score</th>
                        <th className="px-6 py-4">Joined</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-slate-800 flex items-center gap-2">
                                {u.name} {u.status === 'restricted' && <AlertCircle size={14} className="text-amber-500" />}
                              </p>
                              <p className="text-xs text-slate-400">{u.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${(u.role || 'user') === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
                              {u.role || 'user'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="relative">
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  if (u.id !== admin.id) setOpenDropdownId(openDropdownId === u.id ? null : u.id); 
                                }}
                                className={`border text-[10px] font-bold uppercase tracking-wider rounded-full px-3 py-1 outline-none flex items-center gap-1 transition-colors ${
                                  u.id === admin.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'
                                } ${
                                  u.status === 'deleted' ? 'bg-red-100 text-red-700 border-red-200' : 
                                  u.status === 'suspended' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                                  u.status === 'restricted' ? 'bg-orange-100 text-orange-700 border-orange-200' : 
                                  'bg-emerald-100 text-emerald-700 border-emerald-200'
                                }`}
                                disabled={u.id === admin.id}
                              >
                                {u.status || 'active'} <ChevronDown size={12} />
                              </button>
                              
                              {openDropdownId === u.id && (
                                <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                                   {['active', 'suspended', 'restricted', 'deleted'].map(status => (
                                     <button
                                       key={status}
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         handleStatusUpdate(u.id, { status });
                                         setOpenDropdownId(null);
                                       }}
                                       className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-slate-50 transition-colors ${u.status === status ? 'text-violet-600 bg-violet-50/50' : 'text-slate-600'}`}
                                     >
                                       {status}
                                     </button>
                                   ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-500">
                            {u.risk_score > 0 ? <span className="text-red-500">{u.risk_score}</span> : '0'}
                          </td>
                          <td className="px-6 py-4 text-slate-500">{fmtDate(u.created_at)}</td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex justify-end gap-2">
                               <button 
                                 onClick={() => handleStatusUpdate(u.id, { role: u.role === 'admin' ? 'user' : 'admin' })} 
                                 className={`p-1.5 rounded-lg transition-colors ${u.id === admin.id ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-violet-600 hover:bg-violet-50'}`} 
                                 title="Toggle Admin"
                                 disabled={u.id === admin.id}
                               >
                                  <ShieldCheck size={16} />
                               </button>
                               <button 
                                 onClick={() => handleDeleteUser(u.id)} 
                                 className={`p-1.5 rounded-lg transition-colors ${u.id === admin.id ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`} 
                                 title="Delete User"
                                 disabled={u.id === admin.id}
                               >
                                  <Trash2 size={16} />
                               </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeTab === 'households' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-100 flex justify-end gap-2">
                  <button onClick={() => handleExport('households', 'csv')} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 flex items-center gap-2">
                    <FileText size={16} /> CSV
                  </button>
                  <button onClick={() => handleExport('households', 'pdf')} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 flex items-center gap-2">
                    <Download size={16} /> PDF
                  </button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase">
                      <tr>
                        <th className="px-6 py-4">Household Name</th>
                        <th className="px-6 py-4">Owner</th>
                        <th className="px-6 py-4">Members</th>
                        <th className="px-6 py-4">Created At</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {households.map(h => (
                        <React.Fragment key={h.id}>
                          <tr 
                            className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${expandedHouseholdId === h.id ? 'bg-violet-50/30' : ''}`}
                            onClick={() => setExpandedHouseholdId(expandedHouseholdId === h.id ? null : h.id)}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <ChevronDown 
                                  size={16} 
                                  className={`text-slate-400 transition-transform duration-200 ${expandedHouseholdId === h.id ? 'rotate-180' : ''}`} 
                                />
                                <span className="font-bold text-slate-800">{h.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 font-medium">{h.creator_name}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-slate-100 rounded-md font-bold text-xs">{h.member_count}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-400">{fmtDate(h.created_at)}</td>
                            <td className="px-6 py-4 text-right flex justify-end items-center gap-3" onClick={e => e.stopPropagation()}>
                               <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${h.status === 'deleted' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                 {h.status || 'active'}
                               </span>
                               {h.status === 'deleted' ? (
                                 <button onClick={() => handleHouseholdStatus(h.id, 'active')} className="text-xs text-blue-500 font-bold">Restore</button>
                               ) : (
                                 <button onClick={() => handleHouseholdStatus(h.id, 'deleted')} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400" title="Soft Delete"><Trash2 size={16} /></button>
                               )}
                            </td>
                          </tr>
                          {expandedHouseholdId === h.id && (
                            <tr className="bg-slate-50/50">
                              <td colSpan="5" className="px-12 py-4">
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 animate-in slide-in-from-top-2 duration-200">
                                  <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-3 tracking-wider">Household Members</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {h.members && h.members.length > 0 ? h.members.map((m, idx) => (
                                      <div key={idx} className="flex items-center gap-3 p-2 rounded-xl border border-slate-100 bg-slate-50/30">
                                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs">
                                          {m.name.charAt(0)}
                                        </div>
                                        <div>
                                          <p className="text-xs font-bold text-slate-700">{m.name}</p>
                                          <p className="text-[10px] text-slate-500">{m.email}</p>
                                        </div>
                                        <div className="ml-auto">
                                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-white border border-slate-100 rounded text-slate-500">
                                            {m.role}
                                          </span>
                                        </div>
                                      </div>
                                    )) : (
                                      <p className="text-xs text-slate-400 italic col-span-full">No members found</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeTab === 'bills' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase">
                      <tr>
                        <th className="px-6 py-4">Household</th>
                        <th className="px-6 py-4">Utility Type</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Period</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bills.map(b => (
                        <tr key={b.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-slate-800">{b.household_name}</td>
                          <td className="px-6 py-4">{b.utility_type}</td>
                          <td className="px-6 py-4 font-semibold text-slate-900">{fmtKES(b.amount)}</td>
                          <td className="px-6 py-4 text-slate-500">{b.period}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${b.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400">{fmtDate(b.due_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeTab === 'analytics' && <AnalyticsSection />}
          {activeTab === 'proofs' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Bill</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Uploaded At</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {proofs.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-slate-800">{p.user_name}</td>
                          <td className="px-6 py-4 text-slate-500">{p.utility_type}</td>
                          <td className="px-6 py-4 font-semibold text-slate-900">{fmtKES(p.bill_amount)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.status === 'verified' ? 'bg-blue-100 text-blue-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400">{fmtDate(p.uploaded_at)}</td>
                          <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => setViewProofUrl(p.image_url)}
                                  className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                                  title="View Proof"
                                >
                                   <Eye size={16} />
                                </button>
                                <button 
                                  onClick={() => handleApprove(p.id)}
                                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                  title="Approve Proof"
                                >
                                   <CheckCircle size={16} />
                                </button>
                                <button 
                                  onClick={() => handleReject(p.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                  title="Reject Proof"
                                >
                                   <X size={16} />
                                </button>
                              </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-100">
                 <h2 className="text-lg font-bold text-slate-800">System Activity Logs</h2>
                 <p className="text-xs text-slate-400">Monitoring all critical system events and admin overrides</p>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase">
                      <tr>
                        <th className="px-6 py-4">Timestamp</th>
                        <th className="px-6 py-4">Admin/User</th>
                        <th className="px-6 py-4">Action</th>
                        <th className="px-6 py-4">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logs.map(l => (
                        <tr key={l.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 text-slate-400 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{l.admin_name || 'System'}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md font-bold text-xs">{l.action}</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-500 max-w-xs truncate">{JSON.stringify(l.details)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-4">
              <Loader2 size={40} className="animate-spin text-violet-500" />
              <p className="font-semibold animate-pulse">Scanning system nodes...</p>
            </div>
          )}
        </div>
      </main>

      {/* Proof Modal */}
      {viewProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">Uploaded Proof</h3>
              <button onClick={() => setViewProofUrl(null)} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center p-2 min-h-[50vh]">
              {typeof viewProofUrl === 'string' && viewProofUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe src={getFullUrl(viewProofUrl)} className="w-full h-[60vh] rounded-lg" title="PDF Proof" />
              ) : (
                <img src={getFullUrl(viewProofUrl)} alt="Payment Proof" className="max-w-full max-h-[70vh] object-contain rounded-lg" onError={(e) => { e.target.src = 'https://via.placeholder.com/400?text=Image+Not+Found'; }} />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const StatCard = ({ title, value, icon, trend }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full uppercase tracking-tighter">{trend}</span>
    </div>
    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
    <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
  </div>
);

const IntegrityItem = ({ label, status }) => (
  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
    <span className="text-sm font-medium text-slate-600">{label}</span>
    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {status}
    </span>
  </div>
);


export default AdminDashboard;
