import React, { useState } from 'react';
import { useCanteenStore, type Transaction } from '../store/canteenStore';
import { 
  ArrowUpRight, ArrowDownRight, Search, Calendar, 
  Coins, CreditCard, Wallet, Landmark, Check, AlertTriangle, ShieldCheck, HelpCircle
} from 'lucide-react';

export const TransactionView: React.FC = () => {
  const { transactions, openingBalance, setOpeningBalance, settings, addTransaction } = useCanteenStore();
  const cSymbol = settings.currency;

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'cash_in' | 'cash_out'>('All');
  const [methodFilter, setMethodFilter] = useState<'All' | Transaction['paymentMethod']>('All');
  
  // Opening Balance state edit
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [tempBalance, setTempBalance] = useState(openingBalance);

  // Reconciliation state
  const [showReconcile, setShowReconcile] = useState(false);
  const [countedCashInput, setCountedCashInput] = useState<number | ''>('');
  const [reconciliationNotes, setReconciliationNotes] = useState('');
  const [reconcileSuccess, setReconcileSuccess] = useState(false);

  // Filters
  const filteredTx = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || t.type === typeFilter;
    const matchesMethod = methodFilter === 'All' || t.paymentMethod === methodFilter;
    return matchesSearch && matchesType && matchesMethod;
  });

  // Calculate totals
  const totalIn = transactions.filter(t => t.type === 'cash_in').reduce((sum, t) => sum + t.amount, 0);
  const totalOut = transactions.filter(t => t.type === 'cash_out').reduce((sum, t) => sum + t.amount, 0);

  // Drawer Cash on Hand calculation (Opening balance + Cash In (Cash type) - Cash Out (Cash type))
  const cashInDrawerTotal = transactions
    .filter(t => t.type === 'cash_in' && t.paymentMethod === 'Cash')
    .reduce((sum, t) => sum + t.amount, 0);

  const cashOutDrawerTotal = transactions
    .filter(t => t.type === 'cash_out' && t.paymentMethod === 'Cash')
    .reduce((sum, t) => sum + t.amount, 0);

  const expectedDrawerCash = openingBalance + cashInDrawerTotal - cashOutDrawerTotal;

  // Payments totals by channel
  const upiTotal = transactions.filter(t => t.paymentMethod === 'UPI').reduce((sum, t) => sum + t.amount, 0);
  const cardTotal = transactions.filter(t => t.paymentMethod === 'Card').reduce((sum, t) => sum + t.amount, 0);
  const bankTotal = transactions.filter(t => t.paymentMethod === 'Bank').reduce((sum, t) => sum + t.amount, 0);

  const handleSaveBalance = () => {
    setOpeningBalance(tempBalance);
    setIsEditingBalance(false);
  };

  const handleReconcileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (countedCashInput === '') return;

    const countedCash = Number(countedCashInput);
    const variance = countedCash - expectedDrawerCash;

    if (variance !== 0) {
      // Log discrepancy adjustment in transactions
      addTransaction({
        type: variance > 0 ? 'cash_in' : 'cash_out',
        amount: Math.abs(variance),
        category: 'Adjustment',
        paymentMethod: 'Cash',
        date: new Date().toISOString().split('T')[0],
        description: `Cash Reconciliation Audit: ${variance > 0 ? 'Drawer Cash Surplus' : 'Drawer Cash Shortage'} - ${reconciliationNotes || 'No description notes'}`
      });
    }

    setReconcileSuccess(true);
    setCountedCashInput('');
    setReconciliationNotes('');
    setTimeout(() => {
      setReconcileSuccess(false);
      setShowReconcile(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Transaction Ledger</h1>
          <p className="text-slate-600 dark:text-slate-400">Archived cash flow history, payment channel audits, and opening/closing register logs.</p>
        </div>

        <div className="flex gap-2.5">
          {/* Reconcile trigger */}
          <button
            onClick={() => setShowReconcile(!showReconcile)}
            className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-semibold shadow-xs text-sm cursor-pointer"
          >
            <ShieldCheck size={18} className="text-brand-emerald" />
            Drawer Cash Reconciliation
          </button>

          {/* Drawer cash adjustment */}
          <div className="glass-panel px-4 py-2.5 rounded-xl flex items-center gap-3">
            <Coins className="text-amber-500" size={18} />
            <div>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold uppercase">Register Opening Cash</p>
              {isEditingBalance ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{cSymbol}</span>
                  <input
                    type="number"
                    value={tempBalance}
                    onChange={(e) => setTempBalance(Number(e.target.value))}
                    className="w-20 px-1 py-0.5 text-xs font-bold border rounded dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button onClick={handleSaveBalance} className="p-1 bg-brand-emerald text-white rounded cursor-pointer"><Check size={12} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{cSymbol}{openingBalance}</span>
                  <button 
                    onClick={() => { setTempBalance(openingBalance); setIsEditingBalance(true); }}
                    className="text-[10px] text-brand-emerald font-bold hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* COLLAPSIBLE CASH RECONCILIATION PANEL */}
      {showReconcile && (
        <form onSubmit={handleReconcileSubmit} className="glass-panel p-5 rounded-2xl shadow-md border-2 border-brand-emerald/20 bg-emerald-50/5 dark:bg-emerald-955/5 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-base">
                <Coins size={18} className="text-brand-emerald" />
                Register Cash Reconciliation POS Audit
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Physically count the cash drawer and log discrepancies.</p>
            </div>
            <button 
              type="button" 
              onClick={() => setShowReconcile(false)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border flex flex-col justify-center">
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold uppercase">Expected Drawer Cash</span>
              <span className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {cSymbol}{expectedDrawerCash.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Counted Physical Cash ({cSymbol})</label>
              <input
                type="number"
                min="0"
                required
                placeholder="Count drawer cash amount"
                value={countedCashInput}
                onChange={(e) => setCountedCashInput(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-1 focus:ring-brand-emerald font-bold"
              />
            </div>

            <div className="p-3 rounded-xl border flex flex-col justify-center bg-slate-50 dark:bg-slate-800">
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold uppercase">Calculated Discrepancy</span>
              {countedCashInput !== '' ? (
                (() => {
                  const variance = Number(countedCashInput) - expectedDrawerCash;
                  return (
                    <div className="flex items-center gap-1.5 mt-1">
                      {variance === 0 ? (
                        <span className="text-xs font-bold text-brand-emerald flex items-center gap-1">
                          <Check size={14} /> Perfect Match (Balanced)
                        </span>
                      ) : (
                        <span className={`text-xs font-bold flex items-center gap-1 ${variance > 0 ? 'text-blue-500' : 'text-red-500'}`}>
                          <AlertTriangle size={14} /> 
                          {variance > 0 ? `Surplus of ${cSymbol}${Math.abs(variance)}` : `Shortage of ${cSymbol}${Math.abs(variance)}`}
                        </span>
                      )}
                    </div>
                  );
                })()
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <HelpCircle size={14} /> Enter counted cash
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Audit Notes / Comments</label>
            <input
              type="text"
              placeholder="e.g. Matched register closing sheets perfectly, or $5 short due to change shortage"
              value={reconciliationNotes}
              onChange={(e) => setReconciliationNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-1 focus:ring-brand-emerald"
            />
          </div>

          {reconcileSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl text-xs text-brand-emerald font-semibold flex items-center gap-1.5">
              <Check size={14} />
              Cash Drawer reconciled and discrepancy logged to transactions ledger successfully!
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-brand-emerald text-white rounded-xl text-xs font-bold hover:bg-emerald-650 shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              Reconcile Register Dues
            </button>
          </div>
        </form>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Cash in hand Drawer */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col justify-between border-l-4 border-l-amber-500">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Drawer Cash on Hand</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {cSymbol}{expectedDrawerCash.toLocaleString('en-IN')}
            </h3>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-3 font-semibold">Opening + Cash In - Cash Out (Cash channel)</p>
        </div>

        {/* UPI flow */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">UPI Payments Received</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {cSymbol}{upiTotal.toLocaleString('en-IN')}
            </h3>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-3 font-semibold">UPI transaction totals</p>
        </div>

        {/* Card flow */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col justify-between border-l-4 border-l-blue-500">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Card POS Settlements</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {cSymbol}{cardTotal.toLocaleString('en-IN')}
            </h3>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-3 font-semibold">Card Swipe terminal records</p>
        </div>

        {/* Bank ledger flow */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col justify-between border-l-4 border-l-slate-700">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Bank Direct Transfers</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {cSymbol}{bankTotal.toLocaleString('en-IN')}
            </h3>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-3 font-semibold">Rent, Salaries, Supplier payouts</p>
        </div>
      </div>

      {/* Ledger Totals summary */}
      <div className="grid grid-cols-2 gap-5">
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl flex justify-between items-center">
          <div>
            <span className="text-xs text-slate-600 dark:text-slate-400">Total Money In (Revenue/Sales)</span>
            <h4 className="text-2xl font-black text-brand-emerald mt-0.5">+{cSymbol}{totalIn.toLocaleString('en-IN')}</h4>
          </div>
          <div className="p-2.5 bg-brand-emerald/10 text-brand-emerald rounded-xl"><ArrowUpRight size={20} /></div>
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-955/10 border border-red-100 dark:border-red-900/30 rounded-2xl flex justify-between items-center">
          <div>
            <span className="text-xs text-slate-600 dark:text-slate-400">Total Money Out (Costs/Payments)</span>
            <h4 className="text-2xl font-black text-red-500 mt-0.5">-{cSymbol}{totalOut.toLocaleString('en-IN')}</h4>
          </div>
          <div className="p-2.5 bg-red-100 dark:bg-red-950/40 text-red-500 rounded-xl"><ArrowDownRight size={20} /></div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-2.5 text-slate-500 dark:text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search descriptions, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 flex-1 md:flex-none">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
            >
              <option value="All">All Flows</option>
              <option value="cash_in">Inflow (Cash In)</option>
              <option value="cash_out">Outflow (Cash Out)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 flex-1 md:flex-none">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Channel:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
            >
              <option value="All">All Channels</option>
              <option value="Cash">Cash Drawer</option>
              <option value="UPI">UPI Payment</option>
              <option value="Card">Card Terminal</option>
              <option value="Bank">Bank Payout</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction History Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/10">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Ref/Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Payment Channel</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredTx.map((tx, index) => (
                <tr key={tx.id} className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/20 ${index % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/20 dark:bg-slate-900/10'}`}>
                  <td className="py-3.5 px-4 font-medium flex items-center gap-1.5 mt-1.5 text-slate-500 dark:text-slate-400">
                    <Calendar size={13} />
                    <span>{tx.date}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold ${ tx.type === 'cash_in' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-brand-emerald' : 'bg-red-50 dark:bg-red-955/15 text-red-500' }`}>
                      {tx.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {tx.description}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                      {tx.paymentMethod === 'Cash' && <Coins size={12} className="text-amber-500" />}
                      {tx.paymentMethod === 'UPI' && <Wallet size={12} className="text-emerald-500" />}
                      {tx.paymentMethod === 'Card' && <CreditCard size={12} className="text-blue-500" />}
                      {tx.paymentMethod === 'Bank' && <Landmark size={12} className="text-slate-500 dark:text-slate-400" />}
                      {tx.paymentMethod}
                    </span>
                  </td>
                  <td className={`py-3.5 px-4 text-right font-black ${ tx.type === 'cash_in' ? 'text-brand-emerald' : 'text-red-500' }`}>
                    {tx.type === 'cash_in' ? '+' : '-'}{cSymbol}{tx.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}

              {filteredTx.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400 italic">No ledger transactions logged match filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
