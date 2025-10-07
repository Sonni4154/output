import { pgSchema, text, doublePrecision, timestamp, boolean, bigint, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
const qb = pgSchema('quickbooks');
/* -----------------------------
   TOKENS (OAuth 2.0)
----------------------------- */
export const tokens = qb.table('tokens', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    access_token: text('access_token').notNull(),
    refresh_token: text('refresh_token'),
    realm_id: text('realm_id'),
    expires_at: timestamp('expires_at'),
    created_at: timestamp('created_at').defaultNow(),
    last_updated: timestamp('last_updated').defaultNow()
});
/* -----------------------------
   CUSTOMERS (Matches existing DB structure)
----------------------------- */
export const customers = qb.table('customers', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    displayname: text('displayname'),
    companyname: text('companyname'),
    printoncheckname: text('printoncheckname'),
    active: boolean('active'),
    primaryphone_freeformnumber: text('primaryphone_freeformnumber'),
    primaryemailaddr_address: text('primaryemailaddr_address'),
    mobile_freeformnumber: text('mobile_freeformnumber'),
    fax_freeformnumber: text('fax_freeformnumber'),
    alternatephone_freeformnumber: text('alternatephone_freeformnumber'),
    webaddr_uri: text('webaddr_uri'),
    taxable: boolean('taxable'),
    balance: doublePrecision('balance'),
    balancewithjobs: doublePrecision('balancewithjobs'),
    notes: text('notes'),
    givenname: text('givenname'),
    familyname: text('familyname'),
    middlename: text('middlename'),
    title: text('title'),
    suffix: text('suffix'),
    fullyqualifiedname: text('fullyqualifiedname'),
    synctoken: bigint('synctoken', { mode: 'number' }),
    metadata_createtime: text('metadata_createtime'),
    metadata_lastupdatedtime: text('metadata_lastupdatedtime'),
    billaddr_id: bigint('billaddr_id', { mode: 'number' }),
    billaddr_line1: text('billaddr_line1'),
    billaddr_line2: text('billaddr_line2'),
    billaddr_city: text('billaddr_city'),
    billaddr_country: text('billaddr_country'),
    billaddr_countrysubdivisioncode: text('billaddr_countrysubdivisioncode'),
    billaddr_postalcode: text('billaddr_postalcode'),
    shipaddr_id: bigint('shipaddr_id', { mode: 'number' }),
    shipaddr_line1: text('shipaddr_line1'),
    shipaddr_line2: text('shipaddr_line2'),
    shipaddr_city: text('shipaddr_city'),
    shipaddr_country: text('shipaddr_country'),
    shipaddr_countrysubdivisioncode: text('shipaddr_countrysubdivisioncode'),
    shipaddr_postalcode: text('shipaddr_postalcode'),
    job: boolean('job'),
    billwithparent: boolean('billwithparent'),
    currencyref_value: text('currencyref_value'),
    currencyref_name: text('currencyref_name'),
    preferreddeliverymethod: text('preferreddeliverymethod'),
    isproject: boolean('isproject'),
    cliententityid: bigint('cliententityid', { mode: 'number' }),
    domain: text('domain'),
    sparse: boolean('sparse'),
    v4idpseudonym: text('v4idpseudonym'),
    parentref_value: bigint('parentref_value', { mode: 'number' }),
    level: bigint('level', { mode: 'number' }),
    salestermref_value: bigint('salestermref_value', { mode: 'number' }),
    salestermref_name: text('salestermref_name'),
    defaulttaxcoderef_value: bigint('defaulttaxcoderef_value', { mode: 'number' }),
    last_updated: timestamp('last_updated')
});
/* -----------------------------
   ITEMS (Matches existing DB structure)
----------------------------- */
export const items = qb.table('items', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    fully_qualified_name: text('fully_qualified_name'),
    sku: text('sku'),
    description: text('description'),
    taxclassificationref_value: text('taxclassificationref_value'),
    taxclassificationref_name: text('taxclassificationref_name'),
    last_updated: timestamp('last_updated')
});
/* -----------------------------
   INVOICES (Matches existing DB structure)
----------------------------- */
export const invoices = qb.table('invoices', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    docnumber: text('docnumber'),
    txndate: date('txndate'),
    duedate: date('duedate'),
    totalamt: doublePrecision('totalamt'),
    balance: doublePrecision('balance'),
    customerref_value: bigint('customerref_value', { mode: 'number' }),
    customerref_name: text('customerref_name'),
    customermemo_value: text('customermemo_value'),
    synctoken: bigint('synctoken', { mode: 'number' }),
    metadata_createtime: text('metadata_createtime'),
    metadata_lastupdatedtime: text('metadata_lastupdatedtime'),
    metadata_lastmodifiedbyref_value: text('metadata_lastmodifiedbyref_value'),
    currencyref_value: text('currencyref_value'),
    currencyref_name: text('currencyref_name'),
    billemail_address: text('billemail_address'),
    billemailcc_address: text('billemailcc_address'),
    billemailbcc_address: text('billemailbcc_address'),
    emailstatus: text('emailstatus'),
    printstatus: text('printstatus'),
    billaddr_id: bigint('billaddr_id', { mode: 'number' }),
    billaddr_line1: text('billaddr_line1'),
    billaddr_line2: text('billaddr_line2'),
    billaddr_city: text('billaddr_city'),
    billaddr_country: text('billaddr_country'),
    billaddr_countrysubdivisioncode: text('billaddr_countrysubdivisioncode'),
    billaddr_postalcode: bigint('billaddr_postalcode', { mode: 'number' }),
    shipaddr_id: bigint('shipaddr_id', { mode: 'number' }),
    shipaddr_line1: text('shipaddr_line1'),
    shipaddr_line2: text('shipaddr_line2'),
    shipaddr_city: text('shipaddr_city'),
    shipaddr_country: text('shipaddr_country'),
    shipaddr_countrysubdivisioncode: text('shipaddr_countrysubdivisioncode'),
    shipaddr_postalcode: bigint('shipaddr_postalcode', { mode: 'number' }),
    salestermref_value: bigint('salestermref_value', { mode: 'number' }),
    salestermref_name: text('salestermref_name'),
    domain: text('domain'),
    sparse: boolean('sparse'),
    allowipnpayment: boolean('allowipnpayment'),
    allowonlinepayment: boolean('allowonlinepayment'),
    allowonlinecreditcardpayment: boolean('allowonlinecreditcardpayment'),
    allowonlineachpayment: boolean('allowonlineachpayment'),
    applytaxafterdiscount: boolean('applytaxafterdiscount'),
    privatenote: text('privatenote'),
    notes: text('notes'),
    line_count: bigint('line_count', { mode: 'number' }),
    line_id: text('line_id'),
    line_linenum: text('line_linenum'),
    line_description: text('line_description'),
    line_amount: text('line_amount'),
    line_detailtype: text('line_detailtype'),
    line_salesitemlinedetail: text('line_salesitemlinedetail'),
    txntaxdetail_totaltax: doublePrecision('txntaxdetail_totaltax'),
    invoicelink: text('invoicelink'),
    last_updated: timestamp('last_updated')
});
/* -----------------------------
   ESTIMATES (Stub - to be completed)
----------------------------- */
export const estimates = qb.table('estimates', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    docnumber: text('docnumber'),
    txndate: date('txndate'),
    totalamt: doublePrecision('totalamt'),
    customerref_value: bigint('customerref_value', { mode: 'number' }),
    customerref_name: text('customerref_name'),
    last_updated: timestamp('last_updated')
});
/* -----------------------------
   LINE ITEMS (Stub tables)
----------------------------- */
export const invoiceLineItems = qb.table('invoice_line_items', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    invoice_id: bigint('invoice_id', { mode: 'number' }),
    description: text('description'),
    amount: doublePrecision('amount'),
    qty: doublePrecision('qty'),
    last_updated: timestamp('last_updated')
});
export const estimateLineItems = qb.table('estimate_line_items', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    estimate_id: bigint('estimate_id', { mode: 'number' }),
    description: text('description'),
    amount: doublePrecision('amount'),
    qty: doublePrecision('qty'),
    last_updated: timestamp('last_updated')
});
/* -----------------------------
   RELATIONS
----------------------------- */
export const customersRelations = relations(customers, ({ many }) => ({
    invoices: many(invoices),
    estimates: many(estimates)
}));
export const invoicesRelations = relations(invoices, ({ one, many }) => ({
    customer: one(customers, {
        fields: [invoices.customerref_value],
        references: [customers.id]
    }),
    lineItems: many(invoiceLineItems)
}));
export const invoiceLineItemsRelations = relations(invoiceLineItems, ({ one }) => ({
    invoice: one(invoices, {
        fields: [invoiceLineItems.invoice_id],
        references: [invoices.id]
    })
}));
export const estimatesRelations = relations(estimates, ({ one, many }) => ({
    customer: one(customers, {
        fields: [estimates.customerref_value],
        references: [customers.id]
    }),
    lineItems: many(estimateLineItems)
}));
export const estimateLineItemsRelations = relations(estimateLineItems, ({ one }) => ({
    estimate: one(estimates, {
        fields: [estimateLineItems.estimate_id],
        references: [estimates.id]
    })
}));
//# sourceMappingURL=schema.js.map