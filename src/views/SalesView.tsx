import React, { useState } from 'react';
import { useCanteenStore } from '../store/canteenStore';
import { 
  Search, Trash2, TrendingUp, ShoppingBag
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const SalesView: React.FC = () => {
  const { bills, deleteBill, settings } = useCanteenStore();
  const cSymbol = settings.currency;

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | 'month'>('all');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filters bills
  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (bill.customerName && bill.customerName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = bill.date === todayStr;
    } else if (dateFilter === '7days') {
      const limit = new Date();
      limit.setDate(limit.getDate() - 7);
      const limitStr = limit.toISOString().split('T')[0];
      matchesDate = bill.date >= limitStr;
    } else if (dateFilter === 'month') {
      matchesDate = bill.date.startsWith(todayStr.substring(0, 7));
    }
    
    return matchesSearch && matchesDate;
  });

  // Calculate Sales KPI Totals
  const salesToday = bills.filter(b => b.date === todayStr).reduce((sum, b) => sum + b.total, 0);

  const getStartOfWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };
  const weekStart = getStartOfWeek();
  const salesThisWeek = bills.filter(b => b.date >= weekStart).reduce((sum, b) => sum + b.total, 0);
  const salesThisMonth = bills.filter(b => b.date.startsWith(todayStr.substring(0, 7))).reduce((sum, b) => sum + b.total, 0);
  const totalSalesAllTime = bills.reduce((sum, b) => sum + b.total, 0);

  // Category sales distribution
  const getCategorySalesData = () => {
    const categories: { [cat: string]: number } = {};
    bills.forEach(b => {
      b.items.forEach(i => {
        if (!categories[i.category]) categories[i.category] = 0;
        categories[i.category] += i.sellingPrice * i.quantity;
      });
    });
    return Object.keys(categories).map(cat => ({
      name: cat,
      Sales: Math.round(categories[cat])
    }));
  };

  const categorySalesData = getCategorySalesData();

  const handleDeleteBill = (billNumber: string) => {
    if (confirm(`Void Invoice ${billNumber}? This will restock items and remove the transaction entry.`)) {
      deleteBill(billNumber);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Sales Ledger Logs</h1>
        <p className="text-slate-600 dark:text-slate-400">Track and manage customer receipts, payment methods, and check billing totals.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/20 text-brand-emerald rounded-lg"><TrendingUp size={16} /></div>
          <div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold uppercase">Sales (Today)</p>
            <h4 className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{cSymbol}{salesToday.toLocaleString('en-IN')}</h4>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/20 text-brand-emerald rounded-lg"><TrendingUp size={16} /></div>
          <div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold uppercase">Sales (This Week)</p>
            <h4 className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{cSymbol}{salesThisWeek.toLocaleString('en-IN')}</h4>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/20 text-brand-emerald rounded-lg"><TrendingUp size={16} /></div>
          <div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold uppercase">Sales (This Month)</p>
            <h4 className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{cSymbol}{salesThisMonth.toLocaleString('en-IN')}</h4>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg"><ShoppingBag size={16} /></div>
          <div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold uppercase">Gross Sales (All-Time)</p>
            <h4 className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{cSymbol}{totalSalesAllTime.toLocaleString('en-IN')}</h4>
          </div>
        </div>
      </div>

      {/* Split visual section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Sales filter and bills table */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2 text-slate-500 dark:text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search Invoice # or Guest Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-emerald text-xs"
              />
            </div>

            <div className="flex gap-1 bg-slate-50 dark:bg-slate-800 p-0.5 rounded-lg shrink-0">
              {(['all', 'today', '7days', 'month'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setDateFilter(range)}
                  className={`px-3 py-1 rounded text-[10px] font-bold capitalize transition-all ${ dateFilter === range ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500' }`}
                >
                  {range === '7days' ? 'Last 7 Days' : range}
                </button>
              ))}
            </div>
          </div>

          {/* Bills List Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/10">
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Guest Name</th>
                    <th className="py-2.5 px-3 text-right">Items Count</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                    <th className="py-2.5 px-3 text-right">Total Payable</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBills.map((bill, index) => (
                    <tr key={bill.billNumber} className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/20 ${index % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/20 dark:bg-slate-900/10'}`}>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{bill.billNumber}</td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400">{bill.date} at {bill.time}</td>
                      <td className="py-3 px-3 font-medium">
                        {bill.customerName ? bill.customerName : <span className="text-slate-500 dark:text-slate-400 italic">Counter Guest</span>}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold">
                        {bill.items.reduce((s, i) => s + i.quantity, 0)} portions
                      </td>
                      <td className="py-3 px-3 text-right font-medium">
                        {cSymbol}{bill.subtotal}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                        {cSymbol}{bill.total}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDeleteBill(bill.billNumber)}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-550 rounded"
                          title="Void / Cancel Order"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredBills.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400 italic">No sales invoices logged in this date filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Sales by Category chart */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col bg-white dark:bg-slate-900">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Category Sales Share</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">Total revenue compiled from menu category portions</p>

          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categorySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" style={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis style={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip formatter={(value) => `${cSymbol}${value}`} />
                <Bar dataKey="Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
