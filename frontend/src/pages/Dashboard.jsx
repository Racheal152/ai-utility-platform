import React from 'react';
import { Home, FileText, Users, Settings, Bell, Zap, Droplet, Wifi, TrendingUp, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
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
          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl transition-colors">
            <Home size={20} /> Dashboard
          </Link>
          <Link to="/bills" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
            <FileText size={20} /> Bills & Splits
          </Link>
          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
            <Users size={20} /> Household
          </Link>
          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
            <Settings size={20} /> Settings
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
              JD
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">John Doe</p>
              <p className="text-xs text-slate-500">Household Owner</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-10">
          <h1 className="text-xl font-semibold text-slate-800">Household Overview</h1>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-indigo-200 transition-all">
              + New Bill
            </button>
          </div>
        </header>

        {/* Content Scroll */}
        <div className="flex-1 overflow-auto p-8">
          
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard title="Total Month Splitted" amount="KES 4,500" icon={<DollarSign size={20} />} trend="+12.5%" isIncreasing />
            <MetricCard title="Electricity Forecast" amount="KES 2,100" icon={<Zap size={20} className="text-amber-500"/>} trend="-2.1%" />
            <MetricCard title="Water Forecast" amount="KES 800" icon={<Droplet size={20} className="text-blue-500" />} trend="+5.0%" isIncreasing />
            <MetricCard title="Internet Bill" amount="KES 3,000" icon={<Wifi size={20} className="text-slate-500" />} trend="Fixed" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Area */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800">Historical & Predicted Expenses</h2>
                <select className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1.5 font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                  <option>Last 6 Months</option>
                  <option>Last 12 Months</option>
                </select>
              </div>
              <div className="h-64 flex items-end gap-2 mt-4 relative">
                {/* Mock Chart Bars */}
                <div className="w-1/6 bg-indigo-100 rounded-t-md h-32 relative group"><div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded">Oct</div></div>
                <div className="w-1/6 bg-indigo-200 rounded-t-md h-40 relative group"><div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded">Nov</div></div>
                <div className="w-1/6 bg-indigo-300 rounded-t-md h-48 relative group"><div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded">Dec</div></div>
                <div className="w-1/6 bg-indigo-400 rounded-t-md h-36 relative group"><div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded">Jan</div></div>
                <div className="w-1/6 bg-indigo-500 rounded-t-md h-44 relative group"><div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded">Feb</div></div>
                <div className="w-1/6 bg-indigo-600/20 border-2 border-dashed border-indigo-400 rounded-t-md h-52 relative group">
                  <span className="absolute -top-6 w-full text-center text-xs font-bold text-indigo-500">AI Forecast</span>
                </div>
              </div>
            </div>

            {/* Recent Pending Splits */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Pending Splits</h2>
              <div className="space-y-4 flex-1">
                <SplitItem name="Electricity (KPLC)" amount="KES 1,200" date="Due in 2 days" user="You" />
                <SplitItem name="Water Bill" amount="KES 450" date="Overdue by 1 day" user="Alex (Unpaid)" isOverdue />
              </div>
              <button className="w-full mt-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-indigo-600 font-semibold rounded-xl text-sm transition-colors border border-slate-200">
                View All Bills
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const MetricCard = ({ title, amount, icon, trend, isIncreasing }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-200 hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
        {icon}
      </div>
      <div className={`px-2 py-1 flex items-center gap-1 text-xs font-bold rounded-md ${trend === 'Fixed' ? 'bg-slate-100 text-slate-500' : isIncreasing ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
        {trend !== 'Fixed' && <TrendingUp size={12} className={!isIncreasing && 'rotate-180'} />}
        {trend}
      </div>
    </div>
    <div>
      <h3 className="text-slate-500 font-medium text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-slate-900 tracking-tight">{amount}</p>
    </div>
  </div>
);

const SplitItem = ({ name, amount, date, user, isOverdue }) => (
  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors">
    <div className="flex items-center gap-3">
      <div className={`w-2 h-8 rounded-full ${isOverdue ? 'bg-red-400' : 'bg-amber-400'}`}></div>
      <div>
        <h4 className="font-semibold text-slate-800 text-sm">{name}</h4>
        <p className="text-xs text-slate-500">{date} • {user}</p>
      </div>
    </div>
    <div className="font-bold text-slate-900 text-sm">{amount}</div>
  </div>
);

export default Dashboard;
