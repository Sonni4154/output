# Marin Pest Control Dashboard - API Endpoints Reference

## Base URL
- **Development**: `http://localhost:5000`
- **Production**: `https://your-domain.com`

## Authentication
All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 🏥 Health & Status Endpoints

### Health Check
```http
GET /health
```
**Description**: Basic health check for the server  
**Authentication**: None required  
**Response**:
```json
{
  "success": true,
  "message": "Marin Pest Control Backend is healthy",
  "timestamp": "2025-10-06T00:00:00.000Z",
  "version": "2.0.0",
  "environment": "development"
}
```

### Auth Verification
```http
GET /api/auth/verify
```
**Description**: Verify JWT token validity  
**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "message": "Token is valid",
  "user": {
    "id": "user_id",
    "role": "admin"
  },
  "timestamp": "2025-10-06T00:00:00.000Z"
}
```

---

## 👥 Customer Endpoints

### Get All Customers
```http
GET /api/customers
```
**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `search` (optional): Search by display name

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "displayname": "John Doe",
      "companyname": "Doe Company",
      "primaryphone_freeformnumber": "+1-555-0123",
      "primaryemailaddr_address": "john@doe.com",
      "active": true,
      "balance": 150.00,
      "notes": "VIP customer",
      "last_updated": "2025-10-06T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

### Get Customer by ID
```http
GET /api/customers/:id
```
**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "displayname": "John Doe",
    "companyname": "Doe Company",
    "primaryphone_freeformnumber": "+1-555-0123",
    "primaryemailaddr_address": "john@doe.com",
    "active": true,
    "balance": 150.00,
    "notes": "VIP customer",
    "last_updated": "2025-10-06T00:00:00.000Z"
  }
}
```

### Get Customer Statistics
```http
GET /api/customers/stats
```
**Response**:
```json
{
  "success": true,
  "data": {
    "total": 100,
    "active": 85,
    "inactive": 15
  }
}
```

---

## 🧾 Invoice Endpoints

### Get All Invoices
```http
GET /api/invoices
```
**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "docnumber": "INV-001",
      "txndate": "2025-10-01T00:00:00.000Z",
      "duedate": "2025-10-31T00:00:00.000Z",
      "totalamt": 500.00,
      "balance": 500.00,
      "customerref_value": 1,
      "customerref_name": "John Doe",
      "emailstatus": "NotSet",
      "printstatus": "NotSet",
      "last_updated": "2025-10-06T00:00:00.000Z",
      "customer": {
        "id": 1,
        "displayname": "John Doe"
      },
      "line_items": [
        {
          "id": 1,
          "invoice_id": 1,
          "line_num": 1,
          "description": "Pest Control Service",
          "amount": 500.00,
          "qty": 1,
          "unit_price": 500.00,
          "item_ref_value": 1,
          "item_ref_name": "Pest Control",
          "service_date": "2025-10-01T00:00:00.000Z"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "pages": 1
  }
}
```

### Get Invoice by ID
```http
GET /api/invoices/:id
```
**Response**: Same structure as single invoice in the list above

### Get Invoice Statistics
```http
GET /api/invoices/stats
```
**Response**:
```json
{
  "success": true,
  "data": {
    "total": 25,
    "paid": 15,
    "unpaid": 10,
    "totalRevenue": 12500.00,
    "outstandingBalance": 5000.00
  }
}
```

---

## 📋 Estimate Endpoints

### Get All Estimates
```http
GET /api/estimates
```
**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "docnumber": "EST-001",
      "txndate": "2025-10-01T00:00:00.000Z",
      "duedate": "2025-10-31T00:00:00.000Z",
      "expiration_date": "2025-11-30T00:00:00.000Z",
      "totalamt": 750.00,
      "balance": 750.00,
      "status": "Draft",
      "customerref_value": 1,
      "customerref_name": "John Doe",
      "emailstatus": "NotSet",
      "printstatus": "NotSet",
      "private_note": "Follow up in 2 weeks",
      "last_updated": "2025-10-06T00:00:00.000Z",
      "customer": {
        "id": 1,
        "displayname": "John Doe"
      },
      "line_items": [
        {
          "id": 1,
          "estimate_id": 1,
          "line_num": 1,
          "description": "Termite Inspection",
          "amount": 750.00,
          "qty": 1,
          "unit_price": 750.00,
          "item_ref_value": 2,
          "item_ref_name": "Termite Inspection",
          "service_date": "2025-10-15T00:00:00.000Z"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 12,
    "pages": 1
  }
}
```

