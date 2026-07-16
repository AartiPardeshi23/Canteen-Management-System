import React, { useState } from 'react';
import { useCanteenStore, type MenuItem } from '../store/canteenStore';
import { 
  Search, Plus, Edit2, Trash2, SlidersHorizontal, Check, X,
  DollarSign, Package, Layers, BarChart3, TrendingUp, Sparkles, AlertCircle
} from 'lucide-react';

export const MenuView: React.FC = () => {
  const { menu, addMenuItem, editMenuItem, deleteMenuItem, settings, bills } = useCanteenStore();
  const cSymbol = settings.currency;

  const [activeSubView, setActiveSubView] = useState<'list' | 'margin-analysis'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentItem, setCurrentItem] = useState<MenuItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: 'Snacks',
    costPrice: 0,
    sellingPrice: 0,
    availability: true,
    imageUrl: '',
    stockQuantity: 100
  });

  const categories = Array.from(new Set(menu.map(item => item.category)));
  const filterCategories = ['All', ...categories];

  const filteredMenu = menu.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate high-level stats
  const totalItems = menu.length;
  const activeItems = menu.filter(m => m.availability).length;
  const outOfStockCount = menu.filter(m => m.stockQuantity <= 0).length;
  const avgPrice = Math.round(menu.reduce((sum, m) => sum + m.sellingPrice, 0) / (totalItems || 1));

  // Compute sales volume count per menu item from historic invoices
  const getSalesVolume = (itemName: string) => {
    return bills.reduce((total, bill) => {
      const matched = bill.items.find(i => i.name === itemName);
      return total + (matched ? matched.quantity : 0);
    }, 0);
  };

  // Profit Margins breakdown list
  const marginAnalysisList = menu.map(item => {
    const profit = item.sellingPrice - item.costPrice;
    const marginPct = item.sellingPrice > 0 ? Math.round((profit / item.sellingPrice) * 100) : 0;
    const salesVolume = getSalesVolume(item.name);
    const totalProfitEarned = profit * salesVolume;

    let marginClass: 'High' | 'Medium' | 'Low' = 'Medium';
    if (marginPct >= 60) marginClass = 'High';
    else if (marginPct < 35) marginClass = 'Low';

    return {
      ...item,
      profit,
      marginPct,
      salesVolume,
      totalProfitEarned,
      marginClass
    };
  }).sort((a, b) => b.marginPct - a.marginPct);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      category: categories[0] || 'Snacks',
      costPrice: 0,
      sellingPrice: 0,
      availability: true,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150',
      stockQuantity: 50
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setCurrentItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
      availability: item.availability,
      imageUrl: item.imageUrl,
      stockQuantity: item.stockQuantity
    });
    setShowEditModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.sellingPrice <= 0) {
      alert('Please fill out item name and valid selling price.');
      return;
    }
    addMenuItem(formData);
    setShowAddModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) return;
    if (!formData.name.trim() || formData.sellingPrice <= 0) {
      alert('Please fill out item name and valid selling price.');
      return;
    }
    editMenuItem(currentItem.id, formData);
    setShowEditModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove "${name}" from the menu?`)) {
      deleteMenuItem(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Menu & Pricing</h1>
          <p className="text-slate-600 dark:text-slate-400">Add, edit, or adjust food items, pricing structures, and audit profit margins.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-brand-emerald text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all text-sm cursor-pointer"
          >
            <Plus size={18} />
            Add Food Item
          </button>
        </div>
      </div>

      {/* Roster / Margin toggle subtab */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveSubView('list')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${ activeSubView === 'list' ? 'border-brand-emerald text-brand-emerald' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white' }`}
        >
          Menu List
        </button>
        <button
          onClick={() => setActiveSubView('margin-analysis')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${ activeSubView === 'margin-analysis' ? 'border-brand-emerald text-brand-emerald' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white' }`}
        >
          Profit Margin Analysis
        </button>
      </div>

      {/* VIEW 1: STANDARD MENU LIST */}
      {activeSubView === 'list' && (
        <>
          {/* Menu Statistics Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl">
                <Layers size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Total Items</p>
                <h4 className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">{totalItems}</h4>
              </div>
            </div>
            <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/30 text-brand-emerald rounded-xl">
                <Check size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Active Items</p>
                <h4 className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">{activeItems}</h4>
              </div>
            </div>
            <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-955/20 text-red-500 rounded-xl">
                <Package size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Out of Stock</p>
                <h4 className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">{outOfStockCount}</h4>
              </div>
            </div>
            <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-955/20 text-blue-500 rounded-xl">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Avg Price</p>
                <h4 className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">{cSymbol}{avgPrice}</h4>
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-2.5 text-slate-500 dark:text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search item name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:border-transparent transition-all text-sm"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <SlidersHorizontal size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Category:</span>
              {filterCategories.map(cat => (
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

          {/* Menu Table/List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/10">
                    <th className="py-3 px-4">Food Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Cost Price</th>
                    <th className="py-3 px-4 text-right">Selling Price</th>
                    <th className="py-3 px-4 text-right">Profit / Item</th>
                    <th className="py-3 px-4 text-center">Stock Quantity</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredMenu.map((item, index) => {
                    const profit = item.sellingPrice - item.costPrice;
                    const margin = Math.round((profit / (item.sellingPrice || 1)) * 100);
                    const isLowStock = item.stockQuantity <= 15;

                    return (
                      <tr key={item.id} className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/20 ${index % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/20 dark:bg-slate-900/10'}`}>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={item.imageUrl} 
                              alt={item.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150";
                              }}
                              className="w-10 h-10 rounded-xl object-cover bg-slate-100 dark:bg-slate-800"
                            />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">ID: {item.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-slate-600 dark:text-slate-400">
                          {cSymbol}{item.costPrice}
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-slate-900 dark:text-white">
                          {cSymbol}{item.sellingPrice}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div>
                            <span className="font-bold text-brand-emerald">{cSymbol}{profit}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">{margin}% Margin</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${ item.stockQuantity <= 0 ? 'bg-red-50 dark:bg-red-955/25 text-red-500' : isLowStock ? 'bg-amber-50 dark:bg-amber-955/25 text-amber-550' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' }`}>
                            {item.stockQuantity} portions
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button 
                            onClick={() => editMenuItem(item.id, { availability: !item.availability })}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${ item.availability ? 'bg-emerald-50 dark:bg-emerald-955/25 text-brand-emerald hover:bg-emerald-100/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200/50' }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${item.availability ? 'bg-brand-emerald' : 'bg-slate-400'}`} />
                            {item.availability ? 'Active' : 'Draft'}
                          </button>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 hover:bg-slate-105 text-slate-600 dark:text-slate-400 rounded-lg transition-all cursor-pointer"
                              title="Edit pricing/details"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.name)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-955/20 text-red-500 rounded-lg transition-all cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredMenu.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400 italic">No food items found matching your filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: PROFIT MARGIN ANALYSIS */}
      {activeSubView === 'margin-analysis' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Analytics Insight cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="glass-panel p-4 rounded-xl flex items-start gap-3 border-l-4 border-l-emerald-500">
              <Sparkles size={20} className="text-brand-emerald shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Star Performer</h5>
                {marginAnalysisList.filter(item => item.salesVolume > 15).length > 0 ? (
                  (() => {
                    const stars = [...marginAnalysisList].sort((a,b) => b.totalProfitEarned - a.totalProfitEarned);
                    return (
                      <div className="mt-1">
                        <p className="font-extrabold text-slate-900 dark:text-white text-base">{stars[0].name}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Earned {cSymbol}{stars[0].totalProfitEarned} profit ({stars[0].salesVolume} portions)</p>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-xs font-bold mt-1 text-slate-600 dark:text-slate-400">No volume sales yet</p>
                )}
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl flex items-start gap-3 border-l-4 border-l-orange-500">
              <TrendingUp size={20} className="text-brand-orange shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Highest Profit Margin</h5>
                <div className="mt-1">
                  <p className="font-extrabold text-slate-900 dark:text-white text-base">{marginAnalysisList[0]?.name || 'N/A'}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Holds {marginAnalysisList[0]?.marginPct || 0}% Profit Margin</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl flex items-start gap-3 border-l-4 border-l-red-500">
              <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Pricing Action Required</h5>
                {marginAnalysisList.find(m => m.marginClass === 'Low') ? (
                  <div className="mt-1">
                    <p className="font-extrabold text-slate-900 dark:text-white text-sm">Low Margin Items Detected</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Items below 35% margin require cost review.</p>
                  </div>
                ) : (
                  <p className="text-xs font-bold mt-1 text-brand-emerald">All items hold healthy margins!</p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Adjuster Recommendations Card */}
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
              <BarChart3 size={16} className="text-brand-emerald" />
              Margin Classifications & Price Recommendations
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">Automated audit of dishes to hit 60% gross profit targets.</p>
          </div>

          {/* Margins breakdown list table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/10">
                  <th className="py-3 px-4">Dish</th>
                  <th className="py-3 px-4">Cost vs Selling</th>
                  <th className="py-3 px-4 text-center">Margin %</th>
                  <th className="py-3 px-4 text-center">Sales Volume</th>
                  <th className="py-3 px-4 text-right">Net Profit Contribution</th>
                  <th className="py-3 px-4 text-right">AI Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {marginAnalysisList.map((item, index) => {
                  const targetPrice = Math.round(item.costPrice / 0.4); // hit 60% margin

                  return (
                    <tr key={item.id} className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/20 ${index % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/20 dark:bg-slate-900/10'}`}>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.category}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-xs">
                        <span>Cost: {cSymbol}{item.costPrice}</span>
                        <span className="mx-1 text-slate-400 dark:text-slate-300">|</span>
                        <span className="font-bold">Price: {cSymbol}{item.sellingPrice}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black ${ item.marginClass === 'High' ? 'bg-emerald-50 dark:bg-emerald-955/25 text-brand-emerald' : item.marginClass === 'Low' ? 'bg-red-50 dark:bg-red-955/20 text-red-500' : 'bg-amber-50 dark:bg-amber-955/20 text-brand-orange' }`}>
                          {item.marginPct}% ({item.marginClass})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        {item.salesVolume} portions
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                        {cSymbol}{item.totalProfitEarned.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.marginClass === 'Low' ? (
                          <span className="text-xs text-brand-orange font-bold">
                            Raise price to {cSymbol}{targetPrice} to hit 60%
                          </span>
                        ) : item.marginClass === 'High' ? (
                          <span className="text-xs text-brand-emerald font-bold flex items-center gap-1 justify-end">
                            <Sparkles size={11} /> Healthy Star
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                            Consider slight pricing lift
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="font-bold text-base text-slate-800 dark:text-white">Add Food Item</span>
              <button onClick={() => setShowAddModal(false)} className="text-slate-405"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masala Dosa, Mango Shake"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                  >
                    {categories.length > 0 ? (
                      categories.map(c => <option key={c} value={c}>{c}</option>)
                    ) : (
                      ['Snacks', 'Beverages', 'Fast Food', 'Meals', 'Desserts'].map(c => <option key={c} value={c}>{c}</option>)
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Stock Portions Available</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({...formData, stockQuantity: Number(e.target.value)})}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Cost Price ({cSymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.costPrice || ''}
                    onChange={(e) => setFormData({...formData, costPrice: Number(e.target.value)})}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-emerald font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Selling Price ({cSymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sellingPrice || ''}
                    onChange={(e) => setFormData({...formData, sellingPrice: Number(e.target.value)})}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-emerald font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Photo URL</label>
                <input
                  type="text"
                  placeholder="Paste Unsplash or direct image link"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-805 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="availCheck"
                  checked={formData.availability}
                  onChange={(e) => setFormData({...formData, availability: e.target.checked})}
                  className="rounded border-slate-350 text-brand-emerald focus:ring-brand-emerald w-4 h-4"
                />
                <label htmlFor="availCheck" className="text-sm font-semibold text-slate-700 dark:text-slate-305">
                  Set as available for billing immediately
                </label>
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
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && currentItem && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="font-bold text-base text-slate-800 dark:text-white">Modify Item: {currentItem.name}</span>
              <button onClick={() => setShowEditModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Dish Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Category</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Stock Portions Available</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({...formData, stockQuantity: Number(e.target.value)})}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Cost Price ({cSymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.costPrice || ''}
                    onChange={(e) => setFormData({...formData, costPrice: Number(e.target.value)})}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Selling Price ({cSymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sellingPrice || ''}
                    onChange={(e) => setFormData({...formData, sellingPrice: Number(e.target.value)})}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Photo URL</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-805 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editAvailCheck"
                  checked={formData.availability}
                  onChange={(e) => setFormData({...formData, availability: e.target.checked})}
                  className="rounded border-slate-350 text-brand-emerald focus:ring-brand-emerald w-4 h-4"
                />
                <label htmlFor="editAvailCheck" className="text-sm font-semibold text-slate-700 dark:text-slate-305">
                  Set as available for billing immediately
                </label>
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
