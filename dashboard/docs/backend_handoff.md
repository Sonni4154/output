# 🧭 BACKEND-HANDOFF.md  
**Marin Pest Control Dashboard — Backend Technical Guide**

---

## ⚙️ System Overview
Your backend serves as a bridge between:
- **Frontend Dashboard (React/Vite)**
- **QuickBooks Online API**
- **NeonDB (Postgres)**
- **Stack Auth** (for secure authentication)

All data persistence and queries happen through **Drizzle ORM**, using the schema in `db/schema.ts`.

---

## 🏗️ Architecture Flow
```plaintext
Frontend (React Dashboard)
   ↓ authenticated via Stack Auth JWT
Backend (Express + Drizzle)
   ↓
NeonDB (quickbooks.* tables)
   ↔
QuickBooks Online API (via OAuth2)
```

### Key Backend Responsibilities
| Task | Module | Description |
|------|---------|-------------|
| Fetch & sync data | `services/qboClient.ts` | Communicates with QuickBooks API |
| Store synced data | `services/upserts.ts` | Upserts customers, invoices, estimates, items |
| Maintain OAuth tokens | `services/tokens.ts` | Refreshes tokens every 50 minutes |
| Listen for QBO webhooks | `routes/webhook.ts` | Receives changes from QuickBooks |
| Serve data to dashboard | `routes/*.ts` | Handles frontend API requests |
| Database schema | `db/schema.ts` | Defines all tables and relations |

---

## 🧩 QuickBooks ↔ NeonDB Data Model
| QuickBooks Object | Neon Table | Related Table |
|-------------------|-------------|----------------|
| Customer | `quickbooks.customers` | — |
| Invoice | `quickbooks.invoices` | `quickbooks.invoice_line_items` |
| Estimate | `quickbooks.estimates` | `quickbooks.estimate_line_items` |
| Item | `quickbooks.items` | Used by both invoices and estimates |
| OAuth Tokens | `quickbooks.tokens` | Manages access/refresh |

Each record includes a `last_updated` timestamp for sync comparison.

---

## 🧠 Key Database Relations
- **One Customer → Many Invoices / Estimates**
- **One Invoice → Many Invoice Line Items**
- **One Estimate → Many Estimate Line Items**
- **Line Items → One Item**

All foreign keys are handled by Drizzle’s `relations()` mapping in `schema.ts`.

---

## 🧾 API Routes Overview
| Endpoint | Method | Purpose |
|-----------|---------|----------|
| `/api/customers` | GET | Fetch all customers |
| `/api/invoices` | GET | Fetch all invoices with line items |
| `/api/estimates` | GET | Fetch all estimates with line items |
| `/api/sync` | POST | Manual full QuickBooks → Neon sync |
| `/api/qbo/webhook` | POST | QuickBooks webhook receiver |
| `/api/tokens/status` | GET | Returns current token validity info |

### Example: Fetch Invoices with Line Items
```ts
const { data } = await axios.get('/api/invoices', {
  headers: { Authorization: `Bearer ${jwt}` }
});
```

Response example:
```json
[
  {
    "id": 501,
    "docnumber": "INV-501",
    "customerref_name": "John Doe",
    "totalamt": 450,
    "line_items": [
      {
        "description": "Monthly Pest Control",
        "amount": 120,
        "qty": 1,
        "unit_price": 120
      }
    ]
  }
]
```

---

## 🔁 Sync & Automation
| Process | Frequency | Description | Location |
|----------|------------|--------------|-----------|
| Token Refresh | Every 50 min | Refreshes OAuth token | `services/tokens.ts` |
| QuickBooks Sync | Hourly | Pulls recent data | `services/sync.ts` |
| Webhook Listener | Realtime | Updates Neon on QBO changes | `routes/webhook.ts` |

