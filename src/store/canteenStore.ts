import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  availability: boolean;
  imageUrl: string;
  stockQuantity: number; // For food inventory mapping
}

export interface CartItem {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
}

export interface Bill {
  billNumber: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card';
  customerName?: string;
  customerPhone?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
}

export interface Expense {
  id: string;
  amount: number;
  category: 'Ingredients' | 'Gas' | 'Electricity' | 'Staff Salary' | 'Rent' | 'Maintenance' | 'Miscellaneous';
  date: string; // YYYY-MM-DD
  notes: string;
  receiptName?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string; // kg, L, Pack, Unit
  purchasePrice: number;
  supplierId: string;
  reorderLevel: number;
}

export interface StockHistoryLog {
  id: string;
  itemId: string;
  itemName: string;
  change: number; // positive or negative
  action: 'in' | 'out' | 'adjustment';
  date: string;
}

export interface Transaction {
  id: string;
  type: 'cash_in' | 'cash_out';
  amount: number;
  category: 'Sales' | 'Expense' | 'Supplier Payment' | 'Adjustment' | 'Salary';
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Bank';
  date: string; // YYYY-MM-DD
  description: string;
}

export interface Staff {
  id: string;
  name: string;
  role: 'Manager' | 'Cashier' | 'Chef' | 'Helper' | 'Cleaner';
  contact: string;
  salary: number;
  attendance: { [date: string]: 'Present' | 'Absent' | 'Late' | 'Leave' };
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  products: string;
  outstandingPayment: number;
}

export interface CanteenSettings {
  canteenName: string;
  address: string;
  phone: string;
  taxRate: number; // GST in %
  currency: string; // ₹, $, etc.
  receiptFooter: string;
}

interface CanteenState {
  // Active Navigation
  currentView: string;
  setCurrentView: (view: string) => void;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Settings
  settings: CanteenSettings;
  updateSettings: (settings: Partial<CanteenSettings>) => void;

