const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.fraudFlag.deleteMany();
  await prisma.remitReceipt.deleteMany();
  await prisma.cashout.deleteMany();
  await prisma.remitIntent.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();
  await prisma.adminConfig.deleteMany();
  await prisma.featureFlag.deleteMany();

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'admin@remitchain.io',
      role: 'ADMIN',
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create test users
  const user1 = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'alice@example.com',
      role: 'USER',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'bob@example.com',
      role: 'USER',
    },
  });

  console.log('✅ Created test users:', user1.email, user2.email);

  // Create wallets
  await prisma.wallet.createMany({
    data: [
      {
        id: uuidv4(),
        userId: user1.id,
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
        network: 'polygon-amoy',
        primary: true,
      },
      {
        id: uuidv4(),
        userId: user2.id,
        address: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
        network: 'polygon-amoy',
        primary: true,
      },
    ],
  });

  console.log('✅ Created wallets');

  // Create contacts
  await prisma.contact.createMany({
    data: [
      {
        id: uuidv4(),
        userId: user1.id,
        name: 'Rajesh Kumar',
        type: 'PHONE',
        value: '+919876543210',
        notes: 'Family member in Mumbai',
      },
      {
        id: uuidv4(),
        userId: user1.id,
        name: 'Priya Wallet',
        type: 'ADDRESS',
        value: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
        linkedAddress: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
        notes: 'Sister wallet',
      },
      {
        id: uuidv4(),
        userId: user1.id,
        name: 'Vitalik ENS',
        type: 'ENS',
        value: 'vitalik.eth',
        linkedAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        notes: 'Test ENS contact',
      },
    ],
  });

  console.log('✅ Created contacts');

  // Create AdminConfig
  await prisma.adminConfig.create({
    data: {
      id: 1,
      feeBps: 25,
      fxBase: '83.00',
      fxSpread: '0.20',
    },
  });

  console.log('✅ Created AdminConfig');

  // Create FeatureFlags
  await prisma.featureFlag.createMany({
    data: [
      {
        id: uuidv4(),
        key: 'sandboxMode',
        value: JSON.stringify({ enabled: true }),
      },
      {
        id: uuidv4(),
        key: 'batchRemittance',
        value: JSON.stringify({ enabled: true, maxRecipients: 5 }),
      },
      {
        id: uuidv4(),
        key: 'offlineReceipts',
        value: JSON.stringify({ enabled: true }),
      },
      {
        id: uuidv4(),
        key: 'ensResolver',
        value: JSON.stringify({ enabled: true }),
      },
    ],
  });

  console.log('✅ Created FeatureFlags');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });