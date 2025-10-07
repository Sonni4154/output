import { Router } from 'express';
import { db, items } from '../db/index.js';
import { eq, desc, count } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
const router = Router();
/**
 * GET /api/items
 * Get all items
 */
router.get('/', async (req, res) => {
    try {
        const { page = '1', limit = '50' } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;
        const allItems = await db
            .select()
            .from(items)
            .orderBy(desc(items.last_updated))
            .limit(limitNum)
            .offset(offset);
        const [totalResult] = await db.select({ count: count() }).from(items);
        const total = totalResult?.count || 0;
        res.json({
            success: true,
            data: allItems,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: total,
                pages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        logger.error('Error fetching items:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch items',
            error: error.message,
        });
    }
});
/**
 * GET /api/items/:id
 * Get a specific item by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Item ID is required',
            });
        }
        const itemId = parseInt(id, 10);
        const [item] = await db
            .select()
            .from(items)
            .where(eq(items.id, itemId));
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found',
            });
        }
        res.json({
            success: true,
            data: item,
        });
    }
    catch (error) {
        logger.error(`Error fetching item with ID ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch item',
            error: error.message,
        });
    }
});
/**
 * GET /api/items/stats
 * Get item statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const [totalItems] = await db.select({ count: count() }).from(items);
        res.json({
            success: true,
            data: {
                total: totalItems?.count || 0,
            },
        });
    }
    catch (error) {
        logger.error('Error fetching item stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch item stats',
            error: error.message,
        });
    }
});
export default router;
//# sourceMappingURL=items.js.map