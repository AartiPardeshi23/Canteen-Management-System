import React, { useState, useEffect, useRef } from 'react';
import { useCanteenStore, type Bill } from '../store/canteenStore';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, Check, Printer, 
  RefreshCw, CreditCard, DollarSign, Wallet, Keyboard
} from 'lucide-react';

export const BillingView: React.FC = () => {
  const { 
    menu, cart, addToCart, removeFromCart, updateCartQuantity, 
    clearCart, checkoutCart, settings 
  } = useCanteenStore();

  const cSymbol = settings.currency;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [discountInput, setDiscountInput] = useState<number>(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card'>('UPI');
  const [checkedOutBill, setCheckedOutBill] = useState<Bill | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showShortcutsInfo, setShowShortcutsInfo] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Extract unique categories from menu
  const categories = ['All', ...Array.from(new Set(menu.map(item => item.category)))];

  // Filters menu items based on query and category
  const filteredMenu = menu.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate cart sums
  const subtotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const taxAmount = Math.round((subtotal - discountInput) * (settings.taxRate / 100) * 100) / 100;
  const netTotal = Math.max(0, subtotal - discountInput + taxAmount);

  // Keyboard Shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 to search
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // F8 to checkout
      if (e.key === 'F8') {
        e.preventDefault();
        handleCheckout();
      }
      // Esc to clear cart
      if (e.key === 'Escape' && cart.length > 0 && !showReceiptModal) {
        e.preventDefault();
        if (confirm('Clear current billing items?')) {
          clearCart();
          setDiscountInput(0);
          setCustomerName('');
          setCustomerPhone('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, discountInput, customerName, customerPhone, paymentMethod]);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const bill = checkoutCart(paymentMethod, customerName, customerPhone, discountInput);
    if (bill) {
      setCheckedOutBill(bill);
      setShowReceiptModal(true);
    }
  };

  const resetForm = () => {
    clearCart();
    setDiscountInput(0);
    setCustomerName('');
    setCustomerPhone('');
    setCheckedOutBill(null);
    setShowReceiptModal(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* Menu / Food Selector Column */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
        
        {/* Search and Shortcuts Help */}
        <div className="flex gap-2 items-center mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-500 dark:text-slate-400" size={18} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search food, beverages, category... (Press F2)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:border-transparent transition-all"
            />
          </div>
          <button 
            onClick={() => setShowShortcutsInfo(!showShortcutsInfo)}
            className="p-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl transition-all"
            title="Keyboard Shortcuts"
          >
            <Keyboard size={18} />
          </button>
        </div>

        {/* Shortcuts Info Alert */}
        {showShortcutsInfo && (
          <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border rounded font-semibold text-slate-900 dark:text-white">F2</kbd> Focus search</div>
            <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border rounded font-semibold text-slate-900 dark:text-white">F8</kbd> Trigger checkout</div>
            <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border rounded font-semibold text-slate-900 dark:text-white">Esc</kbd> Reset cart</div>
            <div className="text-right text-brand-emerald font-bold">Billing Active</div>
          </div>
        )}

        {/* Categories Scroller */}
        <div className="flex gap-2 overflow-x-auto pb-3.5 mb-4 scrollbar-none border-b border-slate-100 dark:border-slate-850">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${ selectedCategory === cat ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700' }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Food Items Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pr-1">
          {filteredMenu.map((item) => {
            const isOutOfStock = item.stockQuantity <= 0;
            const isAvailable = item.availability;
            const disabled = isOutOfStock || !isAvailable;

            return (
              <button
                key={item.id}
                disabled={disabled}
                onClick={() => addToCart(item)}
                className={`relative flex flex-col text-left rounded-2xl border p-3 bg-slate-50/50 dark:bg-slate-800/20 hover:shadow-md transition-all group overflow-hidden ${ disabled ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800' : 'border-slate-100 dark:border-slate-800/80 hover:border-brand-emerald/40 active:scale-98 cursor-pointer' }`}
              >
                {/* Food Image Mock */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 mb-3">
                  <img 
                    src={item.imageUrl} 
                    alt={item.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150";
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-white px-2 py-0.5 bg-red-600 rounded">Out of Stock</span>
                    </div>
                  )}
                  {!isAvailable && isAvailable !== undefined && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-white px-2 py-0.5 bg-slate-600 rounded">Unavailable</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">{item.category}</span>
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1 leading-snug mt-0.5">{item.name}</h5>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">
                      {cSymbol}{item.sellingPrice}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      Stock: {item.stockQuantity}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {filteredMenu.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
              <RefreshCw className="animate-spin text-slate-400 dark:text-slate-300 mb-4" size={32} />
              <p className="text-sm">No active menu items match your filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart & Billing Checkout Sidebar */}
      <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        
        {/* Cart Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold">
            <ShoppingCart size={18} className="text-brand-emerald" />
            <span>Active Cart</span>
            <span className="text-xs bg-brand-emerald text-white px-2 py-0.5 rounded-full">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>
          {cart.length > 0 && (
            <button 
              onClick={() => { if (confirm('Empty cart?')) clearCart(); }}
              className="text-xs font-bold text-red-500 hover:text-red-650 flex items-center gap-1"
            >
              <Trash2 size={13} />
              Clear
            </button>
          )}
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map((item) => (
            <div 
              key={item.id}
              className="flex justify-between items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-800/50 rounded-xl"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1">{item.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{cSymbol}{item.sellingPrice} per unit</p>
              </div>

              {/* Quantity Adjusters */}
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 active:scale-90"
                >
                  <Minus size={12} />
                </button>
                <span className="w-6 text-center text-sm font-bold text-slate-900 dark:text-white">{item.quantity}</span>
                <button 
                  onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 active:scale-90"
                >
                  <Plus size={12} />
                </button>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 ml-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
              <ShoppingCart size={36} className="text-slate-200 dark:text-slate-800 mb-3" />
              <p className="text-sm font-medium">POS Drawer Empty</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tap items on the left to build a bill.</p>
            </div>
          )}
        </div>

        {/* Customer & Bill Options */}
        {cart.length > 0 && (
          <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-3 bg-slate-50/20 dark:bg-slate-800/10">
            {/* Customer info */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Guest Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-emerald"
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-emerald"
              />
            </div>

            {/* Discount Selector */}
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Discount Amount ({cSymbol}):</span>
              <input
                type="number"
                min="0"
                max={subtotal}
                value={discountInput || ''}
                onChange={(e) => setDiscountInput(Number(e.target.value))}
                className="w-24 text-right px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Payment Method</span>
              <div className="grid grid-cols-3 gap-2">
                {(['UPI', 'Cash', 'Card'] as const).map((method) => {
                  const isActive = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-xl border text-xs font-bold transition-all ${ isActive ? 'border-brand-emerald bg-emerald-50 dark:bg-emerald-950/20 text-brand-emerald' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300' }`}
                    >
                      {method === 'UPI' && <Wallet size={16} className="mb-1" />}
                      {method === 'Cash' && <DollarSign size={16} className="mb-1" />}
                      {method === 'Card' && <CreditCard size={16} className="mb-1" />}
                      {method}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Cart Totals Summary */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Subtotal</span>
            <span>{cSymbol}{subtotal}</span>
          </div>
          {discountInput > 0 && (
            <div className="flex justify-between text-xs text-red-500 font-medium">
              <span>Discount</span>
              <span>-{cSymbol}{discountInput}</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>GST ({settings.taxRate}%)</span>
            <span>{cSymbol}{taxAmount}</span>
          </div>

          <div className="flex justify-between items-baseline pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Total Payable</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">
              {cSymbol}{netTotal}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3 rounded-xl mt-2 font-bold shadow-lg flex items-center justify-center gap-2 transition-all ${ cart.length === 0 ? 'bg-slate-100 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600 shadow-none' : 'bg-brand-emerald text-white hover:bg-emerald-600 shadow-emerald-500/10 active:scale-97' }`}
          >
            <Check size={18} />
            Generate Bill (F8)
          </button>
        </div>
      </div>

      {/* Invoice / Printable Thermal Receipt Modal */}
      {showReceiptModal && checkedOutBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="font-bold text-sm text-slate-800 dark:text-white">Receipt Generated</span>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="p-2 bg-slate-200 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg transition-all"
                  title="Print Thermal Receipt"
                >
                  <Printer size={15} />
                </button>
                <button
                  onClick={resetForm}
                  className="bg-brand-emerald text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-650 transition-all"
                >
                  New Order
                </button>
              </div>
            </div>

            {/* Printable Receipt Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 flex justify-center">
              <div className="print-area bg-white text-slate-900 p-4 border border-slate-200 shadow-xs max-w-xs w-full text-xs font-mono">
                {/* Receipt Header */}
                <div className="text-center space-y-1 mb-4">
                  <h4 className="font-black text-sm uppercase tracking-wide">{settings.canteenName}</h4>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight">{settings.address}</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400">Phone: {settings.phone}</p>
                  <div className="border-b border-dashed border-slate-300 my-2" />
                  <div className="flex justify-between text-[10px] text-left">
                    <span>Inv: {checkedOutBill.billNumber}</span>
                    <span>Date: {checkedOutBill.date}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-left">
                    <span>Cashier: Counter-01</span>
                    <span>Time: {checkedOutBill.time}</span>
                  </div>
                  {checkedOutBill.customerName && (
                    <div className="text-left text-[10px]">
                      <span>Guest: {checkedOutBill.customerName} ({checkedOutBill.customerPhone})</span>
                    </div>
                  )}
                </div>

                <div className="border-b border-dashed border-slate-300 my-2" />

                {/* Items Table */}
                <table className="w-full text-left table-fixed">
                  <thead>
                    <tr className="font-bold text-[10px] border-b border-slate-200">
                      <th className="w-1/2 py-1">Item</th>
                      <th className="w-1/6 text-center py-1">Qty</th>
                      <th className="w-1/3 text-right py-1">Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkedOutBill.items.map((item) => (
                      <tr key={item.id} className="text-[10px]">
                        <td className="py-1 line-clamp-1">{item.name}</td>
                        <td className="text-center py-1">{item.quantity}</td>
                        <td className="text-right py-1">{cSymbol}{item.sellingPrice * item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-b border-dashed border-slate-300 my-2" />

                {/* Bill details */}
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{cSymbol}{checkedOutBill.subtotal}</span>
                  </div>
                  {checkedOutBill.discount > 0 && (
                    <div className="flex justify-between text-red-650">
                      <span>Discount:</span>
                      <span>-{cSymbol}{checkedOutBill.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST ({settings.taxRate}%):</span>
                    <span>{cSymbol}{checkedOutBill.tax}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-200 mt-1">
                    <span>Total Paid:</span>
                    <span>{cSymbol}{checkedOutBill.total}</span>
                  </div>
                </div>

                <div className="border-b border-dashed border-slate-300 my-2.5" />

                {/* Footer details */}
                <div className="text-center space-y-1 text-[9px] text-slate-600 dark:text-slate-400">
                  <p className="font-semibold uppercase">Paid via {checkedOutBill.paymentMethod}</p>
                  <p className="leading-tight mt-1">{settings.receiptFooter}</p>
                  <p className="text-[8px] mt-2">Powered by Antigravity POS</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
