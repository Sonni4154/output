# 🧱 QuickBooks Backend: Full Drizzle + Sync + Deployment Setup

This document contains the complete setup for the QuickBooks integration backend using **NeonDB**, **Drizzle ORM**, and **Express**, including upserts, webhooks, sync jobs, token refresh, and PM2 deployment.

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
   CUSTOMERS
----------------------------- */
export const customers = qb.table('customers', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  company_name: varchar('company_name', { length: 255 }),
  display_name: varchar('display_name', { length: 255 }),
  print_on_check_name: varchar('print_on_check_name', { length: 255 }),
  active: boolean('active').default(true),
  primary_phone: varchar('primary_phone', { length: 50 }),
  alternate_phone: varchar('alternate_phone', { length: 50 }),
  mobile: varchar('mobile', { length: 50 }),
  fax: varchar('fax', { length: 50 }),
  primary_email_addr: varchar('primary_email_addr', { length: 255 }),
  web_addr: varchar('web_addr', { length: 500 }),
  taxable: boolean('taxable').default(true),
  balance: doublePrecision('balance'),
  notes: text('notes'),
  company_id: varchar('company_id', { length: 50 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  last_updated: timestamp('last_updated').defaultNow()
}, (table) => ({
  customerNameIdx: index('customer_name_idx').on(table.name),
  customerEmailIdx: index('customer_email_idx').on(table.primary_email_addr)
}));

/* -----------------------------
   ITEMS
----------------------------- */
export const items = qb.table('items', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  sku: varchar('sku', { length: 100 }),
  description: text('description'),
  active: boolean('active').default(true),
  unit_price: doublePrecision('unit_price'),
  type: varchar('type', { length: 50 }),
  qty_on_hand: doublePrecision('qty_on_hand'),
  company_id: varchar('company_id', { length: 50 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  last_updated: timestamp('last_updated').defaultNow()
});

/* -----------------------------
   ESTIMATES & LINE ITEMS
----------------------------- */
export const estimates = qb.table('estimates', {
  id: varchar('id', { length: 50 }).primaryKey(),
  doc_number: varchar('doc_number', { length: 50 }),
  txn_date: timestamp('txn_date'),
  expiration_date: timestamp('expiration_date'),
  total_amt: doublePrecision('total_amt'),
  status: varchar('status', { length: 50 }),
  customer_id: varchar('customer_id', { length: 50 }),
  company_id: varchar('company_id', { length: 50 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  last_updated: timestamp('last_updated').defaultNow()
});

export const estimateLineItems = qb.table('estimate_line_items', {
  id: varchar('id', { length: 50 }).primaryKey(),
  estimate_id: varchar('estimate_id', { length: 50 }).notNull(),
  line_num: integer('line_num'),
  description: text('description'),
  amount: doublePrecision('amount'),
  qty: doublePrecision('qty'),
  unit_price: doublePrecision('unit_price'),
  item_id: varchar('item_id', { length: 50 }),
  item_name: varchar('item_name', { length: 255 }),
  item_type: varchar('item_type', { length: 50 }),
  tax_code_id: varchar('tax_code_id', { length: 50 }),
  service_date: timestamp('service_date'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  last_updated: timestamp('last_updated').defaultNow()
});

/* -----------------------------
   INVOICES
----------------------------- */
export const invoices = qb.table('invoices', {
  id: varchar('id', { length: 50 }).primaryKey(),
  doc_number: varchar('doc_number', { length: 50 }),
  txn_date: timestamp('txn_date'),
  due_date: timestamp('due_date'),
  total_amt: doublePrecision('total_amt'),
  balance: doublePrecision('balance'),
  customer_id: varchar('customer_id', { length: 50 }),
  company_id: varchar('company_id', { length: 50 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  last_updated: timestamp('last_updated').defaultNow()
});
```

---

## 2️⃣ Upsert Functions (QuickBooks → NeonDB)

### Customers
```ts
export async function upsertCustomer(cust) {
  await db.insert(customers)
    .values({
      id: cust.Id,
      name: cust.DisplayName,
      company_name: cust.CompanyName,
      display_name: cust.DisplayName,
      primary_email_addr: cust.PrimaryEmailAddr?.Address,
      active: cust.Active,
      balance: cust.Balance,
      last_updated: new Date()
    })
    .onConflictDoUpdate({
      target: customers.id,
      set: {
        name: cust.DisplayName,
        company_name: cust.CompanyName,
        primary_email_addr: cust.PrimaryEmailAddr?.Address,
        active: cust.Active,
        balance: cust.Balance,
        last_updated: new Date()
      }
    });
}
```

### Invoices
```ts
export async function upsertInvoice(inv) {
  await db.insert(invoices)
    .values({
      id: inv.Id,
      doc_number: inv.DocNumber,
      txn_date: inv.TxnDate,
      due_date: inv.DueDate,
      total_amt: inv.TotalAmt,
      balance: inv.Balance,
      customer_id: inv.CustomerRef?.value,
      last_updated: new Date()
    })
    .onConflictDoUpdate({
      target: invoices.id,
      set: {
        doc_number: inv.DocNumber,
        total_amt: inv.TotalAmt,
        balance: inv.Balance,
        last_updated: new Date()
      }
    });
}
```

### Items
```ts
export async function upsertItem(item) {
  await db.insert(items)
    .values({
      id: item.Id,
      name: item.Name,
      sku: item.Sku,
      description: item.Description,
      active: item.Active,
      unit_price: item.UnitPrice,
      qty_on_hand: item.QtyOnHand,
      last_updated: new Date()
    })
    .onConflictDoUpdate({
      target: items.id,
      set: {
        name: item.Name,
        description: item.Description,
        unit_price: item.UnitPrice,
        qty_on_hand: item.QtyOnHand,
        active: item.Active,
        last_updated: new Date()
      }
    });
}
```

### Estimates + Line Items
```ts
export async function upsertEstimate(est) {
  await db.insert(estimates)
    .values({
      id: est.Id,
      doc_number: est.DocNumber,
      txn_date: est.TxnDate,
      total_amt: est.TotalAmt,
      status: est.Status,
      customer_id: est.CustomerRef?.value,
      last_updated: new Date()
    })
    .onConflictDoUpdate({
      target: estimates.id,
      set: {
        doc_number: est.DocNumber,
        total_amt: est.TotalAmt,
        status: est.Status,
        last_updated: new Date()
      }
    });

  if (est.Line) {
    for (const line of est.Line) {
      await db.insert(estimateLineItems)
        .values({
          id: line.Id,
          estimate_id: est.Id,
          line_num: line.LineNum,
          description: line.Description,
          amount: line.Amount,
          qty: line.Qty,
          unit_price: line.SalesItemLineDetail?.UnitPrice,
          item_id: line.SalesItemLineDetail?.ItemRef?.value,
          item_name: line.SalesItemLineDetail?.ItemRef?.name,
          last_updated: new Date()
        })
        .onConflictDoUpdate({
          target: estimateLineItems.id,
          set: {
            description: line.Description,
            amount: line.Amount,
            qty: line.Qty,
            unit_price: line.SalesItemLineDetail?.UnitPrice,
            item_id: line.SalesItemLineDetail?.ItemRef?.value,
            item_name: line.SalesItemLineDetail?.ItemRef?.name,
            last_updated: new Date()
          }
        });
    }
  }
}
```

---

## 3️⃣ QuickBooks Webhook Handler
```ts
import express from 'express';
import { upsertCustomer, upsertInvoice, upsertEstimate, upsertItem } from '../services/upserts.js';

const router = express.Router();

router.post('/quickbooks/webhook', async (req, res) => {
  try {
    const payload = req.body;
    for (const event of payload.eventNotifications || []) {
      for (const entity of event.dataChangeEvent.entities) {
        switch (entity.name) {
          case 'Customer':
            await upsertCustomer(entity);
            break;
          case 'Invoice':
            await upsertInvoice(entity);
            break;
          case 'Estimate':
            await upsertEstimate(entity);
            break;
          case 'Item':
            await upsertItem(entity);
            break;
        }
      }
    }
    res.status(200).send('Webhook processed successfully');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send('Webhook processing failed');
  }
});

export default router;
```

---

## 4️⃣ Hourly Sync Service
```ts
import cron from 'node-cron';
import { upsertCustomer, upsertInvoice, upsertEstimate, upsertItem } from '../services/upserts.js';
import { getQboData } from '../services/qboClient.js';

cron.schedule('0 * * * *', async () => {
  console.log('⏰ Running hourly QuickBooks ↔ NeonDB sync...');

  try {
    const customers = await getQboData('Customer');
    const invoices = await getQboData('Invoice');
    const estimates = await getQboData('Estimate');
    const items = await getQboData('Item');

    for (const c of customers) await upsertCustomer(c);
    for (const i of invoices) await upsertInvoice(i);
    for (const e of estimates) await upsertEstimate(e);
    for (const it of items) await upsertItem(it);

    console.log('✅ Hourly sync complete');
  } catch (err) {
    console.error('❌ Sync failed:', err);
  }
});
```

---

## 5️⃣ QuickBooks API Client (`getQboData()`)
```ts
import axios from 'axios';
import { sql } from '../db/index.js';

export async function getQboData(entityType) {
  const [token] = await sql`SELECT * FROM quickbooks.tokens WHERE is_active = true ORDER BY last_updated DESC LIMIT 1;`;
  if (!token) throw new Error('No active QuickBooks token found.');

  const realmId = token.realm_id;
  const baseUrl = token.base_url || 'https://quickbooks.api.intuit.com/v3/company';
  const url = `${baseUrl}/${realmId}/query`;
  const query = `SELECT * FROM ${entityType}`;

  try {
    const response = await axios.post(url, query, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/text'
      }
    });
    const records = response.data?.QueryResponse?.[entityType] || [];
    console.log(`✅ Retrieved ${records.length} ${entityType} records.`);
    return records;
  } catch (err) {
    console.error(`❌ Failed to fetch ${entityType} data:`, err.response?.data || err.message);
    throw err;
  }
}
```

---

## 6️⃣ Token Refresh Automation (Every 50 Minutes)
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

cron.schedule('*/50 * * * *', async () => {