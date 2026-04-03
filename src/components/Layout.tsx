import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, PlusCircle, Settings, PieChart, 
  LogOut, Wallet, Bell, Search, User, Menu, X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/add-expense', icon: PlusCircle, label: 'Add Expense' },
    { to: '/budget-setup', icon: Settings, label: 'Budget Setup' },
    { to: '/reports', icon: PieChart, label: 'Reports' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to logout', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200/60 flex-col sticky top-0 h-screen z-40">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-slate-900 p-2.5 rounded-xl shadow-lg shadow-slate-200">
              <Wallet className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight font-display">BudgetMind</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Intelligence System</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 ml-4">Main Menu</p>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-300 group",
                    isActive
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-200 font-semibold"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )
                }
              >
                <item.icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110")} />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-2xl mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.email}</p>
                <p className="text-[10px] text-slate-500">Premium Account</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-400 font-medium">© 2026 BudgetMind AI v2.5</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30 flex items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-4 lg:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Wallet className="text-slate-900 w-6 h-6" />
              <h1 className="text-lg font-bold text-slate-900 font-display">BudgetMind</h1>
            </div>
          </div>

          <div className="hidden md:flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 w-96 group focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search transactions, goals..." 
              className="bg-transparent border-none focus:ring-0 text-sm w-full ml-3 text-slate-600 font-medium"
            />
          </div>

          <div className="flex items-center gap-3 lg:gap-5">
            <button className="relative p-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <button className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-slate-50 transition-all group">
              <span className="text-sm font-bold text-slate-700 hidden sm:block group-hover:text-slate-900">Account</span>
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200 font-bold text-sm">
                <User className="w-5 h-5" />
              </div>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden">
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-2">
                <Wallet className="text-slate-900 w-6 h-6" />
                <h1 className="text-xl font-bold text-slate-900 font-display">BudgetMind</h1>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-900">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-4 px-4 py-4 rounded-2xl transition-all",
                      isActive
                        ? "bg-slate-900 text-white font-bold shadow-lg shadow-slate-200"
                        : "text-slate-500 hover:bg-slate-50"
                    )
                  }
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-base">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <button
              onClick={handleLogout}
              className="absolute bottom-10 left-6 right-6 flex items-center justify-center gap-3 px-4 py-4 text-red-600 bg-red-50 font-bold rounded-2xl transition-all"
            >
              <LogOut className="w-6 h-6" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav (Simplified for Official Look) */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-lg border border-slate-200/60 flex justify-around p-3 rounded-2xl shadow-2xl z-50">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-300",
                isActive ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-400 hover:text-slate-600"
              )
            }
          >
            <item.icon className="w-6 h-6" />
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
