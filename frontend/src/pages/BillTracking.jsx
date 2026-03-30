import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Plus, Search, Filter, Home, Users, Settings, Zap,
  X, Upload, Eye, Trash2, CheckCircle, AlertCircle, Clock,
  ChevronDown, Loader2, ReceiptText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ensureHousehold, fetchBills, addBill, updateBillStatus,
  deleteBill, uploadProof, approveProof
} from '../services/api';
import NotificationBell from '../components/NotificationBell';

// ─── Utility helpers ───────────────────────────────────────────
const fmtKES = (n) => `KES ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

const UTILITY_TYPES = ['Electricity', 'Water', 'Internet', 'Rent', 'Gas', 'Other'];

// ─── Status helpers ───────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    paid: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    partially_paid: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-bold capitalize ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
};

const VerificationBadge = ({ verification, ocrData }) => {
  const isAuto = ocrData?.autoApproved;
  const map = {
    verified: {
      cls: isAuto ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-blue-50 text-blue-600',
      icon: isAuto ? <Zap size={12} className="fill-indigo-600" /> : <CheckCircle size={12} />,
      label: isAuto ? 'AI Verified' : 'Verified'
    },
    pending: { cls: 'bg-amber-100 text-amber-700', icon: <Clock size={12} />, label: 'Pending' },
    rejected: { cls: 'bg-red-100 text-red-600', icon: <AlertCircle size={12} />, label: 'Rejected' },
    none: { cls: 'bg-slate-100 text-slate-500', icon: null, label: 'No Proof' },
  };
  const { cls, icon, label } = map[verification] ?? map.none;
  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 w-fit transition-all uppercase tracking-tight ${cls}`}>
      {icon}
      {label}
    </span>
  );
};

