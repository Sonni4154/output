# 🚀 Marin Pest Control Dashboard

A comprehensive pest control business management dashboard with QuickBooks Online integration, Google Calendar synchronization, and AI-powered features.

## 🎯 Quick Start

### Windows
```bash
# Run the management console
manage.bat
```

### Linux/macOS
```bash
# Make executable (first time only)
chmod +x manage.sh

# Run the management console
./manage.sh
```

## 📋 Management Console Features

The management console provides an interactive menu with the following options:

### 🚀 Development
- **Start Development**: Runs both frontend and backend in development mode
- **Start Backend Only**: Runs only the backend server for API testing
- **Environment Check**: Verifies all dependencies and configuration files

### 🏭 Production
- **Start Production**: Builds and starts all services with PM2
- **Stop All Services**: Gracefully stops all running services
- **Restart Services**: Restarts all services with PM2

### 🔧 Maintenance
- **Check Status & Logs**: Shows PM2 status and recent logs
- **Install/Update Dependencies**: Installs all project dependencies
- **Build Applications**: Builds both frontend and backend for production

### 🧪 Testing
- **Test Webhook**: Tests the QuickBooks webhook endpoint
- **Quick Setup Guide**: Shows setup instructions and QuickBooks URLs

## 🏗️ Architecture

### Frontend
- **React 18** with Vite
- **TanStack Query** for data fetching
- **Axios** for API communication
- **Stack Auth** for JWT authentication
- **Tailwind CSS** for styling

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Drizzle ORM** with PostgreSQL
- **QuickBooks Online API** integration
- **PM2** for process management

### Integrations
- **QuickBooks Online** - Financial data sync
- **Google Calendar** - 8 specialized calendars
- **OpenAI/Google AI/Mistral** - AI features
- **HubSpot** - CRM integration
- **JotForm** - Form management
- **Jibble** - Time tracking

## 📊 API Endpoints

### Core Endpoints
- `GET /health` - Server health check
- `GET /api/customers` - Customer management
- `GET /api/invoices` - Invoice data
- `GET /api/estimates` - Estimate management
- `GET /api/items` - Product/service items

### QuickBooks Integration
- `POST /api/webhook/quickbooks` - Webhook receiver
- `GET /api/tokens/status` - OAuth token status
- `POST /api/sync` - Manual data sync

See [docs/endpoints.md](docs/endpoints.md) for complete API documentation.

## 🔧 Setup

### 1. Environment Configuration

#### Backend Environment (`backend/.env`)
```bash
# Copy the template
cp backend/env-template.txt backend/.env

# Edit with your credentials
# - QuickBooks OAuth credentials
# - Database connection string
# - API keys for integrations
```

#### Frontend Environment (`frontend/.env`)
```bash
VITE_API_BASE_URL=http://localhost:5000
VITE_STACK_AUTH_URL=https://api.stack-auth.com
VITE_STACK_PROJECT_ID=5fb1ffdb-d2a3-4a10-8824-7cfd62ab0f06
VITE_STACK_PUBLISHABLE_CLIENT_KEY=pck_h8mejt0bh4277fgzhc0r0ap5w2dx6a2y3bz74dngp70r0
```

### 2. QuickBooks Configuration

Configure these URLs in your QuickBooks Developer Dashboard:

- **Webhook URL**: `https://your-domain.com/api/webhook/quickbooks`
- **Redirect URL**: `https://your-domain.com/auth/qbo/callback`
- **Launch URL**: `https://your-domain.com/auth/qbo/launch`
- **Disconnect URL**: `https://your-domain.com/auth/qbo/disconnect`

### 3. Start the Application

```bash
# Development mode
./manage.sh  # or manage.bat on Windows
# Select option 1: Start Development

# Production mode
./manage.sh  # or manage.bat on Windows
# Select option 3: Start Production
```

## 📁 Project Structure

```
marin-pest-control-dashboard/
├── manage.sh              # Linux/macOS management script
├── manage.bat             # Windows management script
├── package.json           # Root package configuration
├── frontend/              # React frontend application
│   ├── src/
│   ├── package.json
│   └── .env
├── backend/               # Node.js backend API
│   ├── src/
│   │   ├── db/           # Database schema and connection
│   │   ├── routes/       # API route handlers
│   │   ├── services/     # Business logic services
│   │   ├── middleware/   # Express middleware
│   │   └── utils/        # Utility functions
│   ├── ecosystem.config.js # PM2 configuration
│   ├── package.json
│   └── .env
└── docs/                  # Documentation
    ├── SETUP.md          # Detailed setup guide
    ├── endpoints.md      # API endpoints reference
    └── changes.log       # Project change history
```

## 🔄 Data Flow

1. **Frontend** → TanStack Query → Axios → **Backend API**
2. **Backend** → Drizzle ORM → **NeonDB PostgreSQL**
3. **Backend** → QuickBooks API → **QuickBooks Online**
4. **QuickBooks** → Webhooks → **Backend** → Database sync

## 🛡️ Security Features

- JWT authentication with Stack Auth
- Webhook signature verification
- Rate limiting and CORS protection
- Input validation and sanitization
- Secure environment variable management

## 📈 Monitoring

- PM2 process monitoring
- Winston structured logging
- Health check endpoints
- Error tracking and reporting
- Performance metrics

## 🚀 Deployment

### Development
```bash
./manage.sh
# Select option 1: Start Development
```

### Production
```bash
./manage.sh
# Select option 3: Start Production
```

### Manual Commands
```bash
# Install dependencies
npm run install:all

# Build applications
npm run build

# Start with PM2
npm run pm2:start

# Check status
npm run pm2:status

# View logs
npm run pm2:logs
```

## 📚 Documentation

- [Setup Guide](docs/SETUP.md) - Detailed setup instructions
- [API Endpoints](docs/endpoints.md) - Complete API reference
- [Changes Log](docs/changes.log) - Project history and updates

## 🆘 Troubleshooting

### Common Issues

1. **Server won't start**: Check environment variables and dependencies
2. **Webhook not working**: Verify QuickBooks URL configuration
3. **Database connection failed**: Check DATABASE_URL in backend/.env
4. **Authentication issues**: Verify Stack Auth credentials

### Getting Help

1. Run the management console and select "Environment Check"
2. Check the logs with "Check Status & Logs"
3. Review the setup guide in `docs/SETUP.md`
4. Verify all environment variables are configured

## 📄 License

MIT License - See LICENSE file for details

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Marin Pest Control Dashboard v2.0.0**  
Built with ❤️ for efficient pest control business management
