import React, { useState } from 'react';
import { useCanteenStore, type Staff } from '../store/canteenStore';
import { 
  Users, DollarSign, Clock, CheckCircle, Plus, Edit2, Trash2, X
} from 'lucide-react';

export const EmployeeView: React.FC = () => {
  const { staff, addStaff, editStaff, deleteStaff, markAttendance, settings } = useCanteenStore();
  const cSymbol = settings.currency;

  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    role: 'Helper' as Staff['role'],
    contact: '',
    salary: 0
  });

  const roles: Staff['role'][] = ['Manager', 'Cashier', 'Chef', 'Helper', 'Cleaner'];

  // Attendance stats for selected date
  const totalStaffCount = staff.length;
  const presentCount = staff.filter(s => s.attendance[attendanceDate] === 'Present').length;
  const lateCount = staff.filter(s => s.attendance[attendanceDate] === 'Late').length;
  
  // Total monthly payroll outflow
  const monthlyPayrollTotal = staff.reduce((sum, s) => sum + s.salary, 0);

  const handleOpenAdd = () => {
    setFormData({ name: '', role: 'Helper', contact: '', salary: 15000 });
    setShowAddModal(true);
  };

  const handleOpenEdit = (emp: Staff) => {
    setCurrentStaff(emp);
    setFormData({
      name: emp.name,
      role: emp.role,
      contact: emp.contact,
      salary: emp.salary
    });
    setShowEditModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.salary <= 0) return;
    addStaff(formData);
    setShowAddModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStaff || !formData.name.trim() || formData.salary <= 0) return;
    editStaff(currentStaff.id, formData);
    setShowEditModal(false);
    setCurrentStaff(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove employee "${name}" from roster?`)) {
      deleteStaff(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Staff & Attendance</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage employee directories, mark daily attendance status, and audit payroll overheads.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-brand-emerald text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all text-sm"
        >
          <Plus size={18} />
          Register Employee
        </button>
      </div>

      {/* Roster KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Total Staff</p>
            <h4 className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">{totalStaffCount} Employees</h4>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/30 text-brand-emerald rounded-xl">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Present (Selected Day)</p>
            <h4 className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">{presentCount} Active</h4>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-955/20 text-brand-orange rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Late Arrivals</p>
            <h4 className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">{lateCount} Clock-ins</h4>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-955/20 text-blue-500 rounded-xl">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Monthly Payroll Sum</p>
            <h4 className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">{cSymbol}{monthlyPayrollTotal.toLocaleString('en-IN')}</h4>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Staff Directory Left, Attendance Sheet Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Staff Directory Panel */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm lg:col-span-2 flex flex-col bg-white dark:bg-slate-900">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Roster Profiles</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">Contact files and wage settings for canteen service teams</p>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/10">
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3 text-right">Wages (Monthly)</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {staff.map((emp, index) => (
                  <tr key={emp.id} className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/20 ${index % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/20 dark:bg-slate-900/10'}`}>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-white rounded-full flex items-center justify-center font-bold text-xs">
                          {emp.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{emp.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs font-semibold">
                        {emp.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-xs text-slate-600 dark:text-slate-400">
                      {emp.contact}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                      {cSymbol}{emp.salary.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id, emp.name)}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-550 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Attendance Marker Panel */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col bg-white dark:bg-slate-900">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Clock-in Sheet</h4>
            <div className="relative">
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="px-2.5 py-1 text-xs font-semibold border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-white focus:outline-none"
              />
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 font-medium">Log clock-in logs for date: {attendanceDate}</p>

          <div className="flex-1 space-y-3.5">
            {staff.map(emp => {
              const status = emp.attendance[attendanceDate] || 'Absent';
              return (
                <div key={emp.id} className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{emp.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">{emp.role}</p>
                  </div>
                  
                  {/* Status Dropdown/Selector buttons */}
                  <div className="flex gap-1">
                    {(['Present', 'Absent', 'Late'] as const).map(s => {
                      const active = status === s;
                      return (
                        <button
                          key={s}
                          onClick={() => markAttendance(emp.id, attendanceDate, s)}
                          className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${ active ? s === 'Present' ? 'bg-emerald-100 text-brand-emerald dark:bg-emerald-950/20' : s === 'Late' ? 'bg-amber-100 text-brand-orange dark:bg-amber-955/20' : 'bg-red-100 text-red-500 dark:bg-red-955/15' : 'bg-slate-50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750' }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="font-bold text-sm text-slate-800 dark:text-white">Register Employee Profile</span>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Employee Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Gowda"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-805 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Roster Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Salary (Monthly)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.salary || ''}
                    onChange={(e) => setFormData({...formData, salary: Number(e.target.value)})}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Contact Number</label>
                <input
                  type="text"
                  required
                  placeholder="+91 99XXX XXXXX"
                  value={formData.contact}
                  onChange={(e) => setFormData({...formData, contact: e.target.value})}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-805 dark:text-white focus:outline-none"
                />
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
                  className="px-5 py-2 bg-brand-emerald text-white rounded-xl text-sm font-bold hover:bg-emerald-650"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && currentStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="font-bold text-sm text-slate-800 dark:text-white">Modify Employee: {currentStaff.name}</span>
              <button onClick={() => setShowEditModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Employee Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-805 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Roster Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Salary (Monthly)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.salary || ''}
                    onChange={(e) => setFormData({...formData, salary: Number(e.target.value)})}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Contact Number</label>
                <input
                  type="text"
                  required
                  value={formData.contact}
                  onChange={(e) => setFormData({...formData, contact: e.target.value})}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-855 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-emerald text-white rounded-xl text-sm font-bold hover:bg-emerald-650"
                >
                  Apply Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
