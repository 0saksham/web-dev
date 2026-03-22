#!/bin/bash
# Production Deployment Script for IKS GEHU Portal

set -e  # Exit on any error

echo "🚀 Starting IKS GEHU Portal Production Deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Build frontend for production
echo "🔨 Building frontend for production..."
npm run build

# Run database migrations
echo "🗄️ Running database migrations..."
npm run migrate

# Set production environment
export NODE_ENV=production

echo "✅ Dependencies installed, frontend built, and database migrated"

# Start the application
echo "🎮 Starting the application in production mode..."
npm run production

echo "🎉 IKS GEHU Portal is now running in production mode!"
echo "🌐 Access the application at: http://localhost:5000"