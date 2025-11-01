-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "network" TEXT NOT NULL DEFAULT 'polygon-amoy',
    "primary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "linkedAddress" TEXT,
    "notes" TEXT DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RemitIntent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "receiverType" TEXT NOT NULL,
    "receiverPhone" TEXT,
    "receiverAddress" TEXT,
    "corridor" TEXT NOT NULL,
    "amountUSDC" TEXT NOT NULL,
    "feeUSDC" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "txHash" TEXT,
    "remitId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "RemitIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RemitReceipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "remitId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverAddress" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "rawEventJson" TEXT NOT NULL,
    "amountUSDC" TEXT NOT NULL,
    "feeUSDC" TEXT NOT NULL,
    "corridor" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "fxAtSettlement" TEXT NOT NULL,
    "amountINREstimate" TEXT NOT NULL,
    "pdfHash" TEXT,
    "shareToken" TEXT,
    "shareExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RemitReceipt_remitId_fkey" FOREIGN KEY ("remitId") REFERENCES "RemitIntent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FraudFlag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "remitId" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "severity" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FraudFlag_remitId_fkey" FOREIGN KEY ("remitId") REFERENCES "RemitReceipt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cashout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "remitId" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "upiId" TEXT,
    "bankAcct" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "eventsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Cashout_remitId_fkey" FOREIGN KEY ("remitId") REFERENCES "RemitIntent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "feeBps" INTEGER NOT NULL DEFAULT 25,
    "fxBase" TEXT NOT NULL DEFAULT '83.00',
    "fxSpread" TEXT NOT NULL DEFAULT '0.20',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_address_key" ON "Wallet"("address");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Contact_userId_idx" ON "Contact"("userId");

-- CreateIndex
CREATE INDEX "RemitIntent_userId_idx" ON "RemitIntent"("userId");

-- CreateIndex
CREATE INDEX "RemitIntent_status_idx" ON "RemitIntent"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RemitReceipt_remitId_key" ON "RemitReceipt"("remitId");

-- CreateIndex
CREATE UNIQUE INDEX "RemitReceipt_shareToken_key" ON "RemitReceipt"("shareToken");

-- CreateIndex
CREATE INDEX "RemitReceipt_remitId_idx" ON "RemitReceipt"("remitId");

-- CreateIndex
CREATE INDEX "RemitReceipt_senderId_idx" ON "RemitReceipt"("senderId");

-- CreateIndex
CREATE INDEX "FraudFlag_remitId_idx" ON "FraudFlag"("remitId");

-- CreateIndex
CREATE INDEX "FraudFlag_severity_idx" ON "FraudFlag"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "Cashout_remitId_key" ON "Cashout"("remitId");

-- CreateIndex
CREATE UNIQUE INDEX "Cashout_ref_key" ON "Cashout"("ref");

-- CreateIndex
CREATE INDEX "Cashout_ref_idx" ON "Cashout"("ref");

-- CreateIndex
CREATE INDEX "Cashout_status_idx" ON "Cashout"("status");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");