  // Menu Management
  menu: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  editMenuItem: (id: string, item: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  updateMenuItemStock: (id: string, quantity: number) => void;

  // Billing (POS)
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (id: string) => void;
  updateCartQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  checkoutCart: (paymentMethod: 'Cash' | 'UPI' | 'Card', customerName?: string, customerPhone?: string, discount?: number) => Bill | null;

  // Bills History
  bills: Bill[];
  deleteBill: (billNumber: string) => void;

  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  editExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Inventory
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  editInventoryItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  adjustInventoryStock: (id: string, amount: number, action: 'in' | 'out' | 'adjustment') => void;
  stockLogs: StockHistoryLog[];

  // Suppliers
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  editSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  paySupplier: (id: string, amount: number) => void;

  // Transactions / Cash Flow
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  openingBalance: number;
  setOpeningBalance: (amount: number) => void;

  // Staff
  staff: Staff[];
  addStaff: (employee: Omit<Staff, 'id' | 'attendance'>) => void;
  editStaff: (id: string, employee: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  markAttendance: (id: string, date: string, status: 'Present' | 'Absent' | 'Late' | 'Leave') => void;

  // Reset
  resetData: () => void;
}

// Custom formatted dates for relative mock histories
const getDateDaysAgo = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

const initialSettings: CanteenSettings = {
  canteenName: "Bites & Bytes Canteen",
  address: "Tech Park, Building 4A, Bangalore",
  phone: "+91 98765 43210",
  taxRate: 5,
  currency: "₹",
  receiptFooter: "Thank you for dining with us! Have a coding-free break!"
};

const initialMenu: MenuItem[] = [
  { id: "m1", name: "Masala Chai", category: "Beverages", costPrice: 8, sellingPrice: 15, availability: true, imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=150", stockQuantity: 150 },
  { id: "m2", name: "Cold Coffee", category: "Beverages", costPrice: 20, sellingPrice: 45, availability: true, imageUrl: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=150", stockQuantity: 80 },
  { id: "m3", name: "Paneer Tikka Roll", category: "Snacks", costPrice: 45, sellingPrice: 90, availability: true, imageUrl: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=150", stockQuantity: 40 },
  { id: "m4", name: "Samosa (Plate of 2)", category: "Snacks", costPrice: 12, sellingPrice: 25, availability: true, imageUrl: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=150", stockQuantity: 60 },
  { id: "m5", name: "Veg Cheese Burger", category: "Fast Food", costPrice: 35, sellingPrice: 75, availability: true, imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150", stockQuantity: 25 },
  { id: "m6", name: "Chicken Club Sandwich", category: "Fast Food", costPrice: 50, sellingPrice: 110, availability: true, imageUrl: "https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?w=150", stockQuantity: 30 },
  { id: "m7", name: "Butter Chicken with Naan", category: "Meals", costPrice: 90, sellingPrice: 180, availability: true, imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=150", stockQuantity: 15 },
  { id: "m8", name: "Chole Bhature", category: "Meals", costPrice: 40, sellingPrice: 85, availability: true, imageUrl: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=150", stockQuantity: 20 },
  { id: "m9", name: "Chocolate Brownie", category: "Desserts", costPrice: 25, sellingPrice: 60, availability: true, imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=150", stockQuantity: 0 }, // Low/Out of Stock item
];

const initialInventory: InventoryItem[] = [
  { id: "i1", name: "Amul Butter", quantity: 12, unit: "Pack", purchasePrice: 52, supplierId: "s2", reorderLevel: 5 },
  { id: "i2", name: "Milk (1L Packets)", quantity: 4, unit: "Pack", purchasePrice: 60, supplierId: "s1", reorderLevel: 8 }, // Low Stock Alert
  { id: "i3", name: "Tea Leaves (Taj Mahal)", quantity: 15, unit: "kg", purchasePrice: 420, supplierId: "s2", reorderLevel: 4 },
  { id: "i4", name: "Chicken Breast", quantity: 20, unit: "kg", purchasePrice: 220, supplierId: "s1", reorderLevel: 6 },
  { id: "i5", name: "Burger Buns", quantity: 60, unit: "Unit", purchasePrice: 4, supplierId: "s2", reorderLevel: 20 },
  { id: "i6", name: "Paneer Blocks", quantity: 2, unit: "kg", purchasePrice: 380, supplierId: "s1", reorderLevel: 3 }, // Low Stock Alert
  { id: "i7", name: "Refined Oil", quantity: 45, unit: "L", purchasePrice: 110, supplierId: "s2", reorderLevel: 10 },
  { id: "i8", name: "Commercial Gas LPG Cylinder", quantity: 2, unit: "Unit", purchasePrice: 1850, supplierId: "s3", reorderLevel: 1 }
];

const initialSuppliers: Supplier[] = [
  { id: "s1", name: "Nandini Milk & Poultry Suppliers", contact: "+91 98450 11223", products: "Milk, Butter, Paneer, Chicken, Eggs", outstandingPayment: 4200 },
  { id: "s2", name: "Metro Wholesale Grocery Ltd.", contact: "+91 98860 44556", products: "Buns, Tea, Flour, Oil, Sugar, Spices", outstandingPayment: 1500 },
  { id: "s3", name: "Super Gas Agency Bangalore", contact: "+91 80234 56789", products: "Commercial Gas Cylinders", outstandingPayment: 0 }
];

const initialStaff: Staff[] = [
  { id: "e1", name: "Rohan Gowda", role: "Manager", contact: "+91 99001 22334", salary: 28000, attendance: {} },
  { id: "e2", name: "Priya Sharma", role: "Cashier", contact: "+91 99002 33445", salary: 18000, attendance: {} },
  { id: "e3", name: "Anil Kumar", role: "Chef", contact: "+91 99003 44556", salary: 25000, attendance: {} },
  { id: "e4", name: "Suresh Gowda", role: "Helper", contact: "+91 99004 55667", salary: 12000, attendance: {} }
];

// Pre-fill attendance logs for staff for the past 3 days
const prefillAttendance = (staffList: Staff[]): Staff[] => {
  const days = [0, 1, 2, 3];
  return staffList.map(s => {
    const attendance: { [date: string]: 'Present' | 'Absent' | 'Late' | 'Leave' } = {};
    days.forEach(d => {
      const dateStr = getDateDaysAgo(d);
      const rand = Math.random();
      if (rand > 0.95) attendance[dateStr] = 'Absent';
      else if (rand > 0.85) attendance[dateStr] = 'Late';
      else attendance[dateStr] = 'Present';
    });
    return { ...s, attendance };
  });
};

// Generates bills history for last 10 days
const generateMockBills = (): Bill[] => {
  const mockBills: Bill[] = [];
  const itemsPool = initialMenu;
  const payPool: ('Cash' | 'UPI' | 'Card')[] = ['UPI', 'UPI', 'Cash', 'Card', 'UPI'];
  const names = ['Amrit', 'Vikram', 'Divya', 'Neha', 'Sanjay', 'Punit', 'Meera', 'Karan', 'Sneha', 'Rahul'];

  let billCounter = 10001;

  for (let day = 15; day >= 0; day--) {
    const dateStr = getDateDaysAgo(day);
    // Number of bills per day (more on recent days)
    const numBills = Math.floor(Math.random() * 8) + 8; // 8 to 15 transactions per day

    for (let b = 0; b < numBills; b++) {
      billCounter++;
      // Randomly select 1 to 4 items
      const numItems = Math.floor(Math.random() * 3) + 1;
      const selectedItems: CartItem[] = [];
      let subtotal = 0;

      for (let i = 0; i < numItems; i++) {
        const randomItem = itemsPool[Math.floor(Math.random() * itemsPool.length)];
        // check if item already added
        const exists = selectedItems.find(si => si.id === randomItem.id);
        if (exists) {
          exists.quantity += 1;
          subtotal += exists.sellingPrice;
        } else {
          const qty = Math.floor(Math.random() * 2) + 1;
          selectedItems.push({
            id: randomItem.id,
            name: randomItem.name,
            category: randomItem.category,
            costPrice: randomItem.costPrice,
            sellingPrice: randomItem.sellingPrice,
            quantity: qty
          });
          subtotal += randomItem.sellingPrice * qty;
        }
      }

      const discount = Math.random() > 0.7 ? Math.round(subtotal * 0.1) : 0; // 10% discount sometimes
      const tax = Math.round((subtotal - discount) * (initialSettings.taxRate / 100) * 100) / 100;
      const total = subtotal - discount + tax;
      const pm = payPool[Math.floor(Math.random() * payPool.length)];
      const hour = String(Math.floor(Math.random() * 10) + 10).padStart(2, '0'); // 10am to 7pm
      const min = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      const hasCustomer = Math.random() > 0.6;

      mockBills.push({
        billNumber: `TXN-${billCounter}`,
        items: selectedItems,
        subtotal,
        discount,
        tax,
        total: Math.round(total * 100) / 100,
        paymentMethod: pm,
        customerName: hasCustomer ? names[Math.floor(Math.random() * names.length)] : undefined,
        customerPhone: hasCustomer ? `98765 ${Math.floor(Math.random() * 90000) + 10000}` : undefined,
        date: dateStr,
        time: `${hour}:${min}`
      });
    }
  }
  return mockBills;
};

// Generates mock expenses for the last month
const generateMockExpenses = (): Expense[] => {
  const expensesList: Expense[] = [];

  // Add rent for current and past month
  expensesList.push({ id: "e_rent_1", amount: 15000, category: 'Rent', date: getDateDaysAgo(2), notes: "Rent for Building A" });
  expensesList.push({ id: "e_rent_2", amount: 15000, category: 'Rent', date: getDateDaysAgo(32), notes: "Rent for Building A" });

  // Add salary payments for employees
  expensesList.push({ id: "e_sal_1", amount: 28000, category: 'Staff Salary', date: getDateDaysAgo(15), notes: "Manager Rohan Gowda Salary" });
  expensesList.push({ id: "e_sal_2", amount: 18000, category: 'Staff Salary', date: getDateDaysAgo(15), notes: "Cashier Priya Sharma Salary" });
  expensesList.push({ id: "e_sal_3", amount: 25000, category: 'Staff Salary', date: getDateDaysAgo(15), notes: "Chef Anil Kumar Salary" });
  expensesList.push({ id: "e_sal_4", amount: 12000, category: 'Staff Salary', date: getDateDaysAgo(15), notes: "Helper Suresh Gowda Salary" });

  // Utility charges
  expensesList.push({ id: "e_elec_1", amount: 4800, category: 'Electricity', date: getDateDaysAgo(10), notes: "Electricity bill BESCOM" });
  expensesList.push({ id: "e_elec_2", amount: 4500, category: 'Electricity', date: getDateDaysAgo(40), notes: "Electricity bill BESCOM" });

  // Daily ingredient purchases
  for (let i = 0; i < 15; i++) {
    if (i % 3 === 0) {
      expensesList.push({
        id: `e_ing_${i}`,
        amount: Math.floor(Math.random() * 1500) + 1000,
        category: 'Ingredients',
        date: getDateDaysAgo(i),
        notes: "Daily fresh veggies & chicken purchase"
      });
    }
  }

  // Gas cylinders
  expensesList.push({ id: "e_gas_1", amount: 1850, category: 'Gas', date: getDateDaysAgo(5), notes: "LPG Commercial gas refill" });
  expensesList.push({ id: "e_gas_2", amount: 1850, category: 'Gas', date: getDateDaysAgo(20), notes: "LPG Commercial gas refill" });

  // Maintenance & Misc
  expensesList.push({ id: "e_maint_1", amount: 1200, category: 'Maintenance', date: getDateDaysAgo(12), notes: "AquaGuard water filter service" });
  expensesList.push({ id: "e_misc_1", amount: 800, category: 'Miscellaneous', date: getDateDaysAgo(8), notes: "Canteen cleaning solutions & packaging" });

  return expensesList;
};

// Generates transactions list based on bills and expenses
const generateMockTransactions = (bills: Bill[], expenses: Expense[]): Transaction[] => {
  const transactions: Transaction[] = [];

  // Generate sales cash-ins
  bills.forEach((bill, idx) => {
    transactions.push({
      id: `t_sale_${idx}`,
      type: 'cash_in',
      amount: bill.total,
      category: 'Sales',
      paymentMethod: bill.paymentMethod,
      date: bill.date,
      description: `Sales Invoice ${bill.billNumber}`
    });
  });

  // Generate expense cash-outs
  expenses.forEach((exp, idx) => {
    let method: Transaction['paymentMethod'] = 'Cash';
    if (exp.category === 'Rent' || exp.category === 'Staff Salary') method = 'Bank';
    else if (exp.amount > 1500) method = 'UPI';

    transactions.push({
      id: `t_exp_${idx}`,
      type: 'cash_out',
      amount: exp.amount,
      category: exp.category === 'Staff Salary' ? 'Salary' : 'Expense',
      paymentMethod: method,
      date: exp.date,
      description: `Expense: ${exp.category} - ${exp.notes}`
    });
  });

  // Supplier payments (historical)
  transactions.push({
    id: "t_sup_1",
    type: "cash_out",
    amount: 5000,
    category: "Supplier Payment",
    paymentMethod: "Bank",
    date: getDateDaysAgo(11),
    description: "Partial outstanding clearing to Nandini Poultry"
  });

  return transactions;
};

const mockBills = generateMockBills();
const mockExpenses = generateMockExpenses();
const mockTransactions = generateMockTransactions(mockBills, mockExpenses);

export const useCanteenStore = create<CanteenState>()(
  persist(
    (set, get) => ({
      // Active View
      currentView: 'dashboard',
      setCurrentView: (view) => set({ currentView: view }),

      // Theme
      theme: 'light',
      toggleTheme: () => {
        const nextTheme = get().theme === 'light' ? 'dark' : 'light';
        if (nextTheme === 'dark') {
          document.body.classList.add('dark');
        } else {
          document.body.classList.remove('dark');
        }
        set({ theme: nextTheme });
      },

      // Settings
      settings: initialSettings,
      updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),

      // Menu
      menu: initialMenu,
      addMenuItem: (item) => set((state) => {
        const newId = `m${Date.now()}`;
        return { menu: [...state.menu, { ...item, id: newId }] };
      }),
      editMenuItem: (id, updatedItem) => set((state) => ({
        menu: state.menu.map((item) => item.id === id ? { ...item, ...updatedItem } : item)
      })),
      deleteMenuItem: (id) => set((state) => ({
        menu: state.menu.filter((item) => item.id !== id)
      })),
      updateMenuItemStock: (id, quantity) => set((state) => ({
        menu: state.menu.map((item) => item.id === id ? { ...item, stockQuantity: quantity } : item)
      })),

      // Cart
      cart: [],
      addToCart: (item) => set((state) => {
        const existing = state.cart.find((ci) => ci.id === item.id);
        if (existing) {
          return {
            cart: state.cart.map((ci) =>
              ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
            )
          };
        } else {
          return {
            cart: [...state.cart, {
              id: item.id,
              name: item.name,
              category: item.category,
              costPrice: item.costPrice,
              sellingPrice: item.sellingPrice,
              quantity: 1
            }]
          };
        }
      }),
      removeFromCart: (id) => set((state) => ({
        cart: state.cart.filter((item) => item.id !== id)
      })),
      updateCartQuantity: (id, quantity) => set((state) => {
        if (quantity <= 0) {
          return { cart: state.cart.filter((item) => item.id !== id) };
        }
        return {
          cart: state.cart.map((item) =>
            item.id === id ? { ...item, quantity } : item
          )
        };
      }),
      clearCart: () => set({ cart: [] }),
      checkoutCart: (paymentMethod, customerName, customerPhone, discount = 0) => {
        const { cart, settings, menu } = get();
        if (cart.length === 0) return null;

        // Verify/decrease stock on Menu items
        cart.forEach(cartItem => {
          const menuItem = menu.find(m => m.id === cartItem.id);
          if (menuItem && menuItem.stockQuantity < cartItem.quantity) {
            // Allow billing anyway for hospitality, but update to 0
          }
        });

        const subtotal = cart.reduce((acc, item) => acc + (item.sellingPrice * item.quantity), 0);
        const calculatedDiscount = Math.min(discount, subtotal);
        const taxRate = settings.taxRate;
        const tax = Math.round((subtotal - calculatedDiscount) * (taxRate / 100) * 100) / 100;
        const total = Math.round((subtotal - calculatedDiscount + tax) * 100) / 100;

        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = date.toTimeString().split(' ')[0].substring(0, 5);

        // Generate Bill number
        const billNumber = `TXN-${Date.now().toString().slice(-6)}`;

        const newBill: Bill = {
          billNumber,
          items: [...cart],
          subtotal,
          discount: calculatedDiscount,
          tax,
          total,
          paymentMethod,
          customerName,
          customerPhone,
          date: dateStr,
          time: timeStr
        };

        // Create transaction
        const newTransaction: Transaction = {
          id: `t_sale_${Date.now()}`,
          type: 'cash_in',
          amount: total,
          category: 'Sales',
          paymentMethod,
          date: dateStr,
          description: `Sales Invoice ${billNumber}`
        };

        // Decrease stock count in Menu store
        set((state) => {
          const updatedMenu = state.menu.map(menuItem => {
            const bought = cart.find(ci => ci.id === menuItem.id);
            if (bought) {
              const remaining = Math.max(0, menuItem.stockQuantity - bought.quantity);
              return { ...menuItem, stockQuantity: remaining };
            }
            return menuItem;
          });

          return {
            bills: [newBill, ...state.bills],
            transactions: [newTransaction, ...state.transactions],
            menu: updatedMenu,
            cart: []
          };
        });

        return newBill;
      },

      // Bills
      bills: mockBills,
      deleteBill: (billNumber) => set((state) => {
        // Also remove related transaction
        return {
          bills: state.bills.filter(b => b.billNumber !== billNumber),
          transactions: state.transactions.filter(t => !t.description.includes(billNumber))
        };
      }),

      // Expenses
      expenses: mockExpenses,
      addExpense: (expense) => set((state) => {
        const id = `e${Date.now()}`;
        const newExpense = { ...expense, id };
        
        let txMethod: Transaction['paymentMethod'] = 'Cash';
        if (expense.category === 'Rent' || expense.category === 'Staff Salary') txMethod = 'Bank';
        else if (expense.amount > 1500) txMethod = 'UPI';

        const newTransaction: Transaction = {
          id: `t_exp_${Date.now()}`,
          type: 'cash_out',
          amount: expense.amount,
          category: expense.category === 'Staff Salary' ? 'Salary' : 'Expense',
          paymentMethod: txMethod,
          date: expense.date,
          description: `Expense: ${expense.category} - ${expense.notes}`
        };

        return {
          expenses: [newExpense, ...state.expenses],
          transactions: [newTransaction, ...state.transactions]
        };
      }),
      editExpense: (id, updated) => set((state) => ({
        expenses: state.expenses.map(e => e.id === id ? { ...e, ...updated } : e)
      })),
      deleteExpense: (id) => set((state) => {
        const expenseToDelete = state.expenses.find(e => e.id === id);
        if (!expenseToDelete) return {};
        return {
          expenses: state.expenses.filter(e => e.id !== id),
          transactions: state.transactions.filter(t => !t.description.includes(expenseToDelete.notes))
        };
      }),

      // Inventory
      inventory: initialInventory,
      addInventoryItem: (item) => set((state) => {
        const id = `i${Date.now()}`;
        return { inventory: [...state.inventory, { ...item, id }] };
      }),
      editInventoryItem: (id, updated) => set((state) => ({
        inventory: state.inventory.map(item => item.id === id ? { ...item, ...updated } : item)
      })),
      deleteInventoryItem: (id) => set((state) => ({
        inventory: state.inventory.filter(item => item.id !== id)
      })),
      adjustInventoryStock: (id, amount, action) => set((state) => {
        const inventoryItem = state.inventory.find(item => item.id === id);
        if (!inventoryItem) return {};

        const oldQty = inventoryItem.quantity;
        const newQty = action === 'in' ? oldQty + amount : action === 'out' ? Math.max(0, oldQty - amount) : amount;
        const diff = newQty - oldQty;

        const newLog: StockHistoryLog = {
          id: `log_${Date.now()}`,
          itemId: id,
          itemName: inventoryItem.name,
          change: diff,
          action,
          date: new Date().toISOString().split('T')[0]
        };

        // If action is "in" and we purchase stock, log transaction
        let updatedTransactions = [...state.transactions];
        if (action === 'in' && diff > 0) {
          const purchaseCost = diff * inventoryItem.purchasePrice;
          const supplier = state.suppliers.find(s => s.id === inventoryItem.supplierId);

          // Log transaction cash-out
          updatedTransactions.unshift({
            id: `t_stock_${Date.now()}`,
            type: 'cash_out',
            amount: purchaseCost,
            category: 'Supplier Payment',
            paymentMethod: 'UPI',
            date: new Date().toISOString().split('T')[0],
            description: `Stock Purchase: ${diff} ${inventoryItem.unit} of ${inventoryItem.name} from ${supplier?.name || 'Supplier'}`
          });
        }

        return {
          inventory: state.inventory.map(item => item.id === id ? { ...item, quantity: newQty } : item),
          stockLogs: [newLog, ...state.stockLogs],
          transactions: updatedTransactions
        };
      }),
      stockLogs: [
        { id: "log_1", itemId: "i2", itemName: "Milk (1L Packets)", change: 10, action: "in", date: getDateDaysAgo(2) },
        { id: "log_2", itemId: "i2", itemName: "Milk (1L Packets)", change: -6, action: "out", date: getDateDaysAgo(1) },
        { id: "log_3", itemId: "i5", itemName: "Burger Buns", change: 50, action: "in", date: getDateDaysAgo(4) },
      ],

      // Suppliers
      suppliers: initialSuppliers,
      addSupplier: (supplier) => set((state) => {
        const id = `s${Date.now()}`;
        return { suppliers: [...state.suppliers, { ...supplier, id }] };
      }),
      editSupplier: (id, updated) => set((state) => ({
        suppliers: state.suppliers.map(s => s.id === id ? { ...s, ...updated } : s)
      })),
      deleteSupplier: (id) => set((state) => ({
        suppliers: state.suppliers.filter(s => s.id !== id)
      })),
      paySupplier: (id, amount) => set((state) => {
        const supplier = state.suppliers.find(s => s.id === id);
        if (!supplier) return {};

        const dateStr = new Date().toISOString().split('T')[0];
        const newTransaction: Transaction = {
          id: `t_tx_${Date.now()}`,
          type: 'cash_out',
          amount,
          category: 'Supplier Payment',
          paymentMethod: 'Bank',
          date: dateStr,
          description: `Supplier payment to ${supplier.name}`
        };

        return {
          suppliers: state.suppliers.map(s =>
            s.id === id ? { ...s, outstandingPayment: Math.max(0, s.outstandingPayment - amount) } : s
          ),
          transactions: [newTransaction, ...state.transactions]
        };
      }),

      // Transactions
      transactions: mockTransactions,
      addTransaction: (tx) => set((state) => {
        const id = `tx${Date.now()}`;
        return { transactions: [{ ...tx, id }, ...state.transactions] };
      }),
      openingBalance: 12500, // Drawer cash-on-hand at startup
      setOpeningBalance: (amount) => set({ openingBalance: amount }),

      // Staff
      staff: prefillAttendance(initialStaff),
      addStaff: (employee) => set((state) => {
        const id = `e${Date.now()}`;
        return { staff: [...state.staff, { ...employee, id, attendance: {} }] };
      }),
      editStaff: (id, updated) => set((state) => ({
        staff: state.staff.map(emp => emp.id === id ? { ...emp, ...updated } : emp)
      })),
      deleteStaff: (id) => set((state) => ({
        staff: state.staff.filter(emp => emp.id !== id)
      })),
      markAttendance: (id, date, status) => set((state) => ({
        staff: state.staff.map(emp => {
          if (emp.id === id) {
            const updatedAttendance = { ...emp.attendance, [date]: status };
            return { ...emp, attendance: updatedAttendance };
          }
          return emp;
        })
      })),

      // Reset data function
      resetData: () => {
        set({
          menu: initialMenu,
          inventory: initialInventory,
          suppliers: initialSuppliers,
          staff: prefillAttendance(initialStaff),
          bills: generateMockBills(),
          expenses: generateMockExpenses(),
          transactions: generateMockTransactions(generateMockBills(), generateMockExpenses()),
          settings: initialSettings,
          cart: [],
          stockLogs: [
            { id: "log_1", itemId: "i2", itemName: "Milk (1L Packets)", change: 10, action: "in", date: getDateDaysAgo(2) },
            { id: "log_2", itemId: "i2", itemName: "Milk (1L Packets)", change: -6, action: "out", date: getDateDaysAgo(1) },
            { id: "log_3", itemId: "i5", itemName: "Burger Buns", change: 50, action: "in", date: getDateDaysAgo(4) },
          ],
          openingBalance: 12500,
          currentView: 'dashboard'
        });
      }
    }),
    {
      name: 'canteen-management-system-store',
      // Since window/document may not be available immediately in server contexts, wait
    }
  )
)
