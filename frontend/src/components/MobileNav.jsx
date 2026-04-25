import React from 'react';
import { Home, FileText, Users, Settings, LogOut, TrendingUp } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const MobileNav = () => {
  const location = useLocation();
  const path = location.pathname;

  const links = [
    { to: '/dashboard', icon: <Home size={20} />, label: 'Home' },
    { to: '/bills', icon: <FileText size={20} />, label: 'Bills' },
    { to: '/reports', icon: <TrendingUp size={20} />, label: 'Reports' },
    { to: '/household', icon: <Users size={20} />, label: 'Household' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_15px_rgba(0,0,0,0.02)] md:hidden z-50 h-16 flex items-center justify-around px-2 pb-safe">
      {links.map(l => {
        // Handle exact paths and subpaths
        const isActive = path === l.to || (path.startsWith(l.to) && l.to !== '/');
        
        return (
          <Link
            key={l.to}
            to={l.to}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${
              isActive ? 'text-violet-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className={`p-1 rounded-full transition-colors ${isActive ? 'bg-violet-50' : ''}`}>
               {React.cloneElement(l.icon, { 
                  className: `${isActive ? 'fill-violet-100' : ''}`,
                  strokeWidth: isActive ? 2.5 : 2
               })}
            </div>
            <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{l.label}</span>
          </Link>
        )
      })}
      <button
        onClick={(e) => {
          e.preventDefault();
          localStorage.clear();
          window.location.href = '/login';
        }}
        className="flex flex-col items-center justify-center w-full h-full gap-1 transition-all text-red-500 hover:text-red-600"
      >
        <div className="p-1 rounded-full transition-colors">
          <LogOut size={20} strokeWidth={2} />
        </div>
        <span className="text-[10px] font-medium">Log out</span>
      </button>
    </nav>
  );
};

export default MobileNav;
