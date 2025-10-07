# 🧱 QuickBooks Drizzle Schema (Fixed for NeonDB)

This schema is cleaned up and aligned with your existing **NeonDB `quickbooks` schema**, using correct types, naming, and relations.

---

## 1️⃣ Schema

```ts
import {
  pgSchema,
  varchar,
  text,
  doublePrecision,
  integer,
  timestamp,
  boolean,
  json,
  bigint,
  index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

const qb = pgSchema('quickbooks');

/* -----------------------------
   COMPANIES
----------------------------- */
export const companies = qb.table('companies', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  last_updated: timestamp('last_updated').defaultNow()
});

/* -----------------------------
   TOKENS (OAuth 2.0)
----------------------------- */
export const tokens = qb.table('tokens', {
  id: bigint('id').primaryKey(),
  company_id: varchar('company_id', { length: 50 }).notNull(),
  access_token: text('access_token').notNull(),
  refresh_token: text('refresh_token'),
  token_type: varchar('token_type', { length: 50 }).default('Bearer'),
  scope: text('scope'),
  expires_at: timestamp('expires_at'),
  refresh_token_expires_at: timestamp('refresh_token_expires_at'),
  realm_id: varchar('realm_id', { length: 50 }),
  base_url: varchar('base_url', { length: 500 }),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  last_updated: timestamp('last_updated').defaultNow()
}, (table) => ({
  realmIdx: index('idx_tokens_realm').on(table.realm_id),
  activeIdx: index('idx_tokens_active').on(table.is_active)
}));

/* -----------------------------
   CUSTOMERS, ITEMS, ESTIMATES, INVOICES
----------------------------- */
// (Omitted for brevity — same as previous section)
```

---

## 2️⃣ Upsert Examples for NeonDB (Drizzle ORM)

(As previously defined for customers, invoices, estimates, items, and tokens)

---

## 3️⃣ QuickBooks Webhook Handler

(Handles QuickBooks → Backend → NeonDB updates)

---

## 4️⃣ Hourly Sync Service (QuickBooks ↔ NeonDB)

(Runs a cron job every hour to verify and sync data)

---

## 5️⃣ QuickBooks API Client (`getQboData()`)

(Utility for authenticated QuickBooks API requests)

---

## 6️⃣ Token Refresh Automation (Every 50 Minutes)

This service ensures your QuickBooks tokens never expire by automatically refreshing them using Intuit’s OAuth 2.0 endpoint.

```ts
import axios from 'axios';
import { sql } from '../db/index.js';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

export async function refreshQuickBooksTokens() {
  const [token] = await sql`SELECT * FROM quickbooks.tokens WHERE is_active = true ORDER BY last_updated DESC LIMIT 1;`;
  if (!token) {
    console.warn('⚠️ No active QuickBooks token found for refresh.');
    return;
  }

  try {
    console.log('🔄 Refreshing QuickBooks access token...');
    const response = await axios.post(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token,
      }),
      {
        headers: {
          Authorization: `Basic ${process.env.QBO_AUTH_BASIC}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const newAccessToken = response.data.access_token;
    const newRefreshToken = response.data.refresh_token || token.refresh_token;
    const expiresAt = new Date(Date.now() + response.data.expires_in * 1000);

    await sql`
      INSERT INTO quickbooks.tokens (access_token, refresh_token, realm_id, expires_at, last_updated)
      VALUES (${newAccessToken}, ${newRefreshToken}, ${token.realm_id}, ${expiresAt}, NOW())
      ON CONFLICT (realm_id)
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at,
        last_updated = NOW();
    `;

    console.log('✅ QuickBooks token refreshed successfully');
  } catch (err) {
    console.error('❌ Token refresh failed:', err.response?.data || err.message);
  }
}

// Schedule token refresh every 50 minutes
cron.schedule('*/50 * * * *', async () => {
  console.log('⏰ Running scheduled QuickBooks token refresh...');
  await refreshQuickBooksTokens();
});
```

---

## ✅ Summary

- Added **token refresh automation** that renews QuickBooks OAuth tokens every 50 minutes.
- Uses `cron` for scheduled execution and `ON CONFLICT` to safely upsert into `quickbooks.tokens`.
- Fully integrates with `getQboData()` and hourly sync.

Next: I can add a **PM2 ecosystem configuration** to keep the token refresher and sync services running persistently in production.

