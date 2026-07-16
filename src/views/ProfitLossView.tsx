import React from 'react';
import { useCanteenStore } from '../store/canteenStore';
import { 
  TrendingUp, ArrowUpRight, ArrowDownRight,
  Percent, Download
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export const ProfitLossView: React.FC = () => {
  const { bills, expenses, settings } = useCanteenStore();
  const cSymbol = settings.currency;

  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthStr = todayStr.substring(0, 7); // YYYY-MM

  // Calculates financial aggregates (All-Time)
  const totalRevenue = bills.reduce((sum, b) => sum + b.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Calculate Cost of Goods Sold (COGS) based on costPrice of food items sold
  const totalCOGS = bills.reduce((sum, bill) => {
    const billCOGS = bill.items.reduce((bSum, item) => bSum + (item.costPrice * item.quantity), 0);
    return sum + billCOGS;
  }, 0);

  const grossProfit = totalRevenue - totalCOGS;
  const netProfit = totalRevenue - totalExpenses;

  // Margin percentages
  const grossMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;
  const netMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  // Current Month calculations
  const monthlyBills = bills.filter(b => b.date.startsWith(thisMonthStr));
  const monthlyRevenue = monthlyBills.reduce((sum, b) => sum + b.total, 0);
  
  const monthlyCOGS = monthlyBills.reduce((sum, bill) => {
    return sum + bill.items.reduce((bSum, item) => bSum + (item.costPrice * item.quantity), 0);
  }, 0);

  const monthlyExpensesList = expenses.filter(e => e.date.startsWith(thisMonthStr));
  const monthlyExpenses = monthlyExpensesList.reduce((sum, e) => sum + e.amount, 0);

  const monthlyGrossProfit = monthlyRevenue - monthlyCOGS;
  const monthlyNetProfit = monthlyRevenue - monthlyExpenses;

  // Formulate Monthly P&L Table Rows
  const expenseCategories = ['Ingredients', 'Gas', 'Electricity', 'Staff Salary', 'Rent', 'Maintenance', 'Miscellaneous'] as const;
  const expenseRowData = expenseCategories.map(cat => {
    const allTime = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
    const thisMonth = monthlyExpensesList.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
    return { name: cat, thisMonth, allTime };
  });

  // Recharts Monthly trend data
  const trendData = [
    { name: 'Rent', value: expenses.filter(e => e.category === 'Rent').reduce((sum, e) => sum + e.amount, 0) },
    { name: 'Ingredients', value: expenses.filter(e => e.category === 'Ingredients').reduce((sum, e) => sum + e.amount, 0) },
    { name: 'Staff Salary', value: expenses.filter(e => e.category === 'Staff Salary').reduce((sum, e) => sum + e.amount, 0) },
    { name: 'Utilities', value: expenses.filter(e => e.category === 'Gas' || e.category === 'Electricity').reduce((sum, e) => sum + e.amount, 0) },
    { name: 'Misc/Maint', value: expenses.filter(e => e.category === 'Maintenance' || e.category === 'Miscellaneous').reduce((sum, e) => sum + e.amount, 0) },
  ];

  const handleDownloadCSV = () => {
    // Generate CSV contents
    const rows = [
      ["Bites & Bytes Canteen - Profit & Loss Statement"],
      ["Date Generated", new Date().toLocaleDateString()],
      [],
      ["Line Item", "Current Month Value", "Cumulative Total Value"],
      ["Gross Revenue (Sales)", monthlyRevenue, totalRevenue],
      ["Cost of Goods Sold (COGS)", monthlyCOGS, totalCOGS],
      ["Gross Profit Margin", monthlyGrossProfit, grossProfit],
      ["Gross Margin %", `${totalRevenue > 0 ? Math.round((monthlyGrossProfit / (monthlyRevenue || 1)) * 100) : 0}%`, `${grossMargin}%`],
      [],
      ["Operating Costs (Expenses)"],
      ...expenseRowData.map(r => [r.name, r.thisMonth, r.allTime]),
      [],
      ["Total Expenses outflow", monthlyExpenses, totalExpenses],
      ["Net Earnings (Profit/Loss)", monthlyNetProfit, netProfit],
      ["Net Margin %", `${monthlyRevenue > 0 ? Math.round((monthlyNetProfit / (monthlyRevenue || 1)) * 100) : 0}%`, `${netMargin}%`]
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(r => r.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Canteen_PL_Statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Profit & Loss</h1>
          <p className="text-slate-600 dark:text-slate-400">Review business performance ratios, operational profit margins, and download income summaries.</p>
        </div>
        <button
          onClick={handleDownloadCSV}
          className="flex items-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-xl font-semibold shadow-lg hover:opacity-90 active:scale-95 transition-all text-sm"
        >
          <Download size={16} />
          Export Statement (.CSV)
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Gross Revenue */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Gross Revenue (This Month)</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {cSymbol}{monthlyRevenue.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/30 text-brand-emerald rounded-xl">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            <span>Cumulative Sales: {cSymbol}{totalRevenue.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* COGS */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Cost of Sales (COGS)</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {cSymbol}{monthlyCOGS.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-2.5 bg-orange-100 dark:bg-orange-950/30 text-brand-orange rounded-xl">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-[10px] text-slate-600 dark:text-slate-400 font-medium">
            <span>Dish cost basis (materials)</span>
          </div>
        </div>

        {/* Gross Margin */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Gross Profit Margin</p>
              <h3 className="text-2xl font-bold text-brand-emerald mt-1">
                {grossMargin}%
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/30 text-brand-emerald rounded-xl">
              <Percent size={18} />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-[10px] text-slate-600 dark:text-slate-400 font-medium">
            <span>Total Gross: {cSymbol}{grossProfit.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Net Profit (This Month)</p>
              <h3 className={`text-2xl font-bold mt-1 ${monthlyNetProfit >= 0 ? 'text-brand-emerald' : 'text-red-500'}`}>
                {monthlyNetProfit < 0 ? '-' : ''}{cSymbol}{Math.abs(monthlyNetProfit).toLocaleString('en-IN')}
              </h3>
            </div>
            <div className={`p-2.5 rounded-xl ${monthlyNetProfit >= 0 ? 'bg-emerald-100 dark:bg-emerald-950/30 text-brand-emerald' : 'bg-red-100 dark:bg-red-950/30 text-red-550'}`}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-[10px] text-slate-600 dark:text-slate-400 font-medium">
            <span>Net Ratio margin: {netMargin}%</span>
          </div>
        </div>
      </div>

      {/* Main Income Statement Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Income Statement Table */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm lg:col-span-2 flex flex-col bg-white dark:bg-slate-900">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Income Statement</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">Detailed operating profitability sheet for the current session</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <tbody>
                {/* Revenue */}
                <tr className="font-bold text-slate-905 dark:text-white border-b border-slate-100 dark:border-slate-800">
                  <td className="py-3">Gross Revenue (Sales)</td>
                  <td className="py-3 text-right">{cSymbol}{monthlyRevenue.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-right text-slate-500 dark:text-slate-400 font-medium">{cSymbol}{totalRevenue.toLocaleString('en-IN')}</td>
                </tr>

                {/* COGS */}
                <tr className="text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <td className="py-3 pl-4">Cost of Goods Sold (COGS)</td>
                  <td className="py-3 text-right text-red-500">-{cSymbol}{monthlyCOGS.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-right text-slate-500 dark:text-slate-400">-{cSymbol}{totalCOGS.toLocaleString('en-IN')}</td>
                </tr>

                {/* Gross Margin */}
                <tr className="font-bold text-slate-900 dark:text-white border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/10">
                  <td className="py-3">Gross Margin Profit</td>
                  <td className="py-3 text-right text-brand-emerald">{cSymbol}{monthlyGrossProfit.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-right text-slate-500 dark:text-slate-400">{cSymbol}{grossProfit.toLocaleString('en-IN')}</td>
                </tr>

                {/* Expenses */}
                <tr className="font-bold text-slate-800 dark:text-slate-300">
                  <td className="py-3 pt-4" colSpan={3}>Operating Expenses</td>
                </tr>
                {expenseRowData.map(row => (
                  <tr key={row.name} className="text-xs text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2.5 pl-4">{row.name}</td>
                    <td className="py-2.5 text-right text-red-500">-{cSymbol}{row.thisMonth.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 text-right text-slate-500 dark:text-slate-400">-{cSymbol}{row.allTime.toLocaleString('en-IN')}</td>
                  </tr>
                ))}

                {/* Total Expense */}
                <tr className="text-slate-800 dark:text-slate-300 border-b-2 border-slate-100 dark:border-slate-800 font-bold bg-slate-50/30">
                  <td className="py-3 pl-2">Total Operating Expenses</td>
                  <td className="py-3 text-right text-red-500">-{cSymbol}{monthlyExpenses.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-right text-slate-500 dark:text-slate-400">-{cSymbol}{totalExpenses.toLocaleString('en-IN')}</td>
                </tr>

                {/* Net Income */}
                <tr className="font-black text-base text-slate-900 dark:text-white pt-4">
                  <td className="py-4">Net Operating Earnings</td>
                  <td className={`py-4 text-right ${monthlyNetProfit >= 0 ? 'text-brand-emerald' : 'text-red-500'}`}>
                    {cSymbol}{monthlyNetProfit.toLocaleString('en-IN')}
                  </td>
                  <td className="py-4 text-right text-slate-500 dark:text-slate-400">
                    {cSymbol}{netProfit.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Operating Costs Chart Card */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Cost Trajectory</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">Visual breakdown of all-time logged expenses</p>
          </div>
          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" style={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis style={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip formatter={(value) => `${cSymbol}${value}`} />
                <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-600 dark:text-slate-400 text-center font-semibold">
            Rent and Ingredients comprise over 70% of outgoing capital.
          </div>
        </div>
      </div>
    </div>
  );
};
