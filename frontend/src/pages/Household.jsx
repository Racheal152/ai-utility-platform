import React, { useState, useEffect } from 'react';
import { Home, FileText, Users, Settings, LogOut, Zap, UserPlus, Copy, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ensureHousehold, fetchMembers, generateInvite } from '../services/api';
import NotificationBell from '../components/NotificationBell';
import MobileNav from '../components/MobileNav';

const Household = () => {
  const navigate = useNavigate();
  const [household, setHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } })();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const hRes = await ensureHousehold();
        const h = hRes.data;
        setHousehold(h);

        const mRes = await fetchMembers(h.id);
        setMembers(mRes.data);
      } catch (e) {
        setError('Failed to load household data.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleGenerateInvite = async () => {
    setGenerating(true);
    try {
      const res = await generateInvite(household.id);
      setInviteToken(res.data.invite_code);
    } catch (e) {
      alert('Failed to generate invite');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    const link = `${window.location.origin}/register?invite=${inviteToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const initials = (name) => (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const isOwner = household?.role === 'owner';

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
          <Link to="/bills" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
            <FileText size={20} /> Bills &amp; Splits
          </Link>
          <Link to="/household" className="flex items-center gap-3 px-3 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl transition-colors">
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">My Household</h1>
            {household && <p className="text-xs text-slate-400 -mt-0.5">{household.name}</p>}
          </div>
          <div className="flex items-center">
            <NotificationBell />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 pb-24 md:p-8 max-w-5xl mx-auto w-full">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400">
              <Loader2 size={32} className="animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Members List */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Users size={20} className="text-indigo-500" />
                    Household Members ({members.length})
                  </h2>
                </div>
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <tbody className="divide-y divide-slate-100">
                      {members.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50/50">
                          <td className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                {initials(m.name)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 flex items-center gap-2">
                                  {m.name} {m.id === user.id && <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase">You</span>}
                                </p>
                                <p className="text-xs text-slate-500">{m.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${m.role === 'owner' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                              {m.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invite Panel */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
                <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <UserPlus size={20} className="text-emerald-500" />
                  Invite Members
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                  Share an invite link with your roommates or family members so they can join this household and split bills.
                </p>

                {!isOwner ? (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-700">
                    Only the household owner can generate invite links. Ask <b>{members.find(m => m.role === 'owner')?.name}</b> to invite new members.
                  </div>
                ) : (
                  <div>
                    {inviteToken ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
                          <p className="text-xs text-slate-500 mb-1 font-semibold uppercase">Invite Link</p>
                          <p className="text-sm font-mono text-slate-800 break-all pr-8">
                            {window.location.origin}/register?invite={inviteToken}
                          </p>
                          <button
                            onClick={copyToClipboard}
                            className="absolute top-1/2 -translate-y-1/2 right-3 p-2 text-slate-400 hover:text-indigo-600 bg-white rounded-lg shadow-sm border border-slate-200 transition-colors"
                            title="Copy Link"
                          >
                            {copied ? <CheckCircle size={16} className="text-emerald-500" /> : <Copy size={16} />}
                          </button>
                        </div>
                        <button
                          onClick={handleGenerateInvite} disabled={generating}
                          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
                        >
                          {generating ? 'Generating...' : 'Generate New Link'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleGenerateInvite} disabled={generating}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200"
                      >
                        {generating ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                        Create Invite Link
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </main>
      <MobileNav />
    </div>
  );
};

export default Household;
