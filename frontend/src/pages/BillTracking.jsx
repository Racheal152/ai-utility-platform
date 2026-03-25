import React from 'react';
import { FileText, Plus, Search, Filter, Home, Users, Settings, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const BillTracking = () => {
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
            <FileText size={20} /> Bills & Splits
          </Link>
          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
            <Users size={20} /> Household
          </Link>
          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
            <Settings size={20} /> Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 sticky top-0 z-10">
          <h1 className="text-xl font-semibold text-slate-800">Bill Tracking & Expense Shares</h1>
          <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all flex items-center gap-2">
            <Plus size={18} /> New Bill Entry
          </button>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search bills by type or month..." 
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors">
                <Filter size={16} /> Filter
              </button>
            </div>
            
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
                <BillRow type="Electricity (Tokens)" period="March 2026" amount="KES 2,000" share="KES 1,000" status="Paid" verification="Verified" />
                <BillRow type="Water Bill" period="February 2026" amount="KES 800" share="KES 400" status="Unpaid" verification="Pending" />
                <BillRow type="Internet (Fiber)" period="March 2026" amount="KES 3,000" share="KES 1,500" status="Paid" verification="Verified" />
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

const BillRow = ({ type, period, amount, share, status, verification }) => {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4 font-medium text-slate-900">{type}</td>
      <td className="px-6 py-4">{period}</td>
      <td className="px-6 py-4 font-medium text-slate-800">{amount}</td>
      <td className="px-6 py-4 font-bold text-indigo-600">{share}</td>
      <td className="px-6 py-4">
        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2.5 py-1 rounded-md text-xs font-bold flex inline-flex items-center gap-1 ${verification === 'Verified' ? 'bg-blue-50 text-blue-600' : 'bg-amber-100 text-amber-700'}`}>
          {verification}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        {status === 'Unpaid' ? (
          <button className="text-indigo-600 font-semibold hover:underline bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
            Upload Proof
          </button>
        ) : (
          <button className="text-slate-500 font-medium hover:text-slate-800 transition-colors">View Details</button>
        )}
      </td>
    </tr>
  );
};

export default BillTracking;