// ─── Add Bill Modal ───────────────────────────────────────────
const AddBillModal = ({ householdId, onClose, onSaved }) => {
  const [form, setForm] = useState({
    utility_type: 'Electricity',
    amount: '',
    due_date: '',
    period: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      await addBill({ ...form, household_id: householdId, amount: parseFloat(form.amount) });
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to add bill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors">
          <X size={20} />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600"><ReceiptText size={20} /></div>
          <h2 className="text-xl font-bold text-slate-800">New Bill Entry</h2>
        </div>

        {err && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{err}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Utility Type</label>
            <select
              value={form.utility_type}
              onChange={e => set('utility_type', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-slate-50"
            >
              {UTILITY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Total Amount (KES)</label>
            <input
              type="number" min="1" step="0.01" required
              value={form.amount} onChange={e => set('amount', e.target.value)}
              placeholder="e.g. 3000"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Period (e.g. March 2026)</label>
            <input
              type="text" required
              value={form.period} onChange={e => set('period', e.target.value)}
              placeholder="March 2026"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Due Date</label>
            <input
              type="date" required
              value={form.due_date} onChange={e => set('due_date', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-slate-50"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200"
          >
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Plus size={16} /> Add Bill Space</>}
          </button>
          <p className="text-[10px] text-center text-slate-400 mt-2">
            The total amount will be split equally among all current household members.
          </p>
        </form>
      </div>
    </ModalBackdrop>
  );
};

// ─── Upload Proof Modal ────────────────────────────────────────
const UploadProofModal = ({ bill, onClose, onUploaded }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef();

  const handleFile = (f) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setSaving(true);
    setErr('');
    try {
      await uploadProof(bill.id, file);
      onUploaded();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors">
          <X size={20} />
        </button>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600"><Upload size={20} /></div>
          <h2 className="text-xl font-bold text-slate-800">Upload Payment Proof</h2>
        </div>
        <p className="text-sm text-slate-500 mb-5 ml-14">
          {bill.utility_type} · {bill.period} · <span className="font-semibold text-slate-700">{fmtKES(bill.amount)}</span>
        </p>

        {err && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{err}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-indigo-200 rounded-2xl p-6 text-center cursor-pointer hover:bg-indigo-50/50 transition-colors"
          >
            {preview ? (
              <img src={preview} alt="preview" className="max-h-40 mx-auto rounded-xl object-contain" />
            ) : (
              <>
                <Upload size={28} className="mx-auto text-indigo-300 mb-3" />
                <p className="text-sm font-medium text-slate-600">Drag & drop or click to select</p>
                <p className="text-xs text-slate-400 mt-1">JPG, PNG, PDF up to 10MB</p>
              </>
            )}
          </div>
          <input
            ref={inputRef} type="file" accept="image/*,.pdf"
            className="hidden"
            onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
          />

          <button
            type="submit"
            disabled={!file || saving}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200"
          >
            {saving ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : <><Upload size={16} /> Submit Proof</>}
          </button>
        </form>
      </div>
    </ModalBackdrop>
  );
};

// ─── Details/Review Panel ─────────────────────────────────────────────
const DetailsSidePanel = ({ bill, user, onClose, onApproved }) => {
  const [approvingProofId, setApprovingProofId] = useState(null);

  const handleApprove = async (proofId) => {
    setApprovingProofId(proofId);
    try {
      await approveProof(proofId);
      onApproved(); // Refresh data
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to approve proof');
    } finally {
      setApprovingProofId(null);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-slate-800 mb-5">Bill Splits & Details</h2>

        <div className="space-y-3 text-sm mb-6">
          {[
            ['Utility Type', bill.utility_type],
            ['Total Amount', fmtKES(bill.amount)],
            ['Your Share', fmtKES(bill.user_share)],
            ['Due Date', fmtDate(bill.due_date)],
            ['Status', <StatusBadge status={bill.status} />]
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="font-medium text-slate-500">{label}</span>
              <span className="text-slate-800 font-semibold">{val}</span>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">Household Splits</h3>
        <div className="space-y-4">
          {bill.shares?.map(share => {
            const isMe = share.user_id === user.id;
            const canVerify = !isMe && share.verification === 'pending';
            
            return (
              <div key={share.user_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      {share.name} {isMe && <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] uppercase">You</span>}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">Share: {fmtKES(share.amount)}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={share.share_status} />
                  </div>
                </div>

                {share.proof_id ? (
                  <div className="mt-2 pt-3 border-t border-slate-200/60">
                    <div className="flex items-center justify-between mb-2">
                       <VerificationBadge verification={share.verification} ocrData={share.ocr_data} />
                       {canVerify && (
                         <button 
                           onClick={() => handleApprove(share.proof_id)}
                           disabled={approvingProofId === share.proof_id}
                           className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-md shadow-emerald-100 flex items-center gap-1"
                         >
                           {approvingProofId === share.proof_id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                           Verify Payment
                         </button>
                       )}
                    </div>
                    {share.proof_image && (
                      <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                        <img src={`http://localhost:5000/${share.proof_image}`} alt="Proof" className="w-full object-contain max-h-48" />
                      </div>
                    )}
                    {share.ocr_data && share.ocr_data.extractedAmount && (
                      <div className="mt-2 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 italic">
                        AI Detected Amount: {fmtKES(share.ocr_data.extractedAmount)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-1 pb-1">
                    <span className="text-xs text-slate-400 italic">No proof uploaded yet</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ModalBackdrop>
  );
};

// ─── Shared modal backdrop ─────────────────────────────────────
const ModalBackdrop = ({ children, onClose }) => (
  <div
    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    onClick={e => e.target === e.currentTarget && onClose()}
  >
    {children}
  </div>
);

// ─── Skeleton row ──────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[...Array(7)].map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-4 bg-slate-100 rounded-md w-3/4" />
      </td>
    ))}
  </tr>
);

// ─── Main Page ─────────────────────────────────────────────────
const BillTracking = () => {
  const [bills, setBills] = useState([]);
  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [proofBill, setProofBill] = useState(null);
  const [detailBill, setDetailBill] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const hRes = await ensureHousehold();
      const h = hRes.data;
      setHousehold(h);
      const bRes = await fetchBills(h.id);
      setBills(bRes.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load data. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bill? This cannot be undone.')) return;
    try {
      await deleteBill(id);
      setBills(prev => prev.filter(b => b.id !== id));
    } catch {
      alert('Failed to delete bill.');
    }
  };

  const handleToggleStatus = async (bill) => {
    const next = bill.status === 'paid' ? 'pending' : 'paid';
    try {
      await updateBillStatus(bill.id, next);
      setBills(prev => prev.map(b => b.id === bill.id ? { ...b, status: next } : b));
    } catch {
      alert('Failed to update status.');
    }
  };

  const filtered = bills.filter(b => {
    const matchSearch = b.utility_type.toLowerCase().includes(search.toLowerCase()) ||
      (b.period || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
  })();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-indigo-600">
            <Zap size={24} className="fill-indigo-600" />
            <span className="text-xl font-bold tracking-tight text-slate-900">AI Utility</span>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 text-slate-600 font-medium">
          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
            <Home size={20} /> Dashboard
          </Link>
          <Link to="/bills" className="flex items-center gap-3 px-3 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl transition-colors">
            <FileText size={20} /> Bills &amp; Splits
          </Link>
          <Link to="/household" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
            <Users size={20} /> Household
          </Link>
          <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
            <Settings size={20} /> Settings
          </Link>
        </nav>
        {/* User footer */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
              {user.name?.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{household?.name || 'No household'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Bill Tracking &amp; Expense Shares</h1>
            {household && (
              <p className="text-xs text-slate-400 -mt-0.5">{household.name}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all flex items-center gap-2"
            >
              <Plus size={18} /> New Bill Entry
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {/* Summary chips */}
          {!loading && bills.length > 0 && (
            <div className="flex gap-3 mb-6 flex-wrap">
              {[
                { label: 'Total Bills', val: bills.length, cls: 'bg-slate-100 text-slate-700' },
                { label: 'Paid', val: bills.filter(b => b.status === 'paid').length, cls: 'bg-emerald-100 text-emerald-700' },
                { label: 'Pending', val: bills.filter(b => b.status !== 'paid').length, cls: 'bg-amber-100 text-amber-700' },
                { label: 'Your Total Share', val: fmtKES(bills.reduce((s, b) => s + Number(b.user_share || 0), 0)), cls: 'bg-indigo-100 text-indigo-700' },
              ].map(({ label, val, cls }) => (
                <div key={label} className={`px-4 py-2 rounded-xl text-sm font-semibold ${cls}`}>
                  {label}: <span className="font-bold">{val}</span>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by utility or period..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none bg-white"
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(v => !v)}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors"
                >
                  <Filter size={16} />
                  {statusFilter === 'all' ? 'Filter' : statusFilter.replace('_', ' ')}
                  <ChevronDown size={14} className={`transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
                </button>
                {showFilterMenu && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                    {['all', 'paid', 'pending', 'partially_paid'].map(s => (
                      <button
                        key={s}
                        onClick={() => { setStatusFilter(s); setShowFilterMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${statusFilter === s ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'}`}
                      >
                        {s === 'all' ? 'All Statuses' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Utility Type</th>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Your Share</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Verification</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                      <ReceiptText size={36} className="mx-auto mb-3 text-slate-200" />
                      <p className="font-medium text-slate-500">
                        {bills.length === 0 ? 'No bills yet. Click "New Bill Entry" to get started.' : 'No bills match your search.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(bill => (
                    <BillRow
                      key={bill.id}
                      bill={bill}
                      household={household}
                      user={user}
                      onUploadProof={() => setProofBill(bill)}
                      onViewDetails={() => setDetailBill(bill)}
                      onDelete={() => handleDelete(bill.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showAddModal && household && (
        <AddBillModal
          householdId={household.id}
          onClose={() => setShowAddModal(false)}
          onSaved={loadData}
        />
      )}
      {proofBill && (
        <UploadProofModal
          bill={proofBill}
          onClose={() => setProofBill(null)}
          onUploaded={loadData}
        />
      )}
      {detailBill && (
        <DetailsSidePanel
          bill={detailBill}
          user={user}
          onClose={() => setDetailBill(null)}
          onApproved={loadData}
        />
      )}
    </div>
  );
};

// ─── Bill Row ──────────────────────────────────────────────────
const BillRow = ({ bill, household, onUploadProof, onViewDetails, onDelete, user }) => {
  const isOwner = household?.role === 'owner';
  // Check if there is ANY pending proof from someone ELSE in the household
  const hasPendingPeerProof = bill.shares?.some(s => s.verification === 'pending' && s.user_id !== user.id);

  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      <td className="px-6 py-4 font-semibold text-slate-900">{bill.utility_type}</td>
      <td className="px-6 py-4 text-slate-500">{bill.period || fmtDate(bill.due_date)}</td>
      <td className="px-6 py-4 font-medium text-slate-800">{fmtKES(bill.amount)}</td>
      <td className="px-6 py-4 font-bold text-indigo-600">{fmtKES(bill.user_share)}</td>
      <td className="px-6 py-4">
        <StatusBadge status={bill.status} />
      </td>
      <td className="px-6 py-4">
        <VerificationBadge verification={bill.verification} ocrData={bill.ocr_data} />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          {hasPendingPeerProof ? (
            <button
              onClick={onViewDetails}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-md shadow-amber-100 flex items-center gap-1"
            >
              <CheckCircle size={12} /> Review
            </button>
          ) : bill.share_status !== 'paid' ? (
            <button
              onClick={onUploadProof}
              className="text-indigo-600 font-semibold hover:underline bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 text-xs transition-colors hover:bg-indigo-100"
            >
              <span className="flex items-center gap-1"><Upload size={12} /> Proof</span>
            </button>
          ) : (
            <button
              onClick={onViewDetails}
              className="text-slate-500 font-medium hover:text-slate-800 text-xs px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
            >
              <Eye size={12} /> Details
            </button>
          )}
          {isOwner && (
            <button
              onClick={onDelete}
              className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default BillTracking;
