#!/bin/bash

echo "🚀 Starting Marin Pest Control Dashboard - Production Mode"
echo ""

echo "📦 Building applications..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Failed to build applications"
    exit 1
fi

echo ""
echo "🔧 Starting production servers with PM2..."
npm run pm2:start

echo ""
echo "✅ Production servers started!"
echo "📊 Backend: http://localhost:5000"
echo "🎨 Frontend: http://localhost:5173"
echo ""
echo "📋 To check status: npm run pm2:status"
echo "📋 To view logs: npm run pm2:logs"
echo "📋 To stop: npm run pm2:stop"
