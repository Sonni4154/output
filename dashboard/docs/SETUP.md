# 🚀 Marin Pest Control Dashboard - Complete Setup Guide

## 📋 QuickBooks URLs Configuration

### For QuickBooks Developer Dashboard:

1. **Webhook URL**: `https://your-domain.com/api/webhook/quickbooks`
2. **Redirect URL**: `https://your-domain.com/auth/qbo/callback`
3. **Application Launch URL**: `https://your-domain.com/auth/qbo/launch`
4. **Application Disconnect URL**: `https://your-domain.com/auth/qbo/disconnect`

### For Local Development (using ngrok):
```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 5000
```

Then use the ngrok URL (e.g., `https://abc123.ngrok.io`) instead of `your-domain.com`

## 🔧 Environment Setup

### 1. Create Backend Environment File

Create `backend/.env` with the following content:

```bash
# ===========================================
# DATABASE
# ===========================================
DATABASE_URL=postgresql://neondb_owner:npg_HjVGMveC67BO@ep-holy-scene-afwzz2d6-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require

# ===========================================
# STACK AUTH (JWT Authentication)
# ===========================================
STACK_AUTH_URL=https://api.stack-auth.com
STACK_PROJECT_ID=5fb1ffdb-d2a3-4a10-8824-7cfd62ab0f06
STACK_SECRET_SERVER_KEY=ssk_ze312w133kthnbmdwfv6w1vbbsjew1ftpm5nwr9vxp1d8
STACK_AUTH_AUDIENCE=https://api.stack-auth.com/api/v1/projects/5fb1ffdb-d2a3-4a10-8824-7cfd62ab0f06

# ===========================================
# QUICKBOOKS ONLINE INTEGRATION
# ===========================================
# Get these from your QuickBooks Developer Dashboard
QBO_CLIENT_ID=your_qbo_client_id_here
QBO_CLIENT_SECRET=your_qbo_client_secret_here
QBO_REDIRECT_URI=https://your-domain.com/auth/qbo/callback
QBO_REALM_ID=your_company_realm_id_here
QBO_ENV=sandbox
QBO_WEBHOOK_URL=https://your-domain.com/api/webhook/quickbooks
QBO_WEBHOOK_VERIFIER_TOKEN=your_webhook_verifier_token_here
QBO_APP_LAUNCH_URL=https://your-domain.com/auth/qbo/launch
QBO_APP_DISCONNECT_URL=https://your-domain.com/auth/qbo/disconnect

# ===========================================
# LLM API KEYS
# ===========================================
OPENAI_API_KEY=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
GOOGLE_AI_API_KEY=AIzaSyDEPEAwHn4l3B5OtQRcmgdOYyvL5vr7QOc
MISTRAL_API_KEY=jlo9qLrA618BVucLY9qV9eKJX0Y1AHXn

# ===========================================
# DASHBOARD INTEGRATION API KEYS
# ===========================================
JOTFORM_API_KEY=0b0a61388bf72f9d6fad871687399707
JIBBLE_API_KEY=24b16520-fc0b-47a5-8665-98215e29b867

# ===========================================
# GOOGLE INTEGRATION
# ===========================================
GOOGLE_CLIENT_ID=32614029755-bh0b4bg1vd7a1unlu5ma7rvn38efqnr5.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# ===========================================
# GOOGLE CALENDAR INTEGRATION
# ===========================================
GOOGLE_CALENDAR_INSECT_CONTROL_ID=57d4687457176ca4e4b211910e7a69c19369d08081871d9f8ab54d234114c991@group.calendar.google.com
GOOGLE_CALENDAR_RODENT_CONTROL_ID=3fc1d11fe5330c3e1c4693570419393a1d74036ef1b4cb866dd337f8c8cc6c8e@group.calendar.google.com
GOOGLE_CALENDAR_TERMITES_ID=64a3c24910c43703e539ab1e9ac41df6591995c63c1e4f208f76575a50149610@group.calendar.google.com
GOOGLE_CALENDAR_TRAP_CHECK_ID=529c43e689235b82258319c30e7449e97c8788cb01cd924e0f4d0b4c34305cdb@group.calendar.google.com
GOOGLE_CALENDAR_INSPECTIONS_ID=c81f827b8eeec1453d1f3d90c7bca859a1d342953680c4a0448e6b0b96b8bb4a@group.calendar.google.com
GOOGLE_CALENDAR_TRADEWORK_ID=97180df5c9275973f1c51e234ec36de62c401860313b0b734704f070e5acf411@group.calendar.google.com
GOOGLE_CALENDAR_INTEGRATIONS_ID=spencermreiser@gmail.com
GOOGLE_CALENDAR_EMPLOYEE_NOTES_ID=marinpestcontrol@gmail.com

# ===========================================
# HUBSPOT INTEGRATION
# ===========================================
HUBSPOT_ACCESS_TOKEN=f7badacf-02e1-4153-9efc-41d048f8623e

# ===========================================
# SERVER CONFIGURATION
# ===========================================
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_SECRET=your_session_secret_here

# ===========================================
# DEVELOPMENT SETTINGS
# ===========================================
SKIP_AUTH=true
MOCK_QBO_DATA=true
```