### PM2 Ecosystem Config
```js
module.exports = {
  apps: [
    {
      name: "wemakemarin-tokenup",
      script: "refreshtoken.js",
      cwd: "/var/www/wemakemarin/backend",
      env: { NODE_ENV: "production", PORT: 5000 }
    },
    {
      name: "wemakemarin-sync",
      script: "sync.js",
      cwd: "/var/www/wemakemarin/backend",
      env: { NODE_ENV: "production", PORT: 5001 }
    }
  ]
}
```

---

## 🧰 Developer Workflow
### Setup
```bash
git clone <repo>
cd backend
npm install
```

### Environment
```bash
DATABASE_URL="postgresql://neondb_owner:<password>@<neon-endpoint>/<db>?sslmode=require"
STACK_SECRET_SERVER_KEY="ssk_kdrn35m5mbq98xb8exb4p922ncg80b5yr9ns6rqq0z3x0"
QBO_CLIENT_ID="<client-id>"
QBO_CLIENT_SECRET="<client-secret>"
QBO_REDIRECT_URI="https://api.yourdomain.com/api/qbo/callback"
QBO_REALM_ID="<realm-id>"
QBO_ENV="production"
```

### Start Dev Server
```bash
npm run dev
```

---

## 🧱 Directory Reference
```
backend/
├── db/
│   ├── schema.ts
│   ├── index.ts
├── services/
│   ├── upserts.ts
│   ├── tokens.ts
│   ├── qboClient.ts
├── routes/
│   ├── webhook.ts
│   ├── sync.ts
│   ├── customers.ts
│   ├── invoices.ts
│   ├── estimates.ts
├── utils/
│   ├── auth.ts
│   ├── logger.ts
├── ecosystem.config.js
└── server.ts
```

---

## 🧱 Database Schema Summary
Summarized Neon quickbooks schema covering customers, invoices, estimates, line items, and tokens (see above).

---

## 🧩 Frontend Integration Summary

### Using React Query (TanStack Query)
Install:
```bash
npm install @tanstack/react-query axios
```

Setup in `App.tsx`:
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}
```

Fetch customers:
```tsx
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

function useCustomers(jwt: string) {
  return useQuery(['customers'], async () => {
    const res = await axios.get('/api/customers', {
      headers: { Authorization: `Bearer ${jwt}` }
    });
    return res.data;
  });
}
```

Render in component:
```tsx
const { data: customers, isLoading } = useCustomers(user.token);
if (isLoading) return <Spinner />;

return (
  <table>
    {customers.map((c) => (
      <tr key={c.id}><td>{c.displayname}</td><td>{c.balance}</td></tr>
    ))}
  </table>
);
```

### Auth Headers
Each frontend request should include:
```js
{ headers: { Authorization: `Bearer ${jwt}` } }
```
This JWT is obtained from Stack Auth after user login.

### Common API Hooks
| Hook | Description |
|------|--------------|
| `useCustomers()` | Fetches customers from NeonDB |
| `useInvoices()` | Fetches invoices + line items |
| `useEstimates()` | Fetches estimates + line items |
| `useSyncTrigger()` | POSTs to `/api/sync` to force QuickBooks → Neon sync |

### Frontend Workflow
1. User logs in → Stack Auth issues JWT.
2. React Query uses JWT to fetch dashboard data from backend.
3. Backend reads from NeonDB, already synced with QuickBooks.
4. User may trigger manual sync if needed.

---

## 🚀 Deployment Checklist
1. Deploy backend on server (e.g., `/var/www/wemakemarin/backend`).
2. Run PM2: `pm2 start ecosystem.config.js && pm2 save && pm2 startup`.
3. Configure Nginx + SSL with Certbot.
4. Cloudflare DNS → backend IP with HTTPS proxy.
5. Test endpoints and confirm JWT authentication works.

---

## 💬 Support Notes
- Switch QuickBooks mode via `QBO_ENV=sandbox`.
- Drizzle upserts are idempotent.
- `last_updated` prevents redundant syncs.
- NeonDB is the read/write source of truth.