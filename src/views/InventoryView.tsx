import React, { useState, useEffect } from 'react';
import { useCanteenStore, type InventoryItem, type Supplier } from '../store/canteenStore';
import { 
  Search, Plus, Scale, AlertTriangle, CheckCircle, PlusCircle, MinusCircle, 
  Trash2, Phone, DollarSign, X, History, RotateCcw, Truck, ClipboardList
} from 'lucide-react';

interface PurchaseOrder {
  grnNumber: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalCost: number;
  supplierId: string;
  supplierName: string;
  date: string;
  invoiceNo: string;
}

interface PurchaseReturn {
  returnNumber: string;
  grnNumber: string;
  itemName: string;
  quantity: number;
  unit: string;
  refundAmount: number;
  reason: string;
  date: string;
}

export const InventoryView: React.FC = () => {
  const { 
    inventory, suppliers, stockLogs, adjustInventoryStock, 
    addInventoryItem, deleteInventoryItem,
    addSupplier, deleteSupplier, paySupplier, settings, addTransaction 
  } = useCanteenStore();

  const cSymbol = settings.currency;

  const [activeTab, setActiveTab] = useState<'stock' | 'purchases' | 'suppliers' | 'logs'>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Stock modal states
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<InventoryItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustAction, setAdjustAction] = useState<'in' | 'out'>('in');
  
  // New Item states
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemData, setNewItemData] = useState({
    name: '',
    quantity: 0,
    unit: 'kg',
    purchasePrice: 0,
    supplierId: suppliers[0]?.id || '',
    reorderLevel: 5
  });

  // Supplier modal states
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPaySupplierModal, setShowPaySupplierModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [newSupplierData, setNewSupplierData] = useState({
    name: '',
    contact: '',
    products: '',
    outstandingPayment: 0
  });

  // GRN states
  const [showGRNModal, setShowGRNModal] = useState(false);
  const [grnData, setGrnData] = useState({
    itemId: inventory[0]?.id || '',
    quantity: 1,
    invoiceNo: '',
    customPrice: 0
  });

  // Return states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedGrnForReturn, setSelectedGrnForReturn] = useState<string>('');
  const [returnQty, setReturnQty] = useState(1);
  const [returnReason, setReturnReason] = useState('Damaged goods');

  // Local storage lists for Purchases and Returns
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);

  // Load and pre-populate local states
  useEffect(() => {
    const savedPurchases = localStorage.getItem('canteen_pos_purchases');
    const savedReturns = localStorage.getItem('canteen_pos_returns');
    
    if (savedPurchases) {
      setPurchases(JSON.parse(savedPurchases));
    } else {
      // Mock historical GRNs
      const mockPurchases: PurchaseOrder[] = [
        {
          grnNumber: "GRN-1002",
          itemId: "i2",
          itemName: "Milk (1L Packets)",
          quantity: 20,
          unit: "Pack",
          unitPrice: 60,
          totalCost: 1200,
          supplierId: "s1",
          supplierName: "Nandini Milk & Poultry Suppliers",
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          invoiceNo: "INV-98231"
        },
        {
          grnNumber: "GRN-1001",
          itemId: "i5",
          itemName: "Burger Buns",
          quantity: 100,
          unit: "Unit",
          unitPrice: 4,
          totalCost: 400,
          supplierId: "s2",
          supplierName: "Metro Wholesale Grocery Ltd.",
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          invoiceNo: "INV-78324"
        }
      ];
      setPurchases(mockPurchases);
      localStorage.setItem('canteen_pos_purchases', JSON.stringify(mockPurchases));
    }

    if (savedReturns) {
      setReturns(JSON.parse(savedReturns));
    } else {
      // Mock returns
      const mockReturns: PurchaseReturn[] = [
        {
          returnNumber: "RET-5001",
          grnNumber: "GRN-1002",
          itemName: "Milk (1L Packets)",
          quantity: 2,
          unit: "Pack",
          refundAmount: 120,
          reason: "Leaking packaging",
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ];
      setReturns(mockReturns);
      localStorage.setItem('canteen_pos_returns', JSON.stringify(mockReturns));
    }
  }, []);

  const savePurchases = (list: PurchaseOrder[]) => {
    setPurchases(list);
    localStorage.setItem('canteen_pos_purchases', JSON.stringify(list));
  };

  const saveReturns = (list: PurchaseReturn[]) => {
    setReturns(list);
    localStorage.setItem('canteen_pos_returns', JSON.stringify(list));
  };

  // Submit Goods Received Note (GRN)
  const handleGRNSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = inventory.find(i => i.id === grnData.itemId);
    if (!item || grnData.quantity <= 0) return;

    const supplier = suppliers.find(s => s.id === item.supplierId);
    const grnNo = `GRN-${Date.now().toString().slice(-4)}`;
    const unitPrice = grnData.customPrice > 0 ? grnData.customPrice : item.purchasePrice;
    const totalCost = grnData.quantity * unitPrice;

    // 1. Increment Stock quantity in Zustand
    adjustInventoryStock(item.id, grnData.quantity, 'in');

    // 2. Add to Local Purchases history
    const newPO: PurchaseOrder = {
      grnNumber: grnNo,
      itemId: item.id,
      itemName: item.name,
      quantity: grnData.quantity,
      unit: item.unit,
      unitPrice,
      totalCost,
      supplierId: item.supplierId,
      supplierName: supplier?.name || 'Unknown Supplier',
      date: new Date().toISOString().split('T')[0],
      invoiceNo: grnData.invoiceNo || `PO-${Date.now().toString().slice(-4)}`
    };

    savePurchases([newPO, ...purchases]);
    setShowGRNModal(false);
    setGrnData({ itemId: inventory[0]?.id || '', quantity: 1, invoiceNo: '', customPrice: 0 });
    alert(`Goods Received Note ${grnNo} recorded. Stock updated automatically.`);
  };

  // Submit Purchase Return
  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const grn = purchases.find(p => p.grnNumber === selectedGrnForReturn);
    if (!grn || returnQty <= 0 || returnQty > grn.quantity) {
      alert(`Invalid return quantity. Must be between 1 and ${grn?.quantity || 1}`);
      return;
    }

    const retNo = `RET-${Date.now().toString().slice(-4)}`;
    const refund = returnQty * grn.unitPrice;

    // 1. Deduct Stock quantity in Zustand
    adjustInventoryStock(grn.itemId, returnQty, 'out');

    // 2. Log refund transaction cash_in
    addTransaction({
      type: 'cash_in',
      amount: refund,
      category: 'Supplier Payment', // as a refund
      paymentMethod: 'UPI',
      date: new Date().toISOString().split('T')[0],
      description: `Purchase Return ${retNo}: Refund for ${returnQty} ${grn.unit} of ${grn.itemName} (Reason: ${returnReason})`
    });

    // 3. Save Return history record
    const newReturn: PurchaseReturn = {
      returnNumber: retNo,
      grnNumber: grn.grnNumber,
      itemName: grn.itemName,
      quantity: returnQty,
      unit: grn.unit,
      refundAmount: refund,
      reason: returnReason,
      date: new Date().toISOString().split('T')[0]
    };

    saveReturns([newReturn, ...returns]);
    setShowReturnModal(false);
    setSelectedGrnForReturn('');
    setReturnQty(1);
    alert(`Purchase Return ${retNo} recorded. Stock deducted and refund logged to ledger.`);
  };

  // Filters
  const filteredStock = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.products.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics
  const totalStockItems = inventory.length;
  const lowStockItems = inventory.filter(item => item.quantity <= item.reorderLevel);
  const totalOutstandingDept = suppliers.reduce((sum, s) => sum + s.outstandingPayment, 0);

  // Stock Adjustment Submit
  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockItem || adjustAmount <= 0) return;
    
    adjustInventoryStock(
      selectedStockItem.id, 
      adjustAmount, 
      adjustAction === 'in' ? 'in' : 'out'
    );
    
    setShowStockModal(false);
    setSelectedStockItem(null);
    setAdjustAmount(0);
  };

  // Add Item Submit
  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.name.trim()) return;
    addInventoryItem(newItemData);
    setShowAddItemModal(false);
  };

  // Add Supplier Submit
  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierData.name.trim()) return;
    addSupplier(newSupplierData);
    setShowSupplierModal(false);
  };

  // Pay Supplier Submit
  const handlePaySupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || paymentAmount <= 0) return;
    paySupplier(selectedSupplier.id, paymentAmount);
    setShowPaySupplierModal(false);
    setSelectedSupplier(null);
    setPaymentAmount(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Inventory & Suppliers</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage raw ingredients, keep track of reorder indicators, and coordinate supplier dues.</p>
        </div>
        <div className="flex gap-2.5">
          {activeTab === 'stock' && (
            <>
              <button
                onClick={() => {
                  setGrnData({ itemId: inventory[0]?.id || '', quantity: 1, invoiceNo: '', customPrice: 0 });
                  setShowGRNModal(true);
                }}
                className="flex items-center gap-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-xl font-semibold shadow-xs text-sm cursor-pointer hover:opacity-90"
              >
                <Truck size={16} />
                Receive Goods (GRN)
              </button>
              <button
                onClick={() => setShowAddItemModal(true)}
                className="flex items-center gap-2 bg-brand-emerald text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all text-sm cursor-pointer"
              >
                <Plus size={16} />
                Add Stock Material
              </button>
            </>
          )}
          {activeTab === 'purchases' && (
            <button
              onClick={() => {
                if (purchases.length === 0) {
                  alert('Record a purchase order / GRN first.');
                  return;
                }
                setSelectedGrnForReturn(purchases[0].grnNumber);
                setReturnQty(1);
                setShowReturnModal(true);
              }}
              className="flex items-center gap-1.5 bg-red-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg hover:bg-red-650 transition-all text-sm cursor-pointer"
            >
              <RotateCcw size={16} />
              Record Purchase Return
            </button>
          )}
          {activeTab === 'suppliers' && (
            <button
              onClick={() => {
                setNewSupplierData({ name: '', contact: '', products: '', outstandingPayment: 0 });
                setShowSupplierModal(true);
              }}
              className="flex items-center gap-2 bg-brand-orange text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 hover:bg-orange-600 active:scale-95 transition-all text-sm cursor-pointer"
            >
              <Plus size={16} />
              Add Supplier
            </button>
          )}
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => { setActiveTab('stock'); setSearchQuery(''); }}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${ activeTab === 'stock' ? 'border-brand-emerald text-brand-emerald' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white' }`}
        >
          Stock Inventory
        </button>
        <button
          onClick={() => { setActiveTab('purchases'); setSearchQuery(''); }}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${ activeTab === 'purchases' ? 'border-brand-emerald text-brand-emerald' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white' }`}
        >
          Purchase History & GRN
        </button>
        <button
          onClick={() => { setActiveTab('suppliers'); setSearchQuery(''); }}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${ activeTab === 'suppliers' ? 'border-brand-emerald text-brand-emerald' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white' }`}
        >
          Suppliers & Payment Tracking
        </button>
        <button
          onClick={() => { setActiveTab('logs'); setSearchQuery(''); }}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${ activeTab === 'logs' ? 'border-brand-emerald text-brand-emerald' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white' }`}
        >
          Inventory logs
        </button>
      </div>

      {/* Low Stock Alerts Banner */}
      {activeTab === 'stock' && lowStockItems.length > 0 && (
        <div className="bg-red-50 dark:bg-red-955/20 border border-red-200/50 dark:border-red-900/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div>
              <h5 className="font-bold text-red-800 dark:text-red-300 text-sm">Critical Stock Alert</h5>
              <p className="text-xs text-red-650 dark:text-red-400 mt-0.5">
                The following ingredients have fallen below critical reorder limits: {lowStockItems.map(item => item.name).join(', ')}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl">
            <Scale size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Material Items</p>
            <h4 className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">{totalStockItems}</h4>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-red-105 bg-opacity-20 text-red-500 rounded-xl">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Low Stock Indicators</p>
            <h4 className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">{lowStockItems.length} Warnings</h4>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-955/20 text-amber-500 rounded-xl">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Outstanding Supplier Dues</p>
            <h4 className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">{cSymbol}{totalOutstandingDept.toLocaleString('en-IN')}</h4>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      {(activeTab === 'stock' || activeTab === 'suppliers') && (
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 text-slate-500 dark:text-slate-400" size={16} />
          <input
            type="text"
            placeholder={activeTab === 'stock' ? 'Search ingredients...' : 'Search supplier name, products...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:border-transparent transition-all text-sm"
          />
        </div>
      )}

      {/* STOCK INVENTORY TABLE */}
      {activeTab === 'stock' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/10">
                  <th className="py-3 px-4">Material</th>
                  <th className="py-3 px-4">Qty on Hand</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4">Reorder Limit</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStock.map((item, index) => {
                  const isLow = item.quantity <= item.reorderLevel;
                  const supplier = suppliers.find(s => s.id === item.supplierId);

                  return (
                    <tr key={item.id} className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/20 ${index % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/20 dark:bg-slate-900/10'}`}>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black ${ isLow ? 'bg-red-50 dark:bg-red-955/25 text-red-500 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' }`}>
                          {item.quantity} {item.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium">
                        {cSymbol}{item.purchasePrice}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-500 dark:text-slate-400">
                        {item.reorderLevel} {item.unit}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {supplier?.name || 'Unknown Supplier'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedStockItem(item);
                              setAdjustAction('in');
                              setShowStockModal(true);
                            }}
                            className="text-xs font-bold text-brand-emerald hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <PlusCircle size={13} />
                            Adjust
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove ingredient "${item.name}" from tracking?`)) {
                                deleteInventoryItem(item.id);
                              }
                            }}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-955/20 text-red-500 rounded cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PURCHASES & GRN & RETURNS HISTORY */}
      {activeTab === 'purchases' && (
        <div className="space-y-6">
          {/* Goods Received History */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 flex items-center gap-2">
              <ClipboardList size={16} className="text-brand-emerald" />
              <span className="font-bold text-sm text-slate-800 dark:text-white">Goods Received Notes (GRN) & Purchases</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase">
                    <th className="py-2.5 px-4">GRN #</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Material</th>
                    <th className="py-2.5 px-4">Supplier</th>
                    <th className="py-2.5 px-4">Invoice No</th>
                    <th className="py-2.5 px-4 text-center">Qty Received</th>
                    <th className="py-2.5 px-4 text-right">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {purchases.map((p, index) => (
                    <tr key={p.grnNumber} className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/20 ${index % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/20 dark:bg-slate-900/10'}`}>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{p.grnNumber}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{p.date}</td>
                      <td className="py-3 px-4 font-bold">{p.itemName}</td>
                      <td className="py-3 px-4">{p.supplierName}</td>
                      <td className="py-3 px-4 font-mono">{p.invoiceNo}</td>
                      <td className="py-3 px-4 text-center font-semibold">{p.quantity} {p.unit}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-905 dark:text-white">{cSymbol}{p.totalCost}</td>
                    </tr>
                  ))}
                  {purchases.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400 italic">No purchase receipts logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Returns History */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 flex items-center gap-2">
              <RotateCcw size={16} className="text-red-500" />
              <span className="font-bold text-sm text-slate-800 dark:text-white">Purchase Returns & Credit Notes</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-500 dark:text-slate-400 font-bold uppercase">
                    <th className="py-2.5 px-4">Return #</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Material</th>
                    <th className="py-2.5 px-4">Ref GRN</th>
                    <th className="py-2.5 px-4">Return Reason</th>
                    <th className="py-2.5 px-4 text-center">Qty Returned</th>
                    <th className="py-2.5 px-4 text-right">Refund Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {returns.map((r, index) => (
                    <tr key={r.returnNumber} className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/20 ${index % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/20 dark:bg-slate-900/10'}`}>
                      <td className="py-3 px-4 font-bold text-red-500">{r.returnNumber}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{r.date}</td>
                      <td className="py-3 px-4 font-bold">{r.itemName}</td>
                      <td className="py-3 px-4 font-mono">{r.grnNumber}</td>
                      <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-400">{r.reason}</td>
                      <td className="py-3 px-4 text-center font-semibold text-red-500">-{r.quantity} {r.unit}</td>
                      <td className="py-3 px-4 text-right font-black text-brand-emerald">+{cSymbol}{r.refundAmount}</td>
                    </tr>
                  ))}
                  {returns.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400 italic">No purchase return credit notes recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUPPLIERS & VENDOR PAYMENTS */}
      {activeTab === 'suppliers' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/10">
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Products Catalog</th>
                    <th className="py-3 px-4 text-right">Outstanding Dues</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSuppliers.map((s, index) => (
                    <tr key={s.id} className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/20 ${index % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/20 dark:bg-slate-900/10'}`}>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {s.name}
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Phone size={13} className="text-slate-500 dark:text-slate-400" />
                          <span>{s.contact}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {s.products}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {s.outstandingPayment > 0 ? (
                          <span className="font-extrabold text-brand-orange">
                            {cSymbol}{s.outstandingPayment.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-emerald-500 font-bold text-xs flex items-center gap-1 justify-end">
                            <CheckCircle size={12} /> Paid
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end gap-2.5">
                          {s.outstandingPayment > 0 && (
                            <button
                              onClick={() => {
                                setSelectedSupplier(s);
                                setPaymentAmount(s.outstandingPayment);
                                setShowPaySupplierModal(true);
                              }}
                              className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs px-2.5 py-1 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                            >
                              Pay Dues
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`Remove supplier "${s.name}"?`)) {
                                deleteSupplier(s.id);
                              }
                            }}
                            className="p-1.5 hover:bg-red-55 hover:bg-opacity-10 text-red-500 rounded-lg cursor-pointer"
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

          {/* Vendor Payments Ledger History */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 flex items-center gap-2">
              <History size={16} className="text-slate-500 dark:text-slate-400" />
              <span className="font-bold text-sm text-slate-800 dark:text-white">Vendor Payouts Logs</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-405 font-bold uppercase">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Recipient Supplier</th>
                    <th className="py-2.5 px-4">Payout Method</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Amount Settled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Pull supplier payment records from Transactions table */}
                  {useCanteenStore.getState().transactions
                    .filter(t => t.category === 'Supplier Payment' && t.type === 'cash_out')
                    .map((tx, index) => (
                      <tr key={tx.id} className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/20 ${index % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/20 dark:bg-slate-900/10'}`}>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{tx.date}</td>
                        <td className="py-3 px-4 font-bold">{tx.description.replace('Supplier payment to ', '').replace('Stock Purchase: ', 'Purchase restock: ')}</td>
                        <td className="py-3 px-4">{tx.paymentMethod}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-brand-emerald rounded font-bold">
                            Cleared
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-red-550">-{cSymbol}{tx.amount}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STOCK LOGS VIEW */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/10">
            <span className="font-bold text-sm text-slate-800 dark:text-white">Material Ledger Audit Logs</span>
          </div>
          <div className="overflow-y-auto max-h-96">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {stockLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                  <div className="flex items-center gap-3">
                    {log.change > 0 ? (
                      <span className="w-8 h-8 bg-emerald-100 dark:bg-emerald-950/40 text-brand-emerald flex items-center justify-center rounded-full">
                        <PlusCircle size={16} />
                      </span>
                    ) : (
                      <span className="w-8 h-8 bg-red-105 bg-opacity-20 text-red-500 flex items-center justify-center rounded-full">
                        <MinusCircle size={16} />
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{log.itemName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Action: {log.action.toUpperCase()} | Date: {log.date}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-extrabold ${log.change > 0 ? 'text-brand-emerald' : 'text-red-500'}`}>
                    {log.change > 0 ? '+' : ''}{log.change}
                  </span>
                </div>
              ))}
              {stockLogs.length === 0 && (
                <p className="p-6 text-center text-slate-500 dark:text-slate-400 italic">No inventory transaction logs recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showStockModal && selectedStockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="font-bold text-sm text-slate-800 dark:text-white">Adjust Stock: {selectedStockItem.name}</span>
              <button onClick={() => setShowStockModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustAction('in')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${ adjustAction === 'in' ? 'border-brand-emerald bg-emerald-50 dark:bg-emerald-955/20 text-brand-emerald' : 'border-slate-200 dark:border-slate-700 text-slate-500' }`}
                  >
                    Restock (Purchase)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustAction('out')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${ adjustAction === 'out' ? 'border-red-500 bg-red-50 dark:bg-red-955/15 text-red-500' : 'border-slate-200 dark:border-slate-700 text-slate-500' }`}
                  >
                    Deduct (Shrink/Use)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Quantity ({selectedStockItem.unit})</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustAmount || ''}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-emerald font-bold"
                />
              </div>

              {adjustAction === 'in' && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl text-xs text-brand-emerald font-semibold">
                  Note: Restocking will automatically trigger a Supplier purchase transaction outflow of {cSymbol}{adjustAmount * selectedStockItem.purchasePrice} in the ledger.
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-xl text-sm font-bold cursor-pointer ${ adjustAction === 'in' ? 'bg-brand-emerald hover:bg-emerald-650' : 'bg-red-500 hover:bg-red-600' }`}
                >
                  Adjust Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Stock Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="font-bold text-base text-slate-800 dark:text-white">Track New Ingredient</span>
              <button onClick={() => setShowAddItemModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleAddItemSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Material Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Milk, Onions, Coffee Beans"
                  value={newItemData.name}
                  onChange={(e) => setNewItemData({...newItemData, name: e.target.value})}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-202 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Initial Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemData.quantity}
                    onChange={(e) => setNewItemData({...newItemData, quantity: Number(e.target.value)})}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-202 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-805 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Unit (kg, Liters, etc)</label>
                  <input
                    type="text"
                    required
                    value={newItemData.unit}
                    onChange={(e) => setNewItemData({...newItemData, unit: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-202 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Purchase Cost per Unit ({cSymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemData.purchasePrice || ''}
                    onChange={(e) => setNewItemData({...newItemData, purchasePrice: Number(e.target.value)})}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-202 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Reorder Alert Level</label>
                  <input
                    type="number"
                    min="1"
                    value={newItemData.reorderLevel}
                    onChange={(e) => setNewItemData({...newItemData, reorderLevel: Number(e.target.value)})}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-202 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Assigned Vendor / Supplier</label>
                <select
                  value={newItemData.supplierId}
                  onChange={(e) => setNewItemData({...newItemData, supplierId: e.target.value})}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
                >
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-emerald text-white rounded-xl text-sm font-bold hover:bg-emerald-650"
                >
                  Register Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GOODS RECEIVED NOTE (GRN) MODAL */}
      {showGRNModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1">
                <Truck size={16} /> Record Goods Received Note (GRN)
              </span>
              <button onClick={() => setShowGRNModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleGRNSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Material Received</label>
                <select
                  value={grnData.itemId}
                  onChange={(e) => setGrnData({...grnData, itemId: e.target.value})}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
                >
                  {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (Unit: {i.unit})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Quantity Received</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={grnData.quantity}
                    onChange={(e) => setGrnData({...grnData, quantity: Number(e.target.value)})}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-800 text-slate-805 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Invoice/PO Ref Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-982"
                    value={grnData.invoiceNo}
                    onChange={(e) => setGrnData({...grnData, invoiceNo: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-800 text-slate-805 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Custom Unit Price ({cSymbol}) [Leave 0 to use base price]</label>
                <input
                  type="number"
                  min="0"
                  value={grnData.customPrice || ''}
                  onChange={(e) => setGrnData({...grnData, customPrice: Number(e.target.value)})}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-800 text-slate-805 dark:text-white font-bold"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl text-xs text-brand-emerald font-semibold">
                Note: Creating this GRN will automatically increment the stock levels in raw inventory.
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGRNModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-emerald text-white rounded-xl text-sm font-bold hover:bg-emerald-650 cursor-pointer"
                >
                  Generate GRN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PURCHASE RETURN MODAL */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                <RotateCcw size={16} /> Record Purchase Return
              </span>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleReturnSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Select Purchase GRN</label>
                <select
                  value={selectedGrnForReturn}
                  onChange={(e) => {
                    setSelectedGrnForReturn(e.target.value);
                    setReturnQty(1);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
                >
                  {purchases.map(p => (
                    <option key={p.grnNumber} value={p.grnNumber}>
                      {p.grnNumber} - {p.itemName} (Qty: {p.quantity}) from {p.supplierName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Return Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={returnQty}
                    onChange={(e) => setReturnQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800 text-slate-805 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Return Reason</label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white"
                  >
                    <option value="Damaged goods">Damaged / Spoiled</option>
                    <option value="Expired">Expired</option>
                    <option value="Wrong delivery">Wrong item delivery</option>
                    <option value="Quality issue">Substandard quality</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-red-50 dark:bg-red-955/15 border border-red-105 rounded-xl text-xs text-red-500 font-semibold">
                Note: Saving this return will automatically deduct the quantities from raw inventory stock and record a cash refund in the ledger.
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 cursor-pointer"
                >
                  Process Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="font-bold text-sm text-slate-800 dark:text-white">Register Supplier</span>
              <button onClick={() => setShowSupplierModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleAddSupplierSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Supplier Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nandini Dairy Corp"
                  value={newSupplierData.name}
                  onChange={(e) => setNewSupplierData({...newSupplierData, name: e.target.value})}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-800 text-slate-805 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Contact Number</label>
                <input
                  type="text"
                  required
                  placeholder="+91 XXXXX XXXXX"
                  value={newSupplierData.contact}
                  onChange={(e) => setNewSupplierData({...newSupplierData, contact: e.target.value})}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-800 text-slate-805 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Supplied Products Catalog</label>
                <input
                  type="text"
                  placeholder="e.g. Milk, Paneer, Poultry items"
                  value={newSupplierData.products}
                  onChange={(e) => setNewSupplierData({...newSupplierData, products: e.target.value})}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-800 text-slate-805 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Initial Outstanding Payment ({cSymbol})</label>
                <input
                  type="number"
                  min="0"
                  value={newSupplierData.outstandingPayment || ''}
                  onChange={(e) => setNewSupplierData({...newSupplierData, outstandingPayment: Number(e.target.value)})}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-800 text-slate-855 dark:text-white focus:outline-none font-bold"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-orange text-white rounded-xl text-sm font-bold hover:bg-orange-650"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Supplier Dues Modal */}
      {showPaySupplierModal && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="font-bold text-sm text-slate-800 dark:text-white">Pay Supplier: {selectedSupplier.name}</span>
              <button onClick={() => setShowPaySupplierModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            
            <form onSubmit={handlePaySupplierSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900 rounded-xl text-xs text-brand-orange font-semibold">
                Total Outstanding Balance: {cSymbol}{selectedSupplier.outstandingPayment}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Payment Amount ({cSymbol})</label>
                <input
                  type="number"
                  min="1"
                  max={selectedSupplier.outstandingPayment}
                  required
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange font-bold text-lg"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPaySupplierModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-sm font-bold hover:opacity-90 cursor-pointer"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
