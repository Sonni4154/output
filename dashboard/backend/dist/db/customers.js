import { Router } from 'express';
import { db, customers } from '../db/index.js';
import { desc, eq, count } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
const router = Router();
/**
 * GET /api/customers
 * Get all customers with optional pagination and filtering
 */
router.get('/', async (req, res) => {
    try {
        const { page = '1', limit = '50', search } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;
        // Get total count
        const [totalResult] = await db.select({ count: count() }).from(customers);
        const total = totalResult?.count || 0;
        // Get paginated results
        const allCustomers = await db
            .select()
            .from(customers)
            .orderBy(desc(customers.last_updated))
            .limit(limitNum)
            .offset(offset);
        res.json({
            success: true,
            data: allCustomers,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: total,
                pages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        logger.error('Error fetching customers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customers',
            error: error.message,
        });
    }
});
/**
 * GET /api/customers/:id
 * Get a specific customer by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Customer ID is required',
            });
        }
        const customerId = parseInt(id, 10);
        const [customer] = await db
            .select()
            .from(customers)
            .where(eq(customers.id, customerId));
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }
        res.json({
            success: true,
            data: customer,
        });
    }
    catch (error) {
        logger.error(`Error fetching customer with ID ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer',
            error: error.message,
        });
    }
});
/**
 * GET /api/customers/stats
 * Get customer statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const [totalCustomers] = await db.select({ count: count() }).from(customers);
        const [activeCustomers] = await db.select({ count: count() }).from(customers).where(eq(customers.active, true));
        const [inactiveCustomers] = await db.select({ count: count() }).from(customers).where(eq(customers.active, false));
        res.json({
            success: true,
            data: {
                total: totalCustomers?.count || 0,
                active: activeCustomers?.count || 0,
                inactive: inactiveCustomers?.count || 0,
            },
        });
    }
    catch (error) {
        logger.error('Error fetching customer stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer stats',
            error: error.message,
        });
    }
});
export default router;
//# sourceMappingURL=customers.js.map