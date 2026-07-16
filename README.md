# Canteen Management System (SaaS Dashboard & POS)

A modern, fast, and feature-rich Web Application designed for canteen owners/admins to manage daily operations, inventory levels, budget targets, financial transactions, staff rosters, and shift reconciliation from one clean dashboard.

---

## 🚀 Tech Stack

- **Core Framework:** React 19 + TypeScript + Vite 8
- **State Management:** Zustand (with automatic `localStorage` persistence)
- **Styling & Theme:** Tailwind CSS v4 (Glassmorphic panels, responsive grids, dark mode)
- **Charts & Visualization:** Recharts (Revenue vs Expenses, popular items progress, expense distribution)
- **Animations:** Framer Motion (Transitions and toggle animations)
- **Icons:** Lucide React

---

## 🛠️ Main Modules & Features

### 1. 📊 Executive Dashboard
- **Real-Time KPIs:** Today's Sales, Today's Expenses, Net Profit, Low Stock Alerts, and Supplier Dues.
- **Visual Analytics:**
  - Revenue vs Expenses tracking bar charts.
  - Interactive payment-channel ring distribution charts.
  - Expense category pie chart breakout.
  - Horizontal progress bar ranks for Top-Selling Menu Items.

### 2. 🛒 Billing Terminal & POS (F2 / F8 / Esc Shortcuts)
- **Fast Cart Interface:** Filter products, search foods instantly, adjust quantities, and set customer details.
- **Keyboard Shortcuts:**
  - `F2`: Focus the search box.
  - `F8`: Submit order checkout.
  - `Esc`: Reset the POS cart.
- **Printable thermal receipts:** Generates standard 80mm receipts with receipt printers and "Save as PDF" styling.

### 3. 🍔 Menu & Profit Margin Analysis
- **Availability Toggle:** Set dishes as active or drafts instantly.
- **Profit Margin Audit:** Sorts items by margins and lists them with classes (`High Margin`, `Moderate`, `Low Margin`).
- **AI Recommendation Engine:** Automatically calculates price points required to hit 60% gross profit targets.

### 4. 💸 Expense & Budget Planner
- **Expense Log:** Record operational costs (Rent, Wages, Maintenance, Gas) and attach receipt files.
- **Budget Target Gages:** Set monthly expenditure limits per category. Actual spends are visualized with dynamic color-coded indicators (Green/Orange/Red) with budget overflow alerts.

### 5. 📦 Stock & Suppliers (GRN & Returns)
- **Raw Inventory:** Tracks materials on hand with reorder alert banners.
- **Goods Received Notes (GRN):** Records shipments received from vendors and automatically increments stock inventory.
- **Purchase Returns:** Return spoiled or expired goods, which automatically deducts inventory and registers refunds.
- **Vendor Payment Logs:** Monitors outstanding supplier debts with payment histories.

### 6. ⚖️ Ledger Cash Reconciliation
- **Register Balance Check:** Calculates drawer cash on hand (Opening Balance + Cash Sales - Cash Outflows).
- **Audit Verification:** Allows cashiers to input counted physical cash to verify register balances, logging discrepancy adjustments (shortage/surplus) to the ledger automatically.

### 7. 📅 Roster & Staff Calendar
- **Staff Directory:** Manage employee roles (Chef, Manager, Cashier) and wages.
- **Daily Attendance Sheet:** Calendar grid to clock staff clock-ins (Present, Absent, Late) on any date.

### 8. 📋 Report Builder & Shift Closing
- **Data Export:** View and download transaction lists, expense journals, or stock directories as `.csv` spreadsheets.
- **Daily Closing Shift Report:** Computes shift aggregates (gross revenue, register cash balances, operating costs, discrepancies) to generate printable daily shift vouchers.

### 9. ⚙️ System Settings & Backups
- **Outlet branding:** Customize outlet names, tax rates (GST %), currency symbols, and receipt footers.
- **Backup & Restores:** Export the entire local database state as a `.json` file and restore it from any previous copy.

---

## 🏃 Local Setup & Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (Node Package Manager)

### Step 1: Install Dependencies
Run the installation command in the root folder:
```bash
npm install
```

### Step 2: Launch Dev Server
Start the local server:
```bash
npm run dev
```
Open `http://localhost:5173` in your web browser.

### Step 3: Production Build
Compile and bundle the files for deployment:
```bash
npm run build
```
The optimized bundle files will be generated in the `dist/` directory.
