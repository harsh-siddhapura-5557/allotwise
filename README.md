# AllotWise — IPO Portfolio Management Platform

A premium fintech dashboard for managing IPO and SME IPO applications, allotments, profits, and records for families and small groups.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Create and migrate the database
npx prisma db push

# 4. Seed with sample data (optional)
npx tsx prisma/seed.ts

# 5. Start the development server
npm run dev
```

Visit **http://localhost:3000**

---

## 🔐 Demo Credentials

| Role    | Email                    | Password   |
|---------|--------------------------|------------|
| Admin   | admin@allotwise.com      | admin123   |
| Partner | partner@allotwise.com    | partner123 |

---

## 📁 Project Structure

```
allotwise/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (dashboard)/           # Protected dashboard layout
│   │   ├── dashboard/         # Main dashboard with charts
│   │   ├── members/           # Member management
│   │   ├── upi/               # UPI ID management
│   │   ├── ipos/              # IPO master list
│   │   ├── applications/      # IPO applications
│   │   ├── allotments/        # Allotment tracking
│   │   ├── reports/           # Reports (member/IPO/UPI)
│   │   └── activity/          # Activity log
│   ├── api/                   # REST API routes
│   │   ├── auth/              # Login, logout, me
│   │   ├── members/           # CRUD for members
│   │   ├── upi/               # CRUD for UPI IDs
│   │   ├── ipos/              # CRUD for IPOs
│   │   ├── applications/      # CRUD for applications
│   │   ├── allotments/        # Allotment management
│   │   ├── reports/           # Report generation
│   │   ├── activity/          # Activity logs
│   │   └── dashboard/         # Dashboard stats
│   └── globals.css
├── components/
│   └── layout/
│       ├── Sidebar.tsx        # Navigation sidebar
│       └── Header.tsx         # Top header with theme toggle
├── lib/
│   ├── auth.ts                # JWT auth utilities
│   ├── prisma.ts              # Prisma client singleton
│   └── utils.ts               # Helpers (format, export, etc.)
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Sample data seeder
└── package.json
```

---

## ✨ Features

### Dashboard
- Stats: Total applications, allotments, investment, profit, loss, active IPOs
- Bar chart: Applications over time
- Pie chart: Status breakdown
- Recent activity feed

### Members Management
- Add/Edit/Delete members
- PAN number validation
- Search by name/PAN/mobile
- Export to CSV

### UPI Management
- Multiple UPI IDs per member
- Link to member
- Export to CSV

### IPO Master
- Mainboard & SME IPO tracking
- Issue price, lot size, dates, status
- Auto-calculate lot value
- Filter by type/status

### Applications
- Full CRUD with pagination (15/page)
- Auto-calculate applied amount from IPO + lot quantity
- Filter by status/member/IPO
- Status: Applied → Allotted/Not Allotted → Refunded/Sold
- Export to CSV

### Allotments
- Link to applications
- Track: Shares, issue price, listing price, sell price
- Auto-calculate: Profit = (Sell - Issue) × Shares
- Summary: Total invested, profit, loss, net P&L, return %

### Reports
- **Member Wise**: Applications, allotments, investment, profit, loss, net P&L
- **IPO Wise**: Applications, allotments, allotment rate, profit
- **UPI Wise**: Applications, allotments, allotment rate bar
- All reports exportable to CSV

### Activity Log
- Tracks every add/update/delete action
- Shows: Who, what action, details, timestamp
- Role badge for user
- Paginated (25/page)

---

## 🎨 Tech Stack

| Layer        | Technology              |
|-------------|-------------------------|
| Framework    | Next.js 15 (App Router) |
| Language     | TypeScript              |
| Styling      | Tailwind CSS            |
| Database     | SQLite via Prisma ORM   |
| Auth         | JWT + HTTP-only cookies |
| Charts       | Recharts                |
| Icons        | Lucide React            |

---

## 🔑 Authentication

- JWT tokens stored in HTTP-only cookies (7 day expiry)
- Two roles: **ADMIN** and **PARTNER**
- Admin can delete records; Partner can add/edit
- Protected routes redirect to `/login`

---

## 📊 Database Schema

```
User → ActivityLog
Member → UpiId → Application → Allotment
IPO → Application → ActivityLog
```

---

## 🌙 Dark / Light Mode

Click the moon/sun icon in the top-right header to toggle. Preference saved to localStorage.

---

## 📤 CSV Export

Every major table has an Export button that downloads a CSV with current filtered data.

---

## 🚢 Production Deployment

```bash
# Build
npm run build

# Set production env
JWT_SECRET=your-secret-key-here

# Start
npm start
```

For production, consider migrating from SQLite to PostgreSQL by changing the Prisma datasource provider.