### 2. Create Frontend Environment File

Create `frontend/.env` with the following content:

```bash
# ===========================================
# API CONFIGURATION
# ===========================================
VITE_API_BASE_URL=http://localhost:5000

# ===========================================
# STACK AUTH (Frontend)
# ===========================================
VITE_STACK_AUTH_URL=https://api.stack-auth.com
VITE_STACK_PROJECT_ID=5fb1ffdb-d2a3-4a10-8824-7cfd62ab0f06
VITE_STACK_PUBLISHABLE_CLIENT_KEY=pck_h8mejt0bh4277fgzhc0r0ap5w2dx6a2y3bz74dngp70r0

# ===========================================
# DEVELOPMENT SETTINGS
# ===========================================
VITE_DEV_MODE=true
VITE_MOCK_AUTH=true
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### 2. Start Development Servers
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:backend  # Backend only
npm run dev:frontend # Frontend only
```

### 3. Test the Webhook
```bash
# Test the webhook endpoint
npm run test:webhook
```

## 🔗 QuickBooks Setup Steps

### 1. Get QuickBooks Credentials
1. Go to [QuickBooks Developer Dashboard](https://developer.intuit.com/)
2. Create a new app or use existing app
3. Get your `Client ID` and `Client Secret`
4. Set up the URLs as specified above

### 2. Configure Webhook
1. In your QuickBooks app settings, set the webhook URL to:
   ```
   https://your-domain.com/api/webhook/quickbooks
   ```
2. Get the webhook verifier token and add it to your `.env` file

### 3. Test Webhook Delivery
1. Start your backend server
2. The webhook endpoint will respond with 200 OK immediately
3. Check your logs to see webhook events being processed

## 📊 Available Endpoints

### Backend API Endpoints
- `GET /health` - Health check
- `GET /api/customers` - Get all customers
- `GET /api/invoices` - Get all invoices
- `GET /api/estimates` - Get all estimates
- `GET /api/items` - Get all items
- `POST /api/sync` - Trigger manual sync
- `GET /api/tokens/status` - Check token status
- `POST /api/webhook/quickbooks` - QuickBooks webhook
- `GET /api/webhook/health` - Webhook health check

### Frontend
- `http://localhost:5173` - React dashboard

## 🚀 Production Deployment

### Using PM2
```bash
# Start all services
npm run pm2:start

# Check status
npm run pm2:status

# View logs
npm run pm2:logs

# Stop services
npm run pm2:stop
```

## 🔧 Troubleshooting

### Webhook Issues
1. Make sure your server is running on the correct port
2. Check that the webhook URL is accessible from the internet
3. Verify the webhook verifier token matches your QuickBooks app
4. Check server logs for any errors

### Database Issues
1. Verify your DATABASE_URL is correct
2. Make sure your NeonDB database is accessible
3. Check that the schema tables exist

### Authentication Issues
1. Verify your Stack Auth credentials
2. Check that the JWT tokens are being generated correctly
3. Ensure CORS is configured properly

## 📝 Next Steps

1. Set up your QuickBooks app with the provided URLs
2. Configure your environment variables
3. Start the development servers
4. Test the webhook endpoint
5. Deploy to production when ready

The webhook delivery error should be resolved once you start the backend server and configure the webhook URL in QuickBooks!
