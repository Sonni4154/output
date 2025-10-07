/**
 * Upsert customer from QuickBooks to NeonDB
 * TODO: Implement full customer upsert logic
 */
export declare function upsertCustomer(cust: any): Promise<void>;
/**
 * Upsert item from QuickBooks to NeonDB
 * TODO: Implement full item upsert logic
 */
export declare function upsertItem(item: any): Promise<void>;
/**
 * Upsert invoice from QuickBooks to NeonDB
 * TODO: Implement full invoice upsert logic
 */
export declare function upsertInvoice(inv: any): Promise<void>;
/**
 * Upsert estimate from QuickBooks to NeonDB
 * TODO: Implement full estimate upsert logic
 */
export declare function upsertEstimate(est: any): Promise<void>;
/**
 * Batch upsert customers
 */
export declare function batchUpsertCustomers(customersList: any[]): Promise<void>;
/**
 * Batch upsert items
 */
export declare function batchUpsertItems(itemsList: any[]): Promise<void>;
/**
 * Batch upsert invoices
 */
export declare function batchUpsertInvoices(invoicesList: any[]): Promise<void>;
/**
 * Batch upsert estimates
 */
export declare function batchUpsertEstimates(estimatesList: any[]): Promise<void>;
//# sourceMappingURL=upserts.d.ts.map