### Get Estimate by ID
```http
GET /api/estimates/:id
```
**Response**: Same structure as single estimate in the list above

### Get Estimate Statistics
```http
GET /api/estimates/stats
```
**Response**:
```json
{
  "success": true,
  "data": {
    "total": 12,
    "byStatus": {
      "draft": 5,
      "sent": 4,
      "accepted": 2,
      "declined": 1
    }
  }
}
```

---

## 📦 Item Endpoints

### Get All Items
```http
GET /api/items
```
**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "fully_qualified_name": "Pest Control Service",
      "sku": "PC-001",
      "description": "Monthly pest control service",
      "taxclassificationref_value": "TAX001",
      "taxclassificationref_name": "Services",
      "last_updated": "2025-10-06T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 8,
    "pages": 1
  }
}
```

### Get Item by ID
```http
GET /api/items/:id
```
**Response**: Same structure as single item in the list above

### Get Item Statistics
```http
GET /api/items/stats
```
**Response**:
```json
{
  "success": true,
  "data": {
    "total": 8
  }
}
```

---

## 🔄 Sync Endpoints

### Trigger Manual Sync
```http
POST /api/sync
```
**Description**: Manually trigger QuickBooks data synchronization  
**Response**:
```json
{
  "success": true,
  "message": "QuickBooks data synchronization initiated."
}
```

### Get Sync Status
```http
GET /api/sync/status
```
**Response**:
```json
{
  "success": true,
  "data": {
    "lastSync": "2025-10-06T00:00:00.000Z",
    "tokenStatus": {
      "isValid": true,
      "expiresAt": "2025-10-06T01:00:00.000Z"
    },
    "recordCounts": {
      "customers": 100,
      "invoices": 25,
      "estimates": 12,
      "items": 8
    }
  }
}
```

---

## 🔑 Token Endpoints

### Get Token Status
```http
GET /api/tokens/status
```
**Response**:
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "expiresAt": "2025-10-06T01:00:00.000Z",
    "realmId": "123456789",
    "message": "QuickBooks token is valid."
  }
}
```

---

## 🔔 Webhook Endpoints

### QuickBooks Webhook
```http
POST /api/webhook/quickbooks
```
**Description**: Receives QuickBooks webhook notifications  
**Authentication**: None (uses signature verification)  
**Headers**:
- `Intuit-Signature`: HMAC-SHA256 signature
- `Content-Type`: application/json

**Request Body**:
```json
{
  "eventNotifications": [
    {
      "realmId": "123456789",
      "dataChangeEvent": {
        "entities": [
          {
            "name": "Customer",
            "id": "1",
            "operation": "Update",
            "lastUpdated": "2025-10-06T00:00:00.000Z"
          }
        ]
      }
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Webhook received and queued for processing",
  "timestamp": "2025-10-06T00:00:00.000Z"
}
```

### Webhook Health Check
```http
GET /api/webhook/health
```
**Description**: Check webhook endpoint health  
**Authentication**: None required  
**Response**:
```json
{
  "success": true,
  "message": "Webhook endpoint is healthy",
  "timestamp": "2025-10-06T00:00:00.000Z",
  "configured": true
}
```

---

## 📊 Error Responses

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Missing or invalid token"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Something went wrong"
}
```

---

## 🔧 Rate Limiting

- **Window**: 15 minutes
- **Limit**: 100 requests per IP
- **Headers**: Rate limit information included in response headers

---

## 📝 Notes

1. **Pagination**: All list endpoints support pagination with `page` and `limit` parameters
2. **Timestamps**: All timestamps are in ISO 8601 format (UTC)
3. **IDs**: QuickBooks IDs are stored as bigint numbers
4. **Relations**: Related data is included where applicable (e.g., customer info with invoices)
5. **Webhooks**: Processed asynchronously for optimal performance
6. **Authentication**: JWT tokens are verified using Stack Auth JWKS endpoint

---

**Last Updated**: October 6, 2025  
**API Version**: 2.0.0
