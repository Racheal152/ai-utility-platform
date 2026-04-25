import React, { useState, useEffect } from 'react';
import { Plus, Settings, Loader2, Sparkles, Zap, Droplet, Wifi, DollarSign } from 'lucide-react';
import { addBill, fetchMembers } from '../services/api';

const UTILITY_TYPES = ['Electricity', 'Water', 'Internet', 'Rent', 'Gas', 'Other'];

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;

const ModalBackdrop = ({ children, onClose }) => (
  <div
    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    onClick={e => e.target === e.currentTarget && onClose()}
  >
    {children}
  </div>
);

const AddBillModal = ({ householdId, onClose, onSaved }) => {
  const [form, setForm] = useState({ 
    utility_type: 'Electricity', 
    amount: '', 
    due_date: '', 
    period: '',
    consumption: '',
    units: ''
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [members, setMembers] = useState([]);
  const [customSplits, setCustomSplits] = useState({}); // userId -> amount
  
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const res = await fetchMembers(householdId);
        setMembers(res.data);
        const initial = {};
        res.data.forEach(m => initial[m.id] = '');
        setCustomSplits(initial);
      } catch (e) { console.error('Failed to load members', e); }
    };
    loadMembers();
  }, [householdId]);

  const totalSplit = Object.values(customSplits).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const diff = parseFloat(form.amount || 0) - totalSplit;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    
    try {
      const payload = { ...form, household_id: householdId, amount: parseFloat(form.amount) };
      
      if (showAdvanced) {
        if (Math.abs(diff) > 0.01) {
          throw new Error(`The splits must sum up to ${fmtKES(form.amount)}. Missing: ${fmtKES(diff)}`);
        }
        payload.splits = Object.entries(customSplits).map(([userId, amt]) => ({
          user_id: parseInt(userId),
          amount: parseFloat(amt)
        }));
      }

      await addBill(payload);
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.message || (e.response?.data?.message) || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7 relative my-8 animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-50 rounded-lg transition-colors">✕</button>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-violet-50 rounded-xl text-violet-600"><Plus size={20} /></div>
          <h2 className="text-xl font-bold text-slate-800">New Bill Entry</h2>
        </div>

        {err && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{err}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Utility Type</label>
              <select value={form.utility_type} onChange={e => set('utility_type', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all font-medium">
                {UTILITY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Total Amount (KES)</label>
              <input type="number" min="1" step="0.01" required placeholder="e.g. 3000"
                value={form.amount} onChange={e => set('amount', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white focus:scale-[1.01] transition-all font-bold text-slate-900" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Period</label>
              <input type="text" required placeholder="March 2026"
                value={form.period} onChange={e => set('period', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all font-medium" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Due Date</label>
              <input type="date" required value={form.due_date} onChange={e => set('due_date', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all font-medium" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Consumption Value (Optional)</label>
              <input type="number" step="0.01" placeholder="e.g. 250"
                value={form.consumption} onChange={e => set('consumption', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all font-medium" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Unit</label>
              <input type="text" placeholder="e.g. kWh, m³, Liters"
                value={form.units} onChange={e => set('units', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all font-medium" />
            </div>
          </div>

          {/* Advanced Split Section */}
          <div className="pt-2">
            <button 
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-bold text-violet-600 flex items-center gap-1.5 hover:text-violet-700 transition-colors uppercase tracking-wider"
            >
              <Settings size={14} /> 
              {showAdvanced ? 'Hide Advanced Split' : 'Advanced Custom Split'}
            </button>

            {showAdvanced && (
              <div className="mt-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-slate-500">SET SHARES PER MEMBER</p>
                  <p className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${Math.abs(diff) < 0.01 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {Math.abs(diff) < 0.01 ? 'Balanced' : `Remaining: ${fmtKES(diff)}`}
                  </p>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto px-1 custom-scrollbar">
                  {members.map((m, idx) => (
                    <div key={m.id} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-violet-200">
                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-[10px]">
                        {(m.name || 'U')[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{m.name}</p>
                      </div>
                      <div className="relative w-32">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">KES</span>
                        <input 
                          type="number"
                          placeholder="0.00"
                          value={customSplits[m.id]}
                          onChange={(e) => setCustomSplits(prev => ({ ...prev, [m.id]: e.target.value }))}
                          className="w-full pl-10 pr-3 py-1.5 text-xs font-bold border border-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 focus:scale-[1.05] transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 disabled:opacity-50 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(139,92,246,0.3)] mt-2">
            {saving ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} className="fill-white" />}
            Save & Notify Roommates
          </button>
        </form>
      </div>
    </ModalBackdrop>
  );
};

export default AddBillModal;
