import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertCircle, Clock, CheckCircle, TrendingUp, Info, X, Loader2, UserMinus, ShieldCheck } from 'lucide-react';
import { fetchNotifications, markNotificationRead, clearNotifications } from '../services/api';
import { Link } from 'react-router-dom';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const dropdownRef = useRef(null);

  const loadNotifications = async (historyState = showHistory) => {
    setLoading(true);
    try {
      const res = await fetchNotifications(historyState);
      setNotifications(res.data);
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll every 60 seconds (always poll current history state)
    const interval = setInterval(() => loadNotifications(showHistory), 60000);
    return () => clearInterval(interval);
  }, [showHistory]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearNotifications();
      setNotifications([]);
    } catch (e) {
      console.error('Failed to clear notifications', e);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'bill_added': return <Clock size={16} className="text-amber-500" />;
      case 'payment_verified': return <CheckCircle size={16} className="text-emerald-500" />;
      case 'payment_pending': return <AlertCircle size={16} className="text-amber-500" />;
      case 'deadline_approaching': return <AlertCircle size={16} className="text-rose-500" />;
      case 'review_required': return <Clock size={16} className="text-violet-600" />;
      case 'user_added': return <TrendingUp size={16} className="text-violet-500" />;
      case 'bill_deleted': return <X size={16} className="text-red-500" />;
      case 'bill_updated': return <Info size={16} className="text-blue-500" />;
      case 'member_removed': return <UserMinus size={16} className="text-red-500" />;
      case 'ownership_transfer': return <ShieldCheck size={16} className="text-violet-500" />;
      case 'danger': return <AlertCircle size={16} className="text-red-500" />;
      default: return <Info size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all relative group"
      >
        <Bell size={20} className="group-hover:rotate-12 transition-transform" />
        {notifications.length > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-violet-600 rounded-full border-2 border-white shadow-[0_0_10px_rgba(139,92,246,0.5)]"></span>
        )}
      </button>

      {isOpen && (
        <div className="fixed top-16 left-4 right-4 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-4 sm:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 z-50 overflow-hidden sm:origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Notifications</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Persistent Updates</p>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-[10px] font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded-lg transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="max-h-[28rem] overflow-y-auto custom-scrollbar">
            {loading && notifications.length === 0 ? (
              <div className="p-12 flex justify-center"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <CheckCircle size={32} className="opacity-20" />
                </div>
                <p className="text-sm font-bold text-slate-800">No New Alerts</p>
                <p className="text-xs mt-1">You're all caught up with your splits!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {(showHistory ? notifications : notifications.slice(0, 3)).map(n => (
                  <div
                    key={n.id}
                    className="p-4 flex gap-4 hover:bg-slate-50 transition-colors group cursor-pointer relative"
                  >
                    <div className="flex-shrink-0 mt-1 p-2 bg-white rounded-xl shadow-sm border border-slate-100 h-fit">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 pr-6">
                      <p className="text-sm font-bold text-slate-800 leading-snug">{n.message}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1 flex items-center gap-1.5">
                        <Clock size={10} />
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleMarkRead(n.id, e)}
                      className="absolute top-4 right-4 p-1 text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                      title="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
            >
              {showHistory ? 'Hide Notification History' : 'View Notification History'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
