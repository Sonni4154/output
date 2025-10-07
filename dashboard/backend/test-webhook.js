#!/usr/bin/env node

/**
 * Test script for QuickBooks webhook endpoint
 * This simulates a QuickBooks webhook payload
 */

const testWebhook = async () => {
  const webhookUrl = 'http://localhost:5000/api/webhook/quickbooks';
  
  // Sample QuickBooks webhook payload
  const payload = {
    eventNotifications: [
      {
        realmId: "123456789",
        dataChangeEvent: {
          entities: [
            {
              name: "Customer",
              id: "1",
              operation: "Update",
              lastUpdated: new Date().toISOString()
            }
          ]
        }
      }
    ]
  };

  try {
    console.log('🧪 Testing QuickBooks webhook endpoint...');
    console.log('📍 URL:', webhookUrl);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Intuit-Signature': 'test-signature' // Mock signature for testing
      },
      body: JSON.stringify(payload)
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📊 Response Body:', responseText);
    
    if (response.ok) {
      console.log('✅ Webhook test successful!');
    } else {
      console.log('❌ Webhook test failed!');
    }
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
  }
};

// Run the test
testWebhook();
