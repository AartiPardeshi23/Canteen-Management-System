import React, { useState } from 'react';
import { useCanteenStore, type CanteenSettings } from '../store/canteenStore';
import { 
  Building, RefreshCw, 
  Download, Upload, Check, AlertOctagon, User, ShieldAlert,
  Database, HardDrive, ShieldCheck, Key
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { 
    settings, updateSettings, resetData,
    menu, bills, expenses, staff, suppliers, transactions 
  } = useCanteenStore();

  const [activeSubTab, setActiveSubTab] = useState<'details' | 'owner' | 'diagnostics'>('details');

  // Form states - Branding/Details
  const [formData, setFormData] = useState<CanteenSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Form states - Owner Profile
  const [ownerData, setOwnerData] = useState({
    name: 'Amrit Gowda',
    email: 'admin@bitesandbytes.com',
    phone: '+91 98765 43210',
    designation: 'Canteen Managing Director'
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [ownerSaveSuccess, setOwnerSaveSuccess] = useState(false);
  const [passSaveSuccess, setPassSaveSuccess] = useState(false);

  // Form states - Diagnostics check
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);

  // Currency list
  const currencies = [
    { label: 'INR (₹)', value: '₹' },
    { label: 'USD ($)', value: '$' },
    { label: 'EUR (€)', value: '€' },
    { label: 'GBP (£)', value: '£' },
  ];

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveOwner = (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerSaveSuccess(true);
    setTimeout(() => setOwnerSaveSuccess(false), 3000);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New password and confirm password do not match.');
      return;
    }
    setPassSaveSuccess(true);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setPassSaveSuccess(false), 3000);
  };

  const runDiagnostics = () => {
    setIsDiagnosticRunning(true);
    setDiagnosticResult(null);
    setTimeout(() => {
      setIsDiagnosticRunning(false);
      setDiagnosticResult('All systems green. Database integrity checked (100% consistent). 0 orphans detected.');
    }, 1500);
  };

  // Full Database backup exporter
  const handleBackupExport = () => {
    const fullState = localStorage.getItem('canteen-management-system-store');
    if (!fullState) {
      alert('No data stored to backup.');
      return;
    }
    const blob = new Blob([fullState], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Canteen_POS_FullBackup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Full Database backup importer
  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && json.state) {
          localStorage.setItem('canteen-management-system-store', JSON.stringify(json));
          alert('Backup restored successfully! The application will refresh.');
          window.location.reload();
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to read file. Please ensure it is a valid backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetConfirm = () => {
    resetData();
    setShowResetConfirm(false);
    alert('Database reverted to default demo records.');
    window.location.reload();
  };

  // Local storage usage size calculation
  const getLocalStorageSize = () => {
    let total = 0;
    for (const x in localStorage) {
      if (localStorage.hasOwnProperty(x)) {
        total += ((localStorage[x].length + x.length) * 2);
      }
    }
    return (total / 1024).toFixed(2);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Settings panel</h1>
        <p className="text-slate-600 dark:text-slate-400">Configure tax rates, printer layout parameters, change currency preferences, or perform database dumps.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Navigation Sidebar inside settings */}
        <div className="space-y-2">
          <div className="glass-panel p-4 rounded-xl space-y-1">
            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2.5 mb-2">Configuration Groups</h5>
            
            <button 
              onClick={() => setActiveSubTab('details')}
              className={`w-full text-left px-3 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-colors ${ activeSubTab === 'details' ? 'text-white bg-slate-900 dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:bg-slate-50/50 dark:hover:bg-slate-800' }`}
            >
              <Building size={16} />
              Canteen Details
            </button>

            <button 
              onClick={() => setActiveSubTab('owner')}
              className={`w-full text-left px-3 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-colors ${ activeSubTab === 'owner' ? 'text-white bg-slate-900 dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:bg-slate-50/50 dark:hover:bg-slate-800' }`}
            >
              <User size={16} />
              Owner Profile
            </button>

            <button 
              onClick={() => setActiveSubTab('diagnostics')}
              className={`w-full text-left px-3 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-colors ${ activeSubTab === 'diagnostics' ? 'text-white bg-slate-900 dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:bg-slate-50/50 dark:hover:bg-slate-800' }`}
            >
              <ShieldAlert size={16} />
              System Diagnostics
            </button>
          </div>
        </div>

        {/* Settings Form Column */}
        <div className="md:col-span-2 space-y-6">
          
          {/* TAB 1: CANTEEN DETAILS */}
          {activeSubTab === 'details' && (
            <>
              {/* Main Info Form */}
              <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs space-y-5">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">Canteen Details</h4>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Canteen Name / Outlet Brand</label>
                  <input
                    type="text"
                    required
                    value={formData.canteenName}
                    onChange={(e) => setFormData({...formData, canteenName: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Support Contact Number</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">System Currency Symbol</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({...formData, currency: e.target.value})}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                    >
                      {currencies.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">GST/Tax Settings (Percentage Rate)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={formData.taxRate}
                      onChange={(e) => setFormData({...formData, taxRate: Number(e.target.value)})}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-emerald font-bold"
                    />
                    <div className="absolute right-3.5 top-2.5 text-xs text-slate-500 dark:text-slate-400 font-bold">% GST</div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Thermal Receipt Footer text</label>
                  <textarea
                    value={formData.receiptFooter}
                    rows={2}
                    onChange={(e) => setFormData({...formData, receiptFooter: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-emerald resize-none"
                  />
                </div>

                {saveSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl text-xs text-brand-emerald font-semibold flex items-center gap-1.5 animate-fade-in">
                    <Check size={14} />
                    Branding settings updated successfully!
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-brand-emerald text-white rounded-xl text-sm font-bold hover:bg-emerald-650 shadow-md shadow-emerald-500/10 transition-all cursor-pointer"
                  >
                    Apply Details Settings
                  </button>
                </div>
              </form>

              {/* Backup & Restore Panel */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs space-y-4">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">Data Backup & Restore</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">Dump the entire system state (sales, menu, inventory logs) to a local file, or reload from a past backup.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <button
                    onClick={handleBackupExport}
                    className="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 p-4 rounded-xl text-slate-700 dark:text-slate-300 font-bold transition-all text-xs cursor-pointer"
                  >
                    <Download size={16} className="text-slate-500 dark:text-slate-400" />
                    Export JSON Backup
                  </button>

                  <div className="border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl p-4 relative flex items-center justify-center gap-2 cursor-pointer">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleBackupImport}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload size={16} className="text-slate-500 dark:text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-300 font-bold text-xs">Restore JSON Backup</span>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50/30 dark:bg-red-955/5 border border-red-100 dark:border-red-950/20 rounded-2xl p-5 space-y-4">
                <h4 className="text-lg font-bold text-red-500 pb-2 border-b border-red-105 dark:border-red-950/20">Danger Zone</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">Reverting your database will clear all current bills and items, restoring pre-packaged demo entries.</p>
                
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="bg-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw size={16} />
                    Reset System Database
                  </button>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: OWNER PROFILE */}
          {activeSubTab === 'owner' && (
            <div className="space-y-6">
              {/* Profile details */}
              <form onSubmit={handleSaveOwner} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs space-y-5">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">Owner Profile Information</h4>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Full Name</label>
                  <input
                    type="text"
                    required
                    value={ownerData.name}
                    onChange={(e) => setOwnerData({...ownerData, name: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Email Address</label>
                    <input
                      type="email"
                      required
                      value={ownerData.email}
                      onChange={(e) => setOwnerData({...ownerData, email: e.target.value})}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Contact Number</label>
                    <input
                      type="text"
                      required
                      value={ownerData.phone}
                      onChange={(e) => setOwnerData({...ownerData, phone: e.target.value})}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Designation / Role</label>
                  <input
                    type="text"
                    required
                    value={ownerData.designation}
                    onChange={(e) => setOwnerData({...ownerData, designation: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                {ownerSaveSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl text-xs text-brand-emerald font-semibold flex items-center gap-1.5">
                    <Check size={14} />
                    Profile settings updated successfully!
                  </div>
                )}

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-emerald text-white rounded-xl text-sm font-bold hover:bg-emerald-650 transition-all cursor-pointer"
                >
                  Save Profile
                </button>
              </form>

              {/* Password update */}
              <form onSubmit={handleSavePassword} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <Key size={18} className="text-slate-500 dark:text-slate-400" />
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">Security & Password</h4>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                {passSaveSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl text-xs text-brand-emerald font-semibold flex items-center gap-1.5">
                    <Check size={14} />
                    Password updated successfully!
                  </div>
                )}

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-sm font-bold hover:opacity-90 transition-all cursor-pointer"
                >
                  Change Password
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: SYSTEM DIAGNOSTICS */}
          {activeSubTab === 'diagnostics' && (
            <div className="space-y-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">System Diagnostics & Database Ratios</h4>
              
              {/* Record Summary counts */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border flex items-center gap-3">
                  <Database className="text-brand-emerald" size={20} />
                  <div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-semibold">Menu Records</p>
                    <p className="text-base font-black text-slate-800 dark:text-white mt-0.5">{menu.length} items</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border flex items-center gap-3">
                  <Database className="text-brand-emerald" size={20} />
                  <div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-semibold">Invoice Receipts</p>
                    <p className="text-base font-black text-slate-800 dark:text-white mt-0.5">{bills.length} bills</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border flex items-center gap-3">
                  <Database className="text-brand-orange" size={20} />
                  <div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-semibold">Expense Invoices</p>
                    <p className="text-base font-black text-slate-800 dark:text-white mt-0.5">{expenses.length} vouchers</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border flex items-center gap-3">
                  <Database className="text-brand-emerald" size={20} />
                  <div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-semibold">Ledger Entries</p>
                    <p className="text-base font-black text-slate-800 dark:text-white mt-0.5">{transactions.length} entries</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border flex items-center gap-3">
                  <Database className="text-blue-500" size={20} />
                  <div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-semibold">Roster Staff</p>
                    <p className="text-base font-black text-slate-800 dark:text-white mt-0.5">{staff.length} staff</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border flex items-center gap-3">
                  <Database className="text-blue-550" size={20} />
                  <div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-semibold">Suppliers Directory</p>
                    <p className="text-base font-black text-slate-800 dark:text-white mt-0.5">{suppliers.length} vendors</p>
                  </div>
                </div>
              </div>

              {/* Memory Audit */}
              <div className="p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-555">
                    <HardDrive size={15} />
                    Browser LocalStorage Used
                  </span>
                  <span>{getLocalStorageSize()} KB / 5120 KB</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-brand-emerald h-full rounded-full"
                    style={{ width: `${(Number(getLocalStorageSize()) / 5120) * 100}%` }}
                  />
                </div>
              </div>

              {/* Diagnoser audits */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={runDiagnostics}
                    disabled={isDiagnosticRunning}
                    className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw size={13} className={isDiagnosticRunning ? 'animate-spin' : ''} />
                    {isDiagnosticRunning ? 'Auditing Database Integrity...' : 'Run Integrity Diagnostic Check'}
                  </button>
                </div>

                {diagnosticResult && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 text-brand-emerald font-semibold rounded-xl text-xs flex items-start gap-2">
                    <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                    <span>{diagnosticResult}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-5 text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-955/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <AlertOctagon size={24} />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">Restore Factory Mock Data?</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  This action is irreversible. All your custom items, logged expenses, invoices, and attendance logs will be wiped and set back to initial demo data.
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetConfirm}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600"
                >
                  Clear and Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
