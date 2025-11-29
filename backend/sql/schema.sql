-- PostgreSQL schema for C-GPT banking demo

CREATE TABLE IF NOT EXISTS customers (
  id            SERIAL PRIMARY KEY,
  customer_id   VARCHAR(32) UNIQUE NOT NULL,
  username      VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  phone         VARCHAR(20)  UNIQUE NOT NULL,
  created_at    TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounts (
  id             SERIAL PRIMARY KEY,
  account_number VARCHAR(32) UNIQUE NOT NULL,
  customer_id    INTEGER NOT NULL REFERENCES customers(id),
  balance        NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency       VARCHAR(10) NOT NULL DEFAULT 'INR',
  created_at     TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id            SERIAL PRIMARY KEY,
  account_id    INTEGER NOT NULL REFERENCES accounts(id),
  txn_time      TIMESTAMP NOT NULL DEFAULT now(),
  description   VARCHAR(255),
  txn_type      VARCHAR(2) NOT NULL CHECK (txn_type IN ('CR','DR')),
  amount        NUMERIC(18,2) NOT NULL,
  balance_after NUMERIC(18,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS otps (
  id           SERIAL PRIMARY KEY,
  contact      VARCHAR(255) NOT NULL,
  contact_type VARCHAR(10)  NOT NULL CHECK (contact_type IN ('email','phone')),
  otp_code     VARCHAR(6)   NOT NULL,
  expires_at   TIMESTAMP    NOT NULL,
  used         BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMP    DEFAULT now()
);
