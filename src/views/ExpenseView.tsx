import React, { useState } from 'react';
import { useCanteenStore, type Expense } from '../store/canteenStore';
import { 
  Plus, Search, Trash2, SlidersHorizontal, Calendar, 
  FileText, Tag, Upload, X, ShieldAlert, Check, Edit2, Target
} from 'lucide-react';

export const ExpenseView: React.FC = () => {
  const { expenses, addExpense, deleteExpense, settings } = useCanteenStore();
  const cSymbol = settings.currency;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [timeFilter, setTimeFilter] = useState<'All' | 'Today' | '7days' | 'month'>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // Budget planning state
  const [showBudgetPanel, setShowBudgetPanel] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgets, setBudgets] = useState<{ [key in Expense['category']]: number }>({
    Ingredients: 35000,
    Gas: 5000,
    Electricity: 8000,
    'Staff Salary': 80000,
    Rent: 20000,
    Maintenance: 6000,
    Miscellaneous: 4000
  });
  const [tempBudgets, setTempBudgets] = useState({ ...budgets });

  // Form states - add expense
  const [formData, setFormData] = useState({
    amount: 0,
    category: 'Ingredients' as Expense['category'],
    date: new Date().toISOString().split('T')[0],
    notes: '',
    receiptName: ''
  });

  const categories: Expense['category'][] = ['Ingredients', 'Gas', 'Electricity', 'Staff Salary', 'Rent', 'Maintenance', 'Miscellaneous'];

  // Filter logic
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.notes.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
    
    let matchesTime = true;
    const today = new Date().toISOString().split('T')[0];
    if (timeFilter === 'Today') {
      matchesTime = e.date === today;
    } else if (timeFilter === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const limitStr = sevenDaysAgo.toISOString().split('T')[0];
      matchesTime = e.date >= limitStr;
    } else if (timeFilter === 'month') {
      const thisMonth = today.substring(0, 7);
      matchesTime = e.date.startsWith(thisMonth);
    }

    return matchesSearch && matchesCategory && matchesTime;
  });

  // Calculate statistics
  const totalExpenseVal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const thisMonthStr = new Date().toISOString().split('T')[0].substring(0, 7);
  const monthlyExpensesList = expenses.filter(e => e.date.startsWith(thisMonthStr));
  const monthlyExpenseVal = monthlyExpensesList.reduce((sum, e) => sum + e.amount, 0);
  
  // Find highest category expense
  const catTotals = categories.reduce((acc, cat) => {
    acc[cat] = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
    return acc;
  }, {} as { [key: string]: number });

  // Calculate monthly spends per category for budget analysis
  const monthlyCatSpends = categories.reduce((acc, cat) => {
    acc[cat] = monthlyExpensesList.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
    return acc;
  }, {} as { [key: string]: number });

  let topCat = 'None';
  let topCatAmount = 0;
  Object.keys(catTotals).forEach(cat => {
    if (catTotals[cat] > topCatAmount) {
      topCatAmount = catTotals[cat];
      topCat = cat;
    }
  });

  const handleOpenAdd = () => {
    setFormData({
      amount: 0,
      category: 'Ingredients',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      receiptName: ''
    });
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0 || !formData.notes.trim()) {
      alert('Please fill out a valid amount and notes.');
      return;
    }
    addExpense(formData);
    setShowAddModal(false);
  };

  const handleDelete = (id: string, notes: string) => {
    if (confirm(`Delete expense "${notes}"? This will also remove the cash-flow ledger entry.`)) {
      deleteExpense(id);
    }
  };

  // Helper file upload simulator
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setFormData({...formData, receiptName: files[0].name});
    }
  };

  const handleSaveBudget = () => {
    setBudgets({ ...tempBudgets });
    setIsEditingBudget(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Expense Tracker</h1>
          <p className="text-slate-600 dark:text-slate-400">Log operation costs, salaries, utility bills, maintenance charges, and keep receipts.</p>
        </div>
        <div className="flex gap-2.5">
          {/* Budget toggle button */}
          <button
            onClick={() => {
              setTempBudgets({ ...budgets });
              setShowBudgetPanel(!showBudgetPanel);
            }}
            className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-semibold shadow-xs text-sm cursor-pointer"
          >
            <Target size={16} className="text-brand-orange" />
            Budget Planning
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-brand-orange text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 hover:bg-orange-600 active:scale-95 transition-all text-sm cursor-pointer"
          >
            <Plus size={18} />
            Record Expense
          </button>
        </div>
      </div>

      {/* COLLAPSIBLE BUDGET PANEL */}
      {showBudgetPanel && (
        <div className="glass-panel p-5 rounded-2xl shadow-md border-2 border-brand-orange/20 bg-orange-50/5 dark:bg-orange-955/5 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-base">
                <Target size={18} className="text-brand-orange" />
                Operational Budget Planner (Monthly)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Track your actual monthly spending limits against customized category target allocations.</p>
            </div>
            
            {isEditingBudget ? (
              <button 
                onClick={handleSaveBudget}
                className="text-xs bg-brand-orange text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
              >
                <Check size={12} /> Save Target Limits
              </button>
            ) : (
              <button 
                onClick={() => setIsEditingBudget(true)}
                className="text-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
              >
                <Edit2 size={12} /> Edit Budgets
              </button>
            )}
          </div>

          {/* Budget bars layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {categories.map(cat => {
              const spent = monthlyCatSpends[cat] || 0;
              const limit = budgets[cat];
              const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
              const isOver = spent > limit;

              return (
                <div key={cat} className="space-y-1.5 p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{cat}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {isEditingBudget ? (
                        <div className="flex items-center gap-1">
                          <span>Budget Limit: {cSymbol}</span>
                          <input
                            type="number"
                            value={tempBudgets[cat]}
                            onChange={(e) => setTempBudgets({ ...tempBudgets, [cat]: Number(e.target.value) })}
                            className="w-18 px-1 py-0.5 text-xs font-bold border rounded dark:bg-slate-800 text-slate-800 dark:text-white"
                          />
                        </div>
                      ) : (
                        <span>Spent: {cSymbol}{spent.toLocaleString()} / Limit: {cSymbol}{limit.toLocaleString()}</span>
                      )}
                    </span>
                  </div>

                  {!isEditingBudget && (
                    <div className="space-y-1">
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${ isOver ? 'bg-red-500' : pct > 80 ? 'bg-brand-orange' : 'bg-brand-emerald' }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className={isOver ? 'text-red-500' : pct > 80 ? 'text-brand-orange' : 'text-brand-emerald'}>
                          {pct}% Allocated
                        </span>
                        {isOver && (
                          <span className="text-red-550 flex items-center gap-0.5">
                            <ShieldAlert size={10} /> Over-Budget by {cSymbol}{spent - limit}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expense KPI Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Monthly Expenses (June/July)</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {cSymbol}{monthlyExpenseVal.toLocaleString('en-IN')}
            </h3>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-3 font-semibold">Updated in real-time</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">All-Time Outflow</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {cSymbol}{totalExpenseVal.toLocaleString('en-IN')}
            </h3>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-3 font-semibold">Total accumulated logs</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Top Spend Category</p>
            <h3 className="text-xl font-bold text-brand-orange mt-1">
              {topCat}
            </h3>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-3 font-semibold">{cSymbol}{topCatAmount.toLocaleString('en-IN')} total spent</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Total Vouchers Logged</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
              {expenses.length} Records
            </h3>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-3 font-semibold">Paper trails archived</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between xl:items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 text-slate-500 dark:text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search expenses by notes, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-all text-sm"
            />
          </div>

          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange"
          >
            <option value="All">All History</option>
            <option value="Today">Today Only</option>
            <option value="7days">Past 7 Days</option>
            <option value="month">This Month</option>
          </select>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
          <SlidersHorizontal size={16} className="text-slate-600 dark:text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Category:</span>
          {['All', ...categories].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${ selectedCategory === cat ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300' }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/10">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description/Notes</th>
                <th className="py-3 px-4">Receipt Attached</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredExpenses.map((exp, index) => (
                <tr key={exp.id} className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/20 ${index % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/20 dark:bg-slate-900/10'}`}>
                  <td className="py-3.5 px-4 font-medium flex items-center gap-2">
                    <Calendar size={14} className="text-slate-500 dark:text-slate-400" />
                    <span>{exp.date}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${ exp.category === 'Ingredients' ? 'bg-red-55 bg-opacity-10 text-red-650' : exp.category === 'Gas' ? 'bg-orange-55 bg-opacity-10 text-orange-600' : exp.category === 'Electricity' ? 'bg-amber-55 bg-opacity-10 text-amber-500' : exp.category === 'Staff Salary' ? 'bg-emerald-55 bg-opacity-10 text-brand-emerald' : exp.category === 'Rent' ? 'bg-blue-55 bg-opacity-10 text-blue-600' : exp.category === 'Maintenance' ? 'bg-purple-55 bg-opacity-10 text-purple-650' : 'bg-slate-100 dark:bg-slate-800 text-slate-500' }`}>
                      <Tag size={10} />
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {exp.notes}
                  </td>
                  <td className="py-3.5 px-4">
                    {exp.receiptName ? (
                      <span className="text-xs text-brand-emerald font-semibold hover:underline flex items-center gap-1 cursor-pointer">
                        <FileText size={13} />
                        {exp.receiptName.substring(0, 15)}...
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 dark:text-slate-400 italic">No File</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                    {cSymbol}{exp.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(exp.id, exp.notes)}
                      className="p-1.5 hover:bg-red-55 hover:bg-opacity-10 text-red-500 rounded-lg transition-all cursor-pointer"
                      title="Delete expense"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400 italic">No expense logs match selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="font-bold text-base text-slate-800 dark:text-white">Record Expense Voucher</span>
              <button onClick={() => setShowAddModal(false)} className="text-slate-405"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Amount ({cSymbol})</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange font-bold text-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Cost Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Voucher Description / Notes</label>
                <textarea
                  required
                  placeholder="e.g. Paid Electricity Bill for June 2026, Fresh Chicken 5kg purchase"
                  value={formData.notes}
                  rows={3}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange resize-none"
                />
              </div>

              {/* simulated receipt upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Attach Bill Receipt (Optional)</label>
                <div className="flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/35 hover:bg-slate-100/50 transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center">
                    <Upload size={20} className="mx-auto text-slate-500 dark:text-slate-400 mb-1" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {formData.receiptName || 'Click to upload receipt photo'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">JPEG, PNG, PDF up to 5MB</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-orange text-white rounded-xl text-sm font-bold hover:bg-orange-655"
                >
                  Log Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
