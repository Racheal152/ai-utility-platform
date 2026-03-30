import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertCircle, Clock, CheckCircle, TrendingUp, Info } from 'lucide-react';
import { ensureHousehold, fetchBills, fetchPredictions } from '../services/api';
import { Link } from 'react-router-dom';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } })();

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const hRes = await ensureHousehold();
        const hid = hRes.data.id;
        const [bRes, pRes] = await Promise.all([
          fetchBills(hid),
          fetchPredictions(hid).catch(() => ({ data: { predictions: [] } }))
        ]);
        
        const bills = bRes.data;
        const preds = pRes.data.predictions || [];
        const alerts = [];
        const now = new Date();

        // 1. Bill Alerts
        for (let b of bills) {
          const dueDate = new Date(b.due_date);
          const daysDiff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
          
          if (b.share_status !== 'paid') {
            if (daysDiff < 0) {
              alerts.push({ id: `od-${b.id}`, type: 'danger', icon: <AlertCircle size={16} className="text-red-500" />, title: 'Overdue Bill', text: `Your share of ${b.utility_type} (${b.period}) is overdue!`, link: '/bills' });
            } else if (daysDiff <= 3) {
              alerts.push({ id: `ds-${b.id}`, type: 'warning', icon: <Clock size={16} className="text-amber-500" />, title: 'Due Soon', text: `Your ${b.utility_type} share is due in ${daysDiff} days.`, link: '/bills' });
            }
          }

          if (b.shares) {
            for (let s of b.shares) {
              if (s.user_id !== user.id && s.verification === 'pending') {
                alerts.push({ id: `rn-${b.id}-${s.user_id}`, type: 'action', icon: <CheckCircle size={16} className="text-emerald-500" />, title: 'Review Needed', text: `${s.name} uploaded a proof for ${b.utility_type}.`, link: '/bills' });
              }
            }
          }
        }

        // 2. Prediction Alerts
        for (let p of preds) {
          if (p.trend === 'increasing') {
             alerts.push({ id: `pr-${p.utility_type}`, type: 'info', icon: <TrendingUp size={16} className="text-indigo-500" />, title: 'Expense Insight', text: `${p.utility_type} costs are trending upwards.`, link: '/dashboard' });
          }
        }

        setNotifications(alerts);
        
        // Simple unread logic (reset when clicked)
        const lastRead = parseInt(localStorage.getItem('alertsReadCount') || '0', 10);
        if (alerts.length > lastRead) {
           setUnreadCount(alerts.length - lastRead);
        }
      } catch (e) {
        console.error('Failed to load notifications', e);
      }
    };
    loadAlerts();
  }, [user.id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
       setUnreadCount(0);
       localStorage.setItem('alertsReadCount', notifications.length.toString());
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleOpen}
        className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden origin-top-right transition-all">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Notifications</h3>
            <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{notifications.length} New</span>
          </div>
          <div className="max-h-[24rem] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Info size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map(n => (
                  <Link 
                    key={n.id} 
                    to={n.link}
                    onClick={() => setIsOpen(false)}
                    className="p-4 flex gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="mt-0.5 p-1.5 bg-white rounded-full shadow-sm border border-slate-100 h-fit">
                      {n.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{n.text}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
