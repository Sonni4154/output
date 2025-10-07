#!/bin/bash

echo "🚀 Starting Marin Pest Control Dashboard - Development Mode"
echo ""

echo "📦 Installing dependencies..."
npm run install:all
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🔧 Starting development servers..."
echo "📊 Backend: http://localhost:5000"
echo "🎨 Frontend: http://localhost:5173"
echo ""

npm run dev
