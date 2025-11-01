# ⚡ RemitChain - Quick Start Guide

Get RemitChain up and running in minutes!

---

## 🚀 Quick Setup (Automated)

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd remitchain
chmod +x scripts/setup.sh
./scripts/setup.sh
```

The setup script will:
- Check Node.js version
- Create .env file with secure secrets
- Install dependencies
- Set up database
- Seed test data

### 2. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Test Credentials
```
Email: admin@remitchain.com
Password: admin123
```

---

## 🛠️ Manual Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Steps

1. **Install Dependencies**
```bash
npm install
```

2. **Create Environment File**
```bash
cp .env.example .env
```

3. **Generate Secrets**
```bash
openssl rand -base64 32
```
Add to NEXTAUTH_SECRET and RECEIPT_SIGNING_SECRET in .env

4. **Setup Database**
```bash
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
```

5. **Start Server**
```bash
npm run dev
```

---

## 🧪 Test the Application

### Automated Testing
```bash
chmod +x scripts/test-endpoints.sh
./scripts/test-endpoints.sh
```

### Manual Testing

1. **Health Check**
```bash
curl http://localhost:3000/api/health
```

2. **Exchange Rates**
```bash
curl http://localhost:3000/api/rates
curl http://localhost:3000/api/rates/live
```

3. **Generate Quote**
```bash
curl -X POST http://localhost:3000/api/remit/quote \
  -H "Content-Type: application/json" \
  -d '{"amountUSDC": 100, "toCountry": "India"}'
```

---

## 📊 Monitor System

### Real-Time Dashboard
```bash
chmod +x scripts/monitor-realtime.sh
./scripts/monitor-realtime.sh
```

This displays:
- Live exchange rates
- System health
- Memory usage
- Endpoint status

---

## 🌐 Access the Application

### Pages
- **Home**: http://localhost:3000
- **Dashboard**: http://localhost:3000/app
- **Send Money**: http://localhost:3000/app/send
- **Contacts**: http://localhost:3000/app/contacts
- **Transactions**: http://localhost:3000/app/transactions
- **Cash Out**: http://localhost:3000/app/cashout

### API Endpoints
- **Health**: GET /api/health
- **Rates**: GET /api/rates
- **Live Rates**: GET /api/rates/live
- **Quote**: POST /api/remit/quote
- **Contacts**: GET/POST /api/contacts
- **Transactions**: GET /api/transactions

---

## 🦊 Connect MetaMask

1. Install MetaMask browser extension
2. Click "Connect Wallet" in the app
3. Approve connection in MetaMask
4. Switch to Polygon Amoy testnet if needed

### Get Test Tokens
- Visit [Polygon Faucet](https://faucet.polygon.technology/)
- Request testnet MATIC for Amoy network

---

## 🔧 Configuration

### Essential Variables (.env)
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
SANDBOX_MODE="true"
```

### Optional Features
```env
USE_LIVE_RATES="true"              # Enable live exchange rates
LOG_LEVEL="INFO"                   # Logging level
ENABLE_BATCH_REMITTANCE="true"     # Batch transfers
ENABLE_ENS_RESOLVER="true"         # ENS name resolution
```

---

## 📁 Project Structure

```
remitchain/
├── app/
│   ├── page.js              # Home page
│   ├── app/                 # App pages
│   └── api/                 # API routes
├── components/
│   ├── ui/                  # UI components
│   ├── providers/           # Context providers
│   └── SimpleWalletConnect.js
├── lib/
│   ├── fx-service.js        # Exchange rates
│   ├── logger.js            # Logging
│   ├── error-handler.js     # Error handling
│   └── ...
├── scripts/
│   ├── setup.sh             # Setup automation
│   ├── test-endpoints.sh    # Testing
│   └── monitor-realtime.sh  # Monitoring
└── prisma/
    └── schema.prisma        # Database schema
```

---

## 🎯 Next Steps

### Development
1. Explore the codebase
2. Read PRODUCTION_FEATURES.md for feature details
3. Check CHANGELOG.md for recent changes
4. Run tests regularly

### Production
1. Read DEPLOYMENT.md
2. Set up PostgreSQL database
3. Configure environment variables
4. Set up monitoring
5. Deploy to your platform

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
killall node
npm run dev
```

### Database Issues
```bash
rm prisma/dev.db
npx prisma migrate deploy
npm run prisma:seed
```

### MetaMask Not Connecting
1. Check MetaMask is installed
2. Refresh the page
3. Check browser console for errors
4. Try disconnecting and reconnecting

### Build Errors
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📚 Documentation

- **CHANGELOG.md** - All changes and updates
- **PRODUCTION_FEATURES.md** - Feature documentation
- **DEPLOYMENT.md** - Production deployment guide
- **README.md** - Project overview

---

## 🔗 Quick Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linter
npm run typecheck    # Type checking

npx prisma studio    # Database GUI
npx prisma migrate dev  # Create migration
npm run prisma:seed  # Seed database
```

---

## 💡 Tips

1. **Use Sandbox Mode** for development (no blockchain required)
2. **Enable Live Rates** for real exchange rate data
3. **Check Health Endpoint** to verify system status
4. **Use Testing Scripts** for automated validation
5. **Monitor Logs** for debugging

---

## 🎉 You're Ready!

Your RemitChain instance is now running. Start exploring the features and building your remittance platform!

For questions or issues, check the documentation or review the test results.

---

**RemitChain Quick Start** ⚡
**From zero to running in minutes!**
