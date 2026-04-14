import React from 'react';
import { Sparkles, AlertCircle, Info, Zap, Droplet, CheckCircle } from 'lucide-react';

const UsageInsights = ({ insights }) => {
  if (!insights || insights.length === 0) return null;

  const getIcon = (item) => {
    if (item.type === 'success') return <CheckCircle size={20} className="text-emerald-500" />;
    if (item.type === 'warning') return <AlertCircle size={20} className="text-amber-500" />;
    
    // Pick icon based on utility if general info
    const utility = item.utility?.toLowerCase();
    if (utility === 'electricity' || utility === 'gas') return <Zap size={20} className="text-violet-500" />;
    if (utility === 'water') return <Droplet size={20} className="text-blue-500" />;
    return <Sparkles size={20} className="text-violet-500" />;
  };

  const getCardStyle = (type) => {
    switch (type) {
      case 'success': return 'bg-emerald-50/50 border-emerald-200 text-emerald-900 shadow-emerald-100/50';
      case 'warning': return 'bg-amber-50/50 border-amber-200 text-amber-900 shadow-amber-100/50';
      case 'info': return 'bg-violet-50/50 border-violet-200 text-violet-900 shadow-violet-100/50';
      default: return 'bg-slate-50 border-slate-200 text-slate-800 shadow-slate-100';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4 px-1">
        <Sparkles size={18} className="text-violet-600 fill-violet-600/20" />
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">AI Household Insights</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((item, idx) => (
          <div 
            key={idx}
            className={`p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] shadow-sm flex gap-4 ${getCardStyle(item.type)}`}
          >
            <div className={`p-2.5 rounded-xl bg-white/80 shadow-sm h-fit border border-inherit`}>
              {getIcon(item)}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm mb-1">{item.title}</h4>
              <p className="text-xs leading-relaxed opacity-80 font-medium">{item.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsageInsights;
