# RemitChain - Decentralized Remittance Platform

A production-quality, decentralized remittance platform using stablecoins (USDC) on Polygon with unique judge-wowing features.

## 🚀 Features

### Core Functionality
- **Decentralized Remittance**: Send USDC cross-border with ultra-low fees (0.25%)
- **Hybrid Mode**: Sandbox simulator + real on-chain integration ready
- **90-Second Rate Lock**: Guaranteed exchange rates with countdown timer
- **Fraud Detection**: 5-rule AI-powered fraud detection system
- **Tamper-Proof Receipts**: HMAC-signed HTML/PDF receipts with QR codes

### Unique Features
1. **Smart Contact Book** - Save recipients as Phone/Wallet/ENS with one-click send
2. **Rate-Lock Quote System** - 90-second guaranteed rates with live countdown
3. **Batch & Split Remittance** - Send to up to 5 recipients in one session
4. **Proof-of-Transfer Receipt** - Server-generated PDF with HMAC signature
5. **Shareable Receipt Links** - Time-boxed public receipt access
6. **Cash-Out Simulator** - UPI/Bank simulator with status transitions
7. **Admin Fee & FX Control** - Live config changes with audit logging
8. **PWA Ready** - Installable app with offline receipt support
9. **Accessibility** - Full keyboard nav, ARIA labels, theme toggle
10. **Sandbox Mode** - Demo rails for testing without real contracts

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend**: Next.js API Routes with Zod validation
- **Database**: Prisma ORM (SQLite dev / Postgres prod)
- **Auth**: NextAuth.js (Email magic-link)
- **Web3**: ethers v6 (wagmi ready)
- **Blockchain**: Polygon Amoy testnet

## 📦 Installation

```bash
# Install dependencies
yarn install

# Setup database
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# Start development server
yarn dev
```

## 🔐 Environment Variables

See `.env.example` for all required variables:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="changeme"
CHAIN_RPC="https://rpc-amoy.polygon.technology"
REMIT_HUB_ADDRESS=""  # Empty = sandbox mode
USDC_ADDRESS=""       # Empty = sandbox mode
SANDBOX_MODE="true"
RECEIPT_SIGNING_SECRET="changeme"
```

## 🧪 Test Accounts

- **Admin**: admin@remitchain.io
- **Users**: alice@example.com, bob@example.com

Magic links are logged to server console in development.

## 📡 API Endpoints

### Public
- `GET /api/rates` - Current FX rates
- `POST /api/remit/quote` - Get 90s quote
- `POST /api/remit/intent` - Create intent
- `POST /api/remit/confirm` - Confirm with txHash

### Authenticated
- `GET /api/remit/[id]` - Get receipt
- `GET /api/remit/[id]/pdf` - Download receipt
- `GET /api/contacts` - List contacts
- `POST /api/cashout/initiate` - Start cash-out

### Admin
- `POST /api/admin/config` - Update fees/FX
- `GET /api/admin/remit` - View all remittances
- `GET /api/admin/flags` - Fraud flags
- `POST /api/admin/feature-flags` - Toggle features

## 🎯 Quick Start (Judge Demo)

1. **Visit Homepage**: http://localhost:3000
   - See features, fee comparison, beautiful landing page

2. **Sign In**: Click "Open App"
   - Use test email: alice@example.com
   - Check server console for magic link
   - Click the link to authenticate

3. **Dashboard**: Connected wallet simulation
   - Shows USDC balance (simulated)
   - Quick action cards
   - Sandbox mode badge

4. **Test Backend**:
```bash
# Get current rates
curl http://localhost:3000/api/rates

# Create quote
curl -X POST http://localhost:3000/api/remit/quote \
  -H "Content-Type: application/json" \
  -d '{"amountUSDC":"100","corridor":"USDC-INR"}'
```

## 🏗 Project Structure

```
/app
├── app/
│   ├── api/           # API Route Handlers
│   │   ├── rates/
│   │   ├── remit/     # Quote, intent, confirm, receipts
│   │   ├── contacts/  # CRUD + ENS resolver
│   │   ├── cashout/   # UPI/Bank simulator
│   │   └── admin/     # Config, flags, audit
│   ├── app/           # App dashboard
│   ├── auth/          # Sign in/out pages
│   ├── layout.js      # Root layout with providers
│   └── page.js        # Landing page
├── components/
│   ├── providers/     # Auth & Web3 providers
│   └── ui/            # shadcn components
├── lib/
│   ├── prisma.js      # Database client
│   ├── contract.js    # Contract simulator + real integration
│   ├── fraud.js       # Fraud detection rules
│   ├── pdf.js         # Receipt generation
│   └── schemas.js     # Zod validation
└── prisma/
    ├── schema.prisma  # 10+ models
    └── seed.js        # Test data
```

## 🧠 Architecture Decisions

### Hybrid Approach
- **Sandbox Mode**: Contract simulator for demo without deployed contracts
- **Production Ready**: Switch to real contracts by setting env variables
- Deterministic mock events from txHash for consistent testing

### Fraud Detection
- Analyzes transaction history (P95, frequency, corridors)
- Non-blocking (doesn't fail transactions)
- Admin dashboard for review

### Receipt System
- HMAC-SHA256 signatures for tamper-evidence
- Shareable links with 30-day expiry
- QR codes for mobile access
- PWA caching for offline access

## 🎨 Design System

- **Primary**: Indigo (#6366f1) for main actions
- **Secondary**: Cyan (#06b6d4) for highlights
- **Accents**: Purple, Emerald, Amber for status
- **Dark Mode**: Default with system preference
- **Typography**: Inter font, responsive sizing

## 📊 Database Models

- User, Wallet, Contact
- RemitIntent, RemitReceipt, FraudFlag
- Cashout, AdminConfig, AuditLog, FeatureFlag
- NextAuth models (Account, Session, VerificationToken)

## 🔒 Security

- Zod validation on all inputs
- NextAuth session-based auth
- HMAC receipt signatures
- Fraud detection flags
- Audit logging for admin actions

## 🚢 Deployment

```bash
# Build for production
yarn build

# Start production server
yarn start
```

For Neon Postgres, update `DATABASE_URL` and run migrations.

## 📝 License

MIT

## 👥 Credits

Built with Next.js, Prisma, shadcn/ui, and ethers.js

---

**RemitChain** - Send money across borders. Fast. Fair. Transparent.
