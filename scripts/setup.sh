#!/bin/bash

set -e

echo "🚀 RemitChain Setup Script"
echo "=========================="
echo ""

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env

    NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
    RECEIPT_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)

    if [ "$(uname)" = "Darwin" ]; then
        sed -i '' "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"|g" .env
        sed -i '' "s|RECEIPT_SIGNING_SECRET=.*|RECEIPT_SIGNING_SECRET=\"$RECEIPT_SECRET\"|g" .env
    else
        sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"|g" .env
        sed -i "s|RECEIPT_SIGNING_SECRET=.*|RECEIPT_SIGNING_SECRET=\"$RECEIPT_SECRET\"|g" .env
    fi

    echo "✅ .env file created with secure secrets"
else
    echo "✅ .env file already exists"
fi
echo ""

echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

echo "🔧 Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"
echo ""

echo "🗄️  Setting up database..."
npx prisma migrate deploy
echo "✅ Database migrations applied"
echo ""

echo "🌱 Seeding database..."
npm run prisma:seed
echo "✅ Database seeded"
echo ""

echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Review and update .env file if needed"
echo "  2. Run 'npm run dev' to start the development server"
echo "  3. Open http://localhost:3000 in your browser"
echo ""
echo "Test credentials:"
echo "  Email: admin@remitchain.com"
echo "  Password: admin123"
echo ""
