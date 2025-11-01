/*
  # RemitChain Database Schema

  ## Overview
  Creates the complete database schema for RemitChain, a blockchain-based remittance platform.

  ## New Tables

  ### 1. users
  - `id` (uuid, primary key) - User identifier
  - `email` (text, unique) - User email address
  - `name` (text) - User display name
  - `role` (text) - User role (USER or ADMIN)
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. wallets
  - `id` (uuid, primary key) - Wallet identifier
  - `user_id` (uuid, foreign key) - Owner user ID
  - `address` (text, unique) - Blockchain wallet address
  - `network` (text) - Network name (default: polygon-amoy)
  - `primary` (boolean) - Primary wallet flag
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. contacts
  - `id` (uuid, primary key) - Contact identifier
  - `user_id` (uuid, foreign key) - Owner user ID
  - `name` (text) - Contact name
  - `type` (text) - Contact type (PHONE, ADDRESS, ENS)
  - `value` (text) - Contact value (phone/address/ENS)
  - `linked_address` (text) - Resolved ENS address
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Creation timestamp

  ### 4. remit_intents
  - `id` (uuid, primary key) - Intent identifier
  - `user_id` (uuid, foreign key) - Sender user ID
  - `receiver_type` (text) - Receiver type (PHONE, ADDRESS, ENS)
  - `receiver_phone` (text) - Receiver phone number
  - `receiver_address` (text) - Receiver blockchain address
  - `corridor` (text) - Currency corridor (e.g., USD-INR)
  - `amount_usdc` (numeric) - Amount in USDC
  - `fee_usdc` (numeric) - Transaction fee in USDC
  - `status` (text) - Status (CREATED, ONCHAIN_CONFIRMED, FAILED)
  - `tx_hash` (text) - Blockchain transaction hash
  - `remit_id` (text) - On-chain remittance ID
  - `created_at` (timestamptz) - Creation timestamp
  - `expires_at` (timestamptz) - Expiration timestamp

  ### 5. remit_receipts
  - `id` (uuid, primary key) - Receipt identifier
  - `remit_id` (uuid, foreign key) - Related remit intent
  - `sender_id` (text) - Sender identifier
  - `receiver_address` (text) - Receiver address
  - `token` (text) - Token type
  - `raw_event_json` (jsonb) - Raw blockchain event data
  - `amount_usdc` (numeric) - Amount in USDC
  - `fee_usdc` (numeric) - Fee in USDC
  - `corridor` (text) - Currency corridor
  - `timestamp` (timestamptz) - Transaction timestamp
  - `fx_at_settlement` (numeric) - FX rate at settlement
  - `amount_inr_estimate` (numeric) - Estimated INR amount
  - `pdf_hash` (text) - PDF receipt hash
  - `share_token` (text, unique) - Shareable link token
  - `share_expires_at` (timestamptz) - Share link expiration
  - `created_at` (timestamptz) - Creation timestamp

  ### 6. fraud_flags
  - `id` (uuid, primary key) - Flag identifier
  - `remit_id` (uuid, foreign key) - Related receipt
  - `rule` (text) - Fraud rule triggered
  - `score` (integer) - Fraud score
  - `severity` (text) - Severity level (LOW, MEDIUM, HIGH)
  - `note` (text) - Additional notes
  - `created_at` (timestamptz) - Creation timestamp

  ### 7. cashouts
  - `id` (uuid, primary key) - Cashout identifier
  - `remit_id` (uuid, unique, foreign key) - Related remit intent
  - `ref` (text, unique) - Reference number
  - `method` (text) - Cashout method (upi, bank)
  - `upi_id` (text) - UPI ID
  - `bank_acct` (text) - Bank account number
  - `status` (text) - Status (QUEUED, PROCESSING, PAID, FAILED)
  - `events_json` (jsonb) - Event history
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 8. admin_config
  - `id` (integer, primary key) - Config identifier (singleton)
  - `fee_bps` (integer) - Fee in basis points
  - `fx_base` (numeric) - Base FX rate
  - `fx_spread` (numeric) - FX spread
  - `updated_at` (timestamptz) - Last update timestamp

  ### 9. audit_logs
  - `id` (uuid, primary key) - Log identifier
  - `actor_id` (uuid, foreign key) - User who performed action
  - `action` (text) - Action performed
  - `payload_json` (jsonb) - Action payload
  - `created_at` (timestamptz) - Action timestamp

  ### 10. feature_flags
  - `id` (uuid, primary key) - Flag identifier
  - `key` (text, unique) - Flag key
  - `value` (jsonb) - Flag value
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Admin users have elevated permissions
  - Public access restricted to shareable receipts
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  role text DEFAULT 'USER' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  address text UNIQUE NOT NULL,
  network text DEFAULT 'polygon-amoy' NOT NULL,
  "primary" boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  value text NOT NULL,
  linked_address text,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create remit_intents table
CREATE TABLE IF NOT EXISTS remit_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_type text NOT NULL,
  receiver_phone text,
  receiver_address text,
  corridor text NOT NULL,
  amount_usdc numeric NOT NULL,
  fee_usdc numeric NOT NULL,
  status text DEFAULT 'CREATED' NOT NULL,
  tx_hash text,
  remit_id text,
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz NOT NULL
);

-- Create remit_receipts table
CREATE TABLE IF NOT EXISTS remit_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  remit_id uuid REFERENCES remit_intents(id) ON DELETE CASCADE UNIQUE NOT NULL,
  sender_id text NOT NULL,
  receiver_address text NOT NULL,
  token text NOT NULL,
  raw_event_json jsonb NOT NULL,
  amount_usdc numeric NOT NULL,
  fee_usdc numeric NOT NULL,
  corridor text NOT NULL,
  "timestamp" timestamptz NOT NULL,
  fx_at_settlement numeric NOT NULL,
  amount_inr_estimate numeric NOT NULL,
  pdf_hash text,
  share_token text UNIQUE,
  share_expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create fraud_flags table
CREATE TABLE IF NOT EXISTS fraud_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  remit_id uuid REFERENCES remit_receipts(id) ON DELETE CASCADE NOT NULL,
  rule text NOT NULL,
  score integer NOT NULL,
  severity text NOT NULL,
  note text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create cashouts table
CREATE TABLE IF NOT EXISTS cashouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  remit_id uuid REFERENCES remit_intents(id) ON DELETE CASCADE UNIQUE NOT NULL,
  ref text UNIQUE NOT NULL,
  method text NOT NULL,
  upi_id text,
  bank_acct text,
  status text DEFAULT 'QUEUED' NOT NULL,
  events_json jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create admin_config table
CREATE TABLE IF NOT EXISTS admin_config (
  id integer PRIMARY KEY DEFAULT 1,
  fee_bps integer DEFAULT 25 NOT NULL,
  fx_base numeric DEFAULT 83.00 NOT NULL,
  fx_spread numeric DEFAULT 0.20 NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT single_config CHECK (id = 1)
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  payload_json jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create feature_flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_remit_intents_user_id ON remit_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_remit_intents_status ON remit_intents(status);
CREATE INDEX IF NOT EXISTS idx_remit_receipts_remit_id ON remit_receipts(remit_id);
CREATE INDEX IF NOT EXISTS idx_remit_receipts_sender_id ON remit_receipts(sender_id);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_remit_id ON fraud_flags(remit_id);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_severity ON fraud_flags(severity);
CREATE INDEX IF NOT EXISTS idx_cashouts_ref ON cashouts(ref);
CREATE INDEX IF NOT EXISTS idx_cashouts_status ON cashouts(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE remit_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE remit_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- RLS Policies for wallets table
CREATE POLICY "Users can view own wallets"
  ON wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallets"
  ON wallets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets"
  ON wallets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wallets"
  ON wallets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for contacts table
CREATE POLICY "Users can view own contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
  ON contacts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
  ON contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for remit_intents table
CREATE POLICY "Users can view own remit intents"
  ON remit_intents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own remit intents"
  ON remit_intents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own remit intents"
  ON remit_intents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all remit intents"
  ON remit_intents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- RLS Policies for remit_receipts table
CREATE POLICY "Users can view own receipts"
  ON remit_receipts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM remit_intents
      WHERE remit_intents.id = remit_receipts.remit_id
      AND remit_intents.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view shared receipts"
  ON remit_receipts FOR SELECT
  TO anon, authenticated
  USING (
    share_token IS NOT NULL
    AND share_expires_at > now()
  );

CREATE POLICY "System can insert receipts"
  ON remit_receipts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all receipts"
  ON remit_receipts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- RLS Policies for fraud_flags table
CREATE POLICY "Users can view own fraud flags"
  ON fraud_flags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM remit_receipts
      JOIN remit_intents ON remit_receipts.remit_id = remit_intents.id
      WHERE remit_receipts.id = fraud_flags.remit_id
      AND remit_intents.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert fraud flags"
  ON fraud_flags FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all fraud flags"
  ON fraud_flags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- RLS Policies for cashouts table
CREATE POLICY "Users can view own cashouts"
  ON cashouts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM remit_intents
      WHERE remit_intents.id = cashouts.remit_id
      AND remit_intents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own cashouts"
  ON cashouts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM remit_intents
      WHERE remit_intents.id = cashouts.remit_id
      AND remit_intents.user_id = auth.uid()
    )
  );

CREATE POLICY "System can update cashouts"
  ON cashouts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view all cashouts"
  ON cashouts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- RLS Policies for admin_config table
CREATE POLICY "Anyone can view config"
  ON admin_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update config"
  ON admin_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- RLS Policies for audit_logs table
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for feature_flags table
CREATE POLICY "Anyone can view feature flags"
  ON feature_flags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage feature flags"
  ON feature_flags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Insert default admin config
INSERT INTO admin_config (id, fee_bps, fx_base, fx_spread, updated_at)
VALUES (1, 25, 83.00, 0.20, now())
ON CONFLICT (id) DO NOTHING;