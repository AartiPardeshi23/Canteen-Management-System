import React, { useState } from 'react';
import { useCanteenStore } from './store/canteenStore';
import { 
  LayoutDashboard, ShoppingCart, Utensils, TrendingDown, Boxes,
  DollarSign, History, Activity, BarChart3, Users, Settings as SettingsIcon,
  Sun, Moon, Menu as MenuIcon, X, Bell, Search, LogOut, Coffee
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Views
import { DashboardView } from './views/DashboardView';
import { BillingView } from './views/BillingView';
import { MenuView } from './views/MenuView';
import { ExpenseView } from './views/ExpenseView';
import { InventoryView } from './views/InventoryView';
import { SalesView } from './views/SalesView';
import { TransactionView } from './views/TransactionView';
import { ProfitLossView } from './views/ProfitLossView';
import { ReportView } from './views/ReportView';
import { EmployeeView } from './views/EmployeeView';
import { SettingsView } from './views/SettingsView';

export default function App() {
  const { currentView, setCurrentView, theme, toggleTheme, settings, inventory, suppliers } = useCanteenStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications calculation
  const lowStock = inventory.filter(item => item.quantity <= item.reorderLevel);
  const outstandingSuppliers = suppliers.filter(s => s.outstandingPayment > 0);
  const notificationCount = lowStock.length + outstandingSuppliers.length;

  // Sidebar navigation options
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'billing', label: 'Billing POS', icon: ShoppingCart },
    { id: 'menu', label: 'Menu List', icon: Utensils },
    { id: 'expenses', label: 'Expenses', icon: TrendingDown },
    { id: 'inventory', label: 'Inventory Stock', icon: Boxes },
    { id: 'sales', label: 'Sales Management', icon: DollarSign },
    { id: 'transactions', label: 'Cash flow Ledger', icon: History },
    { id: 'profit_loss', label: 'Profit & Loss', icon: Activity },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'employee', label: 'Employees', icon: Users },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  // Global command bar search
  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const query = searchQuery.toLowerCase();
    const match = navItems.find(item => item.label.toLowerCase().includes(query));
    if (match) {
      setCurrentView(match.id);
      setSearchQuery('');
    } else {
      alert(`No menu section matches "${searchQuery}". Try "Billing", "Stock", "Sales", etc.`);
    }
  };

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView />;
      case 'billing': return <BillingView />;
      case 'menu': return <MenuView />;
      case 'expenses': return <ExpenseView />;
      case 'inventory': return <InventoryView />;
      case 'sales': return <SalesView />;
      case 'transactions': return <TransactionView />;
      case 'profit_loss': return <ProfitLossView />;
      case 'reports': return <ReportView />;
      case 'employee': return <EmployeeView />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'dark text-white' : 'text-slate-900'}`}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-40 bg-slate-950 text-slate-400 border-r border-slate-800 dark:border-slate-900 transition-all duration-300 flex flex-col justify-between ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800/80 dark:border-slate-900 overflow-hidden">
            <div className="w-9 h-9 bg-brand-emerald text-white rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
              <Coffee size={20} />
            </div>
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-sm uppercase tracking-wider text-white whitespace-nowrap truncate max-w-[170px]"
                title={settings.canteenName}
              >
                {settings.canteenName}
              </motion.div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative group active:scale-98 ${
                    isActive 
                      ? 'text-white bg-brand-emerald shadow-lg shadow-emerald-500/15' 
                      : 'hover:text-white hover:bg-slate-800/60 text-slate-400'
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  {isSidebarOpen ? (
                    <span>{item.label}</span>
                  ) : (
                    <div className="absolute left-20 bg-slate-950 text-white text-xs px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50 border border-slate-800">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/60">
          <button 
            onClick={() => { if(confirm('Exit dashboard?')) alert('Dashboard Logged Out'); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold hover:text-red-500 hover:bg-red-950/20 transition-all ${
              isSidebarOpen ? '' : 'justify-center'
            }`}
          >
            <LogOut size={18} />
            {isSidebarOpen && <span>Logout System</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        isSidebarOpen ? 'pl-64' : 'pl-20'
      }`}>
        
        {/* TOP BAR / HEADER */}
        <header className="h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 shadow-xs">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-emerald/50"
              aria-label="Toggle Sidebar"
            >
              <MenuIcon size={18} />
            </button>

            {/* Fast Nav Command Search */}
            <form onSubmit={handleGlobalSearch} className="relative w-full max-w-xs hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={15} />
              <input
                type="text"
                placeholder="Jump to page... (e.g. POS, menu)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-12 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-2xs">
                  F2
                </kbd>
              </div>
            </form>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-805 hover:shadow-md active:scale-95 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand-emerald/50"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Notifications Alert Popover */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-850 hover:shadow-md active:scale-95 transition-all flex items-center justify-center relative focus:outline-none focus:ring-2 focus:ring-brand-emerald/50"
                aria-label="View Notifications"
              >
                <Bell size={18} />
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-brand-orange text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse border border-white dark:border-slate-900">
                    {notificationCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl p-4 space-y-3 z-50 text-xs"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-extrabold text-slate-800 dark:text-white">Outlet Notifications</span>
                      <button onClick={() => setShowNotifications(false)} className="text-slate-455 hover:text-slate-655 dark:text-slate-400 dark:hover:text-slate-200" aria-label="Close notifications"><X size={14} /></button>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2.5 pr-0.5">
                      {lowStock.map(item => (
                        <div key={item.id} className="p-2 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-950/20 rounded-xl flex justify-between items-center">
                          <div>
                            <p className="font-bold text-red-800 dark:text-red-300">{item.name} Low Stock</p>
                            <p className="text-[9px] text-red-500 mt-0.5">Available: {item.quantity} {item.unit}</p>
                          </div>
                          <button 
                            onClick={() => { setCurrentView('inventory'); setShowNotifications(false); }}
                            className="text-[9px] font-bold text-red-600 dark:text-red-400 hover:underline"
                          >
                            Deduce
                          </button>
                        </div>
                      ))}

                      {outstandingSuppliers.map(s => (
                        <div key={s.id} className="p-2 bg-amber-50/50 dark:bg-amber-955/10 border border-amber-100 dark:border-amber-955/20 rounded-xl flex justify-between items-center">
                          <div>
                            <p className="font-bold text-amber-800 dark:text-amber-300">Supplier Dues: {s.name}</p>
                            <p className="text-[9px] text-amber-600 mt-0.5">Pending: {settings.currency}{s.outstandingPayment}</p>
                          </div>
                          <button 
                            onClick={() => { setCurrentView('inventory'); setShowNotifications(false); }}
                            className="text-[9px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                          >
                            Pay
                          </button>
                        </div>
                      ))}

                      {notificationCount === 0 && (
                        <p className="text-center py-6 text-slate-400 italic">No warnings active in the system.</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar Card */}
            <div className="flex items-center gap-2 border-l pl-3 border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-extrabold text-xs shadow-xs">
                AD
              </div>
              <div className="hidden md:block text-left text-xs leading-tight">
                <p className="font-bold text-slate-800 dark:text-white">Admin Owner</p>
                <p className="text-slate-500 font-semibold text-[9px] mt-0.5">Counter 01</p>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN VIEW CONTENT CONTAINER */}
        <main className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.18 }}
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
