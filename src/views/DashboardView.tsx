import React from 'react';
import { useCanteenStore, type Expense } from '../store/canteenStore';
import { 
  TrendingUp, TrendingDown, DollarSign, 
  AlertTriangle, ArrowUpRight, Plus, CreditCard, Wallet
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

export const DashboardView: React.FC = () => {
  const { bills, expenses, inventory, setCurrentView, settings } = useCanteenStore();

  const cSymbol = settings.currency;

  // Helper dates
  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthStr = todayStr.substring(0, 7); // YYYY-MM

  // Calc KPI stats
  const todayBills = bills.filter(b => b.date === todayStr);
  const todaySalesVal = todayBills.reduce((acc, b) => acc + b.total, 0);
  const todaySalesCount = todayBills.length;

  const todayExpenses = expenses.filter(e => e.date === todayStr);
  const todayExpensesVal = todayExpenses.reduce((acc, e) => acc + e.amount, 0);

  const netProfitToday = todaySalesVal - todayExpensesVal;

  // Monthly stats
  const monthlyBills = bills.filter(b => b.date.startsWith(thisMonthStr));
  const monthlySalesVal = monthlyBills.reduce((acc, b) => acc + b.total, 0);

  const monthlyExpenses = expenses.filter(e => e.date.startsWith(thisMonthStr));

  // Low stock inventory count
  const lowStockCount = inventory.filter(item => item.quantity <= item.reorderLevel).length;

  // Chart data: Sales vs Expenses for the last 7 days
  const getLast7DaysData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

      const dayBills = bills.filter(b => b.date === dateStr);
      const daySales = dayBills.reduce((acc, b) => acc + b.total, 0);

      const dayExpenses = expenses.filter(e => e.date === dateStr);
      const dayExp = dayExpenses.reduce((acc, e) => acc + e.amount, 0);

      data.push({
        name: dayLabel,
        Sales: Math.round(daySales),
        Expenses: Math.round(dayExp),
        Profit: Math.round(daySales - dayExp)
      });
    }
    return data;
  };

  const chart7DaysData = getLast7DaysData();

  // Chart data: Payment Method distribution (Monthly)
  const getPaymentDistribution = () => {
    const upiTotal = monthlyBills.filter(b => b.paymentMethod === 'UPI').reduce((acc, b) => acc + b.total, 0);
    const cashTotal = monthlyBills.filter(b => b.paymentMethod === 'Cash').reduce((acc, b) => acc + b.total, 0);
    const cardTotal = monthlyBills.filter(b => b.paymentMethod === 'Card').reduce((acc, b) => acc + b.total, 0);
    
    return [
      { name: 'UPI', value: Math.round(upiTotal), color: '#10b981' }, // Emerald
      { name: 'Cash', value: Math.round(cashTotal), color: '#f97316' }, // Orange
      { name: 'Card', value: Math.round(cardTotal), color: '#0ea5e9' }  // Sky
    ].filter(item => item.value > 0);
  };

  const paymentData = getPaymentDistribution();

  // Chart data: Expense Breakdown (Monthly)
  const getExpenseBreakdown = () => {
    const categories: Expense['category'][] = ['Ingredients', 'Gas', 'Electricity', 'Staff Salary', 'Rent', 'Maintenance', 'Miscellaneous'];
    const colors = ['#ef4444', '#f97316', '#eab308', '#10b981', '#3b82f6', '#8b5cf6', '#64748b'];

    return categories.map((cat, idx) => {
      const total = monthlyExpenses.filter(e => e.category === cat).reduce((acc, e) => acc + e.amount, 0);
      return {
        name: cat,
        value: total,
        color: colors[idx]
      };
    }).filter(item => item.value > 0);
  };

  const expenseBreakdownData = getExpenseBreakdown();

  // Top Selling Items (All time / overall from loaded mock bills)
  const getTopSellingItems = () => {
    const counts: { [itemName: string]: { qty: number; revenue: number } } = {};
    bills.forEach(bill => {
      bill.items.forEach(item => {
        if (!counts[item.name]) {
          counts[item.name] = { qty: 0, revenue: 0 };
        }
        counts[item.name].qty += item.quantity;
        counts[item.name].revenue += item.sellingPrice * item.quantity;
      });
    });

    return Object.keys(counts)
      .map(name => ({
        name,
        qty: counts[name].qty,
        revenue: Math.round(counts[name].revenue)
      }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  };

  const topSellingItems = getTopSellingItems();

  // Recent transactions (latest 5 bills)
  const recentBills = bills.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-slate-600 dark:text-slate-400">Welcome back! Here is what's happening at {settings.canteenName} today.</p>
        </div>
        <button 
          onClick={() => setCurrentView('billing')}
          className="flex items-center gap-2 bg-brand-emerald text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all"
        >
          <Plus size={18} />
          New Billing POS
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Today's Sales */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Today's Sales</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {cSymbol}{todaySalesVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/50 text-brand-emerald rounded-xl">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-xs font-semibold text-brand-emerald">
            <TrendingUp size={14} />
            <span>+{todaySalesCount} orders completed today</span>
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Today's Expenses</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {cSymbol}{todayExpensesVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2.5 bg-orange-100 dark:bg-orange-950/50 text-brand-orange rounded-xl">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Logged {todayExpenses.length} expense items</span>
          </div>
        </div>

        {/* Net Profit Today */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Net Profit (Today)</p>
              <h3 className={`text-2xl font-bold mt-1 ${netProfitToday >= 0 ? 'text-brand-emerald' : 'text-red-500'}`}>
                {netProfitToday < 0 ? '-' : ''}{cSymbol}{Math.abs(netProfitToday).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className={`p-2.5 rounded-xl ${netProfitToday >= 0 ? 'bg-emerald-100 dark:bg-emerald-950/50 text-brand-emerald' : 'bg-red-100 dark:bg-red-950/50 text-red-500'}`}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-xs font-semibold">
            <span className={netProfitToday >= 0 ? 'text-brand-emerald' : 'text-red-500'}>
              {netProfitToday >= 0 ? 'Surplus recorded' : 'Deficit recorded'}
            </span>
          </div>
        </div>

        {/* Inventory alerts */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Stock Alerts</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {lowStockCount} Low Items
              </h3>
            </div>
            <div className={`p-2.5 rounded-xl ${lowStockCount > 0 ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-500 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
            {lowStockCount > 0 ? (
              <span className="text-amber-500 cursor-pointer hover:underline" onClick={() => setCurrentView('inventory')}>
                Action required: Refill ingredients
              </span>
            ) : (
              <span>All essential stock healthy</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue vs Expenses */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Revenue vs Expenses (Last 7 Days)</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">Daily breakdown of billing intake vs operating expenses</p>
            </div>
          </div>
          <div className="h-80 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart7DaysData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 12, 
                    border: 'none', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    color: '#0f172a'
                  }} 
                />
                <Bar dataKey="Sales" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
                <Bar dataKey="Expenses" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Items Card */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Top Selling Food Items</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">Popular orders by quantity sold</p>
          <div className="flex-1 flex flex-col justify-center space-y-4">
            {topSellingItems.map((item, index) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className="w-5 h-5 bg-slate-100 dark:bg-slate-800 text-xs flex items-center justify-center rounded-full text-slate-600 dark:text-slate-400">
                      {index + 1}
                    </span>
                    {item.name}
                  </span>
                  <span className="text-slate-950 dark:text-white font-bold">{item.qty} portions</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-brand-emerald h-full rounded-full transition-all duration-1000"
                    style={{ width: `${(item.qty / topSellingItems[0].qty) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {topSellingItems.length === 0 && (
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">No sales data recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Sub Graphs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Payment Channels Monthly */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Payment Method Mix</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">Revenue share by UPI, Cash, and Card this month</p>
          
          <div className="h-60 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${cSymbol}${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2">
            {paymentData.map((item) => (
              <div key={item.name} className="text-center">
                <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{item.name}</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{cSymbol}{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses Distribution */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Operating Expenses Share</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">Monthly cost distribution by category</p>
          
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdownData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {expenseBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${cSymbol}${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Profit Trend (Past 6 months based on mock calculations) */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Financial Trend</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">Revenue monthly trajectory</p>
          
          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { month: 'Jan', Sales: 85000 },
                  { month: 'Feb', Sales: 92000 },
                  { month: 'Mar', Sales: 104000 },
                  { month: 'Apr', Sales: 110000 },
                  { month: 'May', Sales: 125000 },
                  { month: 'Jun', Sales: monthlySalesVal > 0 ? Math.round(monthlySalesVal) : 132000 },
                ]}
              >
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip formatter={(value) => `${cSymbol}${value}`} />
                <Area type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity / Alert Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bills Stream */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Recent Transactions</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">Latest checkout receipts generated at the counter</p>
            </div>
            <button 
              onClick={() => setCurrentView('sales')}
              className="text-xs font-semibold text-brand-emerald flex items-center gap-1 hover:underline"
            >
              View All Bills
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-2">Invoice #</th>
                  <th className="py-3 px-2">Customer</th>
                  <th className="py-3 px-2">Time</th>
                  <th className="py-3 px-2">Payment</th>
                  <th className="py-3 px-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {recentBills.map((bill) => (
                  <tr key={bill.billNumber} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-2 font-bold text-slate-900 dark:text-white">{bill.billNumber}</td>
                    <td className="py-3 px-2 font-medium">
                      {bill.customerName ? (
                        <div>
                          <p className="text-slate-800 dark:text-slate-200">{bill.customerName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{bill.customerPhone}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400 italic">Walk-in Guest</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-slate-500 dark:text-slate-400 text-xs">
                      {bill.date === todayStr ? 'Today' : bill.date} at {bill.time}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${ bill.paymentMethod === 'UPI' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' : bill.paymentMethod === 'Cash' ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-600' : 'bg-sky-50 dark:bg-sky-950/30 text-sky-600' }`}>
                        {bill.paymentMethod === 'UPI' && <Wallet size={12} />}
                        {bill.paymentMethod === 'Cash' && <DollarSign size={12} />}
                        {bill.paymentMethod === 'Card' && <CreditCard size={12} />}
                        {bill.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-slate-900 dark:text-white">
                      {cSymbol}{bill.total}
                    </td>
                  </tr>
                ))}
                {recentBills.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400 italic">No checkout history available today.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Status Widget */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Ingredients Alert</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">Stock depletion warnings</p>

          <div className="flex-1 space-y-3.5">
            {inventory.map((item) => {
              const isLow = item.quantity <= item.reorderLevel;
              return (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Reorder trigger: {item.reorderLevel} {item.unit}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold ${ isLow ? 'bg-red-50 dark:bg-red-950/30 text-red-500 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' }`}>
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
