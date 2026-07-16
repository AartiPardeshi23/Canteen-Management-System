# Implementation Plan: Canteen Management System

Design and build a professional, responsive, and visually stunning Canteen Management System web application tailored for canteen owners/admins. The app will feature a sleek SaaS-style dashboard, a high-performance billing system, and robust inventory, financial, and staff management modules.

---

## User Review Required

> [!IMPORTANT]
> **Tech Stack & Implementation Strategy:**
> - **Build System:** React + Vite + TypeScript.
> - **Styling:** Tailwind CSS with a custom, premium design system (custom variables for Emerald, Slate, Orange, glassmorphism, and a dark mode toggle).
> - **State Management:** Zustand with local storage persistence. This ensures a fully functional database state (CRUD operations, billing, inventory, transactions) that persists across page refreshes, without requiring an external database setup. We will pre-populate the store with rich mock data (historical sales, expenses, and current items) so the dashboard works out of the box with realistic charts and statistics.
> - **Component Library:** Instead of installing shadcn/ui's full CLI (which can be fragile in sandbox environments), we will construct custom components styled with Tailwind CSS, Framer Motion, and Lucide React that match or exceed the look and feel of shadcn/ui (glassmorphism, clean borders, smooth transition states, floating labels).
> - **Charts:** Recharts for interactive analytics.

---

## Open Questions
- Do you have a preferred GST/tax rate to set as default? (We will default to 5% GST and make it editable in Settings).
- Do you want keyboard shortcuts customized in a specific way? (We will default to: `F2` for search, `F8` for billing checkout, `Esc` to clear, and number keys to select payment type).

---

## Proposed System Architecture

### 1. File Structure
The project will be organized as follows:
- `/src`
  - `/components` - Reusable UI components (Button, Modal, Card, Table, Input, Badge, etc.)
  - `/store` - Zustand state store (`canteenStore.ts`) containing states for menu, billing, inventory, expenses, staff, suppliers, transactions, and settings.
  - `/utils` - Export helpers, formatters, and report generators.
  - `/views` - Views for the 12 main modules:
    - `DashboardView.tsx`
    - `BillingView.tsx`
    - `MenuView.tsx`
    - `ExpenseView.tsx`
    - `InventoryView.tsx`
    - `SalesView.tsx`
    - `ProfitLossView.tsx`
    - `TransactionView.tsx`
    - `ReportView.tsx`
    - `EmployeeView.tsx`
    - `SupplierView.tsx`
    - `SettingsView.tsx`
  - `App.tsx` - Main router & layout (collapsible sidebar, header with notifications, global search, theme toggle)
  - `index.css` - Custom styles, Tailwind base, and theme variables

---

## Proposed Changes

### Component 1: Setup & Styling
We will initialize the Vite React-TS project, clean up boilerplate, and set up Tailwind CSS.

#### [NEW] [index.css](file:///c:/Users/hp/Downloads/sample/src/index.css)
Contains theme variables for light and dark modes:
- Primary colors: Slate (`#0f172a`), Emerald (`#10b981`), Orange (`#f97316`).
- Dark mode custom styles, cards, glassmorphic layouts, and scrollbars.

### Component 2: State Store (Zustand)
#### [NEW] [canteenStore.ts](file:///c:/Users/hp/Downloads/sample/src/store/canteenStore.ts)
A single source of truth containing:
- **Menu Items**: CRUD actions, profit calculation (`sellingPrice - costPrice`).
- **Cart**: Add/remove, change quantity, apply discounts, select payment type, calculate taxes.
- **Invoices/Bills**: List of generated bills with transaction detail and items purchased.
- **Expenses**: CRUD for tracking cost items with dates and categories.
- **Inventory/Stock**: Ingredients stock with auto-alert when quantity falls below reorder levels.
- **Transactions**: Cash ledger (opening balance, closing balance, cash-in/out records, payment channels).
- **Staff & Attendance**: Staff profiles, roles, salary, and status indicators.
- **Suppliers**: Directory of vendors, outstanding balances, and purchase records.
- **Settings**: General settings (currency, canteen info, tax configuration).

### Component 3: Core Shell Layout
#### [NEW] [App.tsx](file:///c:/Users/hp/Downloads/sample/src/App.tsx)
- Responsive side navigation.
- Top bar with global fast-search (combobox style searching items, settings, bills), notification badge (stock alerts, pending payments), and theme toggle.
- Module controller handling smooth transitions.

### Component 4: Dashboard & Charts
#### [NEW] [DashboardView.tsx](file:///c:/Users/hp/Downloads/sample/src/views/DashboardView.tsx)
- KPI Cards: Sales today, pending orders, monthly growth, low stock count.
- Recharts visualizations: Revenue vs Expenses (bar chart), Monthly Sales (line chart), Payment methods (pie chart), Top-selling foods.
- Recent Transaction stream and Low Stock Alerts widget.

### Component 5: Billing System (POS)
#### [NEW] [BillingView.tsx](file:///c:/Users/hp/Downloads/sample/src/views/BillingView.tsx)
- Fast food menu selection grid with search & category filters.
- Responsive cart panel with controls for quantity adjustments, custom discounts, and customer name/phone.
- One-click payment modes (Cash, UPI, Card).
- Checkout Modal showing a printable receipt layout with printer styling support.

### Component 6: Inventory & Suppliers
#### [NEW] [InventoryView.tsx](file:///c:/Users/hp/Downloads/sample/src/views/InventoryView.tsx)
- Itemized ingredients table with search, sorting, and inline quantity edits.
- Low stock visual indicators.
- Suppliers listing with purchase histories and outstanding balances.

### Component 7: Expense & Finance
#### [NEW] [ExpenseView.tsx](file:///c:/Users/hp/Downloads/sample/src/views/ExpenseView.tsx)
- Add expenses (Rent, Gas, Utilities, Salary, Stock, Misc).
- Table view with filtration by date and category.
- Expense breakdown charts.

#### [NEW] [ProfitLossView.tsx](file:///c:/Users/hp/Downloads/sample/src/views/ProfitLossView.tsx)
- Real-time income statements.
- Gross & Net margin calculations.
- Comparative chart.

### Component 8: Reports & Exports
#### [NEW] [ReportView.tsx](file:///c:/Users/hp/Downloads/sample/src/views/ReportView.tsx)
- Generates downloadable CSV/Excel formats (via client-side blob generation) and PDF-ready styling tables.
- Reports for Sales, Inventory, P&L, and Expenses.

---

## Verification Plan

### Automated Verification
Since this is a client-side Vite application, we will verify its correctness by building it:
- Command: `npm run build` to ensure there are no TypeScript compiler errors or syntax issues.

### Manual Verification
1. Open the application locally by running: `npm run dev`.
2. Check page responsiveness on mobile and tablet viewport widths.
3. Test billing workflow: Add 3 items, apply a 10% discount, select "UPI", click "Generate Bill", verify details on the receipt, and ensure the transaction updates the Dashboard and Sales reports.
4. Add a menu item with a low stock count, navigate to the Dashboard/Inventory, and confirm that the stock warning is displayed.
5. Log a new expense (e.g., $100 for Maintenance) and check that it immediately recalculates Profit & Loss.
