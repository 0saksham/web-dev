@echo off
REM Production Deployment Script for IKS University Portal (Windows)

echo 🚀 Starting IKS University Portal Production Deployment...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Install dependencies
echo 📦 Installing dependencies...
call npm run install:all

REM Build frontend for production
echo 🔨 Building frontend for production...
call npm run build

REM Run database migrations
echo 🗄️ Running database migrations...
call npm run migrate

REM Set production environment
set NODE_ENV=production

echo ✅ Dependencies installed, frontend built, and database migrated

REM Start the application
echo 🎮 Starting the application in production mode...
call npm run production

echo 🎉 IKS University Portal is now running in production mode!
echo 🌐 Access the application at: http://localhost:5000
pause