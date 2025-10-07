import { Router, Request, Response } from 'express';
import { upsertCustomer, upsertInvoice, upsertEstimate, upsertItem } from '../services/upserts.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

const router = Router();

/**
 * POST /api/webhook/quickbooks
 * Handle QuickBooks webhook notifications
 * CRITICAL: Must respond with 200 OK immediately, then process asynchronously
 */
router.post('/quickbooks', (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const signature = req.headers['intuit-signature'] as string;

    // Verify webhook signature (if configured)
    if (process.env.QBO_WEBHOOK_VERIFIER_TOKEN) {
      const isValid = verifyWebhookSignature(payload, signature);
      if (!isValid) {
        logger.warn('Invalid webhook signature received');
        return res.status(401).json({
          success: false,
          error: 'Invalid signature',
        });
      }
    }

    logger.info('📨 QuickBooks webhook received:', {
      eventNotifications: payload.eventNotifications?.length || 0,
    });

    // CRITICAL: Respond immediately with 200 OK
    res.status(200).json({
      success: true,
      message: 'Webhook received and queued for processing',
      timestamp: new Date().toISOString(),
    });

    // Process webhook events asynchronously (don't await)
    if (payload.eventNotifications && Array.isArray(payload.eventNotifications)) {
      processWebhookEventsAsync(payload.eventNotifications).catch((error) => {
        logger.error('❌ Async webhook processing failed:', error);
      });
    }
  } catch (error) {
    logger.error('❌ Webhook processing failed:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Process webhook events asynchronously
 */
async function processWebhookEventsAsync(events: any[]): Promise<void> {
  try {
    logger.info(`🔄 Processing ${events.length} webhook events asynchronously`);
    
    for (const event of events) {
      await processWebhookEvent(event);
    }
    
    logger.info('✅ All webhook events processed successfully');
  } catch (error) {
    logger.error('❌ Error in async webhook processing:', error);
    throw error;
  }
}

/**
 * Process individual webhook event
 */
async function processWebhookEvent(event: any): Promise<void> {
  try {
    if (!event.dataChangeEvent || !event.dataChangeEvent.entities) {
      logger.warn('Invalid webhook event structure:', event);
      return;
    }

    const entities = event.dataChangeEvent.entities;
    
    for (const entity of entities) {
      await processEntityChange(entity);
    }
  } catch (error) {
    logger.error('Error processing webhook event:', error);
    throw error;
  }
}

/**
 * Process individual entity change
 */
async function processEntityChange(entity: any): Promise<void> {
  try {
    const entityName = entity.name;
    const entityId = entity.id;

    logger.info(`🔄 Processing ${entityName} change for ID: ${entityId}`);

    switch (entityName) {
      case 'Customer':
        await upsertCustomer(entity);
        logger.info(`✅ Customer ${entityId} updated`);
        break;

      case 'Invoice':
        await upsertInvoice(entity);
        logger.info(`✅ Invoice ${entityId} updated`);
        break;

      case 'Estimate':
        await upsertEstimate(entity);
        logger.info(`✅ Estimate ${entityId} updated`);
        break;

      case 'Item':
        await upsertItem(entity);
        logger.info(`✅ Item ${entityId} updated`);
        break;

      default:
        logger.info(`ℹ️ Unhandled entity type: ${entityName}`);
    }
  } catch (error) {
    logger.error(`Error processing ${entity.name} change:`, error);
    throw error;
  }
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(payload: any, signature: string): boolean {
  try {
    const verifierToken = process.env.QBO_WEBHOOK_VERIFIER_TOKEN;
    if (!verifierToken) {
      logger.warn('Webhook verifier token not configured');
      return true; // Skip verification if not configured
    }

    const payloadString = JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', verifierToken)
      .update(payloadString)
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    logger.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * GET /api/webhook/health
 * Webhook endpoint health check
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is healthy',
    timestamp: new Date().toISOString(),
    configured: !!process.env.QBO_WEBHOOK_VERIFIER_TOKEN,
  });
});

export default router;
