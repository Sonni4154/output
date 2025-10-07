import { Router } from 'express';
import { db, invoices } from '../db/index.js';
import { eq, desc, count, sum } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
const router = Router();
/**
 * GET /api/invoices
 * Get all invoices with line items
 */
router.get('/', async (req, res) => {
    try {
        const { page = '1', limit = '50' } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;
        const allInvoices = await db.query.invoices.findMany({
            with: {
                customer: true,
                lineItems: true,
            },
            orderBy: desc(invoices.last_updated),
            limit: limitNum,
            offset: offset,
        });
        const [totalResult] = await db.select({ count: count() }).from(invoices);
        const total = totalResult?.count || 0;
        res.json({
            success: true,
            data: allInvoices,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: total,
                pages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        logger.error('Error fetching invoices:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch invoices',
            error: error.message,
        });
    }
});
/**
 * GET /api/invoices/:id
 * Get a specific invoice by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Invoice ID is required',
            });
        }
        const invoiceId = parseInt(id, 10);
        const invoice = await db.query.invoices.findFirst({
            where: eq(invoices.id, invoiceId),
            with: {
                customer: true,
                lineItems: true,
            },
        });
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found',
            });
        }
        res.json({
            success: true,
            data: invoice,
        });
    }
    catch (error) {
        logger.error(`Error fetching invoice with ID ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch invoice',
            error: error.message,
        });
    }
});
/**
 * GET /api/invoices/stats
 * Get invoice statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const [totalInvoices] = await db.select({ count: count() }).from(invoices);
        const [paidInvoices] = await db.select({ count: count() }).from(invoices).where(eq(invoices.balance, 0));
        const revenueResult = await db.select({ total: sum(invoices.totalamt) }).from(invoices);
        const totalRevenue = revenueResult[0]?.total || 0;
        const balanceResult = await db.select({ total: sum(invoices.balance) }).from(invoices);
        const outstandingBalance = balanceResult[0]?.total || 0;
        res.json({
            success: true,
            data: {
                total: totalInvoices?.count || 0,
                paid: paidInvoices?.count || 0,
                unpaid: (totalInvoices?.count || 0) - (paidInvoices?.count || 0),
                totalRevenue: totalRevenue,
                outstandingBalance: outstandingBalance,
            },
        });
    }
    catch (error) {
        logger.error('Error fetching invoice stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch invoice stats',
            error: error.message,
        });
    }
});
export default router;
//# sourceMappingURL=invoices.js.map