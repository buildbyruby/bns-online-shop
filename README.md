# BNS Systems

> A role-based business operations platform for managing sales, order processing, and inventory, built for a real retail operation in Nairobi (Buruburu).

BNS Systems replaces manual order tracking and paper-based sales logs with a single system, split into three separate logins so each part of the business only sees what's relevant to their role.

## What it does

The app starts at a role selection screen with three separate areas, each with its own login and signup:

- **Admin.** Global control over inventory, products, and analytics across the whole business.
- **Salesperson.** Customer CRM, sales entry, and habit/performance tracking for the sales team.
- **Order Processor.** Manages incoming orders, assigns them to staff, tracks status (pending, processing, completed, cancelled), and filters by delivery region (covering specific zones like Buruburu Phase 1 through 5, Harambee, and surrounding outskirts).

Each dashboard pulls live data from Supabase and joins it manually in the frontend, for example matching an order to its customer and the salesperson who closed it, so staff can see the full picture of an order without switching screens.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 19 + Next.js 16 | File-based routing made it straightforward to separate admin, sales, and order-processor into isolated route groups, each with its own auth flow |
| Database | Supabase (Postgres) | Real-time data, fast setup, and role-based data access without building a custom backend from scratch |
| Styling | Tailwind CSS v4 | Fast iteration on a dense, data-heavy dashboard UI |
| Animation | Framer Motion | Used for transitions on the dashboards |
| Icons | Lucide React | Consistent icon set across all three roles |

**Note on Electron:** Electron is listed as a dependency for a planned desktop version of this app, but the desktop build is not wired up yet. Currently this runs as a web app only.

## Project structure

```
app/
├── page.tsx                       # Role selection entry screen
├── admin/
│   ├── login/, signup/, reset-password/
│   └── dashboard/page.tsx         # Inventory, products, analytics
├── sales/
│   ├── login/, signup/
│   └── dashboard/                 # CRM, sales entry, habit tracking
├── order-processor/
│   ├── login/, signup/, reset-password/
│   └── dashboard/page.tsx         # Orders, staff, regional filtering
lib/
└── supabase.ts                    # Supabase client
```

## Getting started

```bash
git clone https://github.com/<your-username>/bns-online-shop.git
cd bns-online-shop
npm install
cp .env.example .env.local   # add your own keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Required environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Supabase tables expected

This app expects `orders`, `sales_force`, and `customers` tables in Supabase, joined in the frontend by `customer_id` and `salesperson_id`.

## What I'd improve next

- **Server-side joins.** Orders, staff, and customers are currently joined manually in the frontend after three separate fetches. Moving this to a Supabase view or RPC function would be faster and more reliable as data grows.
- **Finish the Electron build.** Wire up the desktop packaging so this can run as a standalone app for in-store use, not just in a browser.
- **Row-level security.** Add Supabase RLS policies so each role can only read and write the data relevant to them at the database level, not just in the UI.

---

Built by Ruby Kituli
