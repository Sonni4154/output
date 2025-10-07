import { Router, Request, Response } from 'express';
import { syncAllQuickBooksData, syncEntityType, getSyncStatus } from '../services/syncService.js';
import { manualTokenRefresh } from '../services/tokenRefresher.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * POST /api/sync
 * Trigger manual sync of all QuickBooks data
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    logger.info('🔄 Manual sync triggered via API');
    
    await syncAllQuickBooksData();
    
    res.json({
      success: true,
      message: 'QuickBooks data synchronization completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('❌ Manual sync failed:', error);
    res.status(500).json({
      success: false,
      error: 'Synchronization failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/sync/:entityType
 * Trigger manual sync of specific entity type
 */
router.post('/:entityType', async (req: Request, res: Response) => {
  try {
    const { entityType } = req.params;
    
    // Validate entity type
    const validEntityTypes = ['customers', 'items', 'invoices', 'estimates'];
    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid entity type',
        message: `Valid entity types: ${validEntityTypes.join(', ')}`,
      });
    }

    logger.info(`🔄 Manual sync triggered for ${entityType} via API`);
    
    await syncEntityType(entityType as any);
    
    res.json({
      success: true,
      message: `${entityType} synchronization completed successfully`,
      entityType,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`❌ Manual sync failed for ${req.params.entityType}:`, error);
    res.status(500).json({
      success: false,
      error: 'Synchronization failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/sync/status
 * Get current sync status and statistics
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await getSyncStatus();
    
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('❌ Failed to get sync status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/sync/refresh-token
 * Manually refresh QuickBooks token
 */
router.post('/refresh-token', async (req: Request, res: Response) => {
  try {
    logger.info('🔄 Manual token refresh triggered via API');
    
    const success = await manualTokenRefresh();
    
    if (success) {
      res.json({
        success: true,
        message: 'QuickBooks token refreshed successfully',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Token refresh failed',
        message: 'Failed to refresh QuickBooks token',
      });
    }
  } catch (error) {
    logger.error('❌ Manual token refresh failed:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/sync/health
 * Check sync service health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const status = await getSyncStatus();
    
    const isHealthy = status.tokenStatus === 'valid' && status.recordCounts.customers > 0;
    
    res.json({
      success: true,
      healthy: isHealthy,
      data: {
        tokenStatus: status.tokenStatus,
        lastSync: status.lastSync,
        hasData: status.recordCounts.customers > 0,
        recordCounts: status.recordCounts,
      },
    });
  } catch (error) {
    logger.error('❌ Health check failed:', error);
    res.status(500).json({
      success: false,
      healthy: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
