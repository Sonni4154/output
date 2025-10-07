import { logger } from '../utils/logger.js';
/**
 * Upsert customer from QuickBooks to NeonDB
 * TODO: Implement full customer upsert logic
 */
export async function upsertCustomer(cust) {
    logger.info(`Upserting customer: ${cust.DisplayName} (${cust.Id})`);
    // TODO: Implement upsert logic once we map all QB fields to DB schema
}
/**
 * Upsert item from QuickBooks to NeonDB
 * TODO: Implement full item upsert logic
 */
export async function upsertItem(item) {
    logger.info(`Upserting item: ${item.Name} (${item.Id})`);
    // TODO: Implement upsert logic once we map all QB fields to DB schema
}
/**
 * Upsert invoice from QuickBooks to NeonDB
 * TODO: Implement full invoice upsert logic
 */
export async function upsertInvoice(inv) {
    logger.info(`Upserting invoice: ${inv.DocNumber} (${inv.Id})`);
    // TODO: Implement upsert logic once we map all QB fields to DB schema
}
/**
 * Upsert estimate from QuickBooks to NeonDB
 * TODO: Implement full estimate upsert logic
 */
export async function upsertEstimate(est) {
    logger.info(`Upserting estimate: ${est.DocNumber} (${est.Id})`);
    // TODO: Implement upsert logic once we map all QB fields to DB schema
}
/**
 * Batch upsert customers
 */
export async function batchUpsertCustomers(customersList) {
    logger.info(`Batch upserting ${customersList.length} customers...`);
    for (const customer of customersList) {
        await upsertCustomer(customer);
    }
    logger.info(`Batch upsert complete: ${customersList.length} customers`);
}
/**
 * Batch upsert items
 */
export async function batchUpsertItems(itemsList) {
    logger.info(`Batch upserting ${itemsList.length} items...`);
    for (const item of itemsList) {
        await upsertItem(item);
    }
    logger.info(`Batch upsert complete: ${itemsList.length} items`);
}
/**
 * Batch upsert invoices
 */
export async function batchUpsertInvoices(invoicesList) {
    logger.info(`Batch upserting ${invoicesList.length} invoices...`);
    for (const invoice of invoicesList) {
        await upsertInvoice(invoice);
    }
    logger.info(`Batch upsert complete: ${invoicesList.length} invoices`);
}
/**
 * Batch upsert estimates
 */
export async function batchUpsertEstimates(estimatesList) {
    logger.info(`Batch upserting ${estimatesList.length} estimates...`);
    for (const estimate of estimatesList) {
        await upsertEstimate(estimate);
    }
    logger.info(`Batch upsert complete: ${estimatesList.length} estimates`);
}
//# sourceMappingURL=upserts.js.map