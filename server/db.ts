import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import type { CrmDatabase } from './types';

async function initializeSchema(db: CrmDatabase) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      role TEXT
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT,
      industry TEXT,
      size TEXT,
      owner_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      phone TEXT,
      account_id TEXT,
      owner_id TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pipeline_stages (
      id TEXT PRIMARY KEY,
      name TEXT,
      order_index INTEGER,
      probability INTEGER
    );

    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      name TEXT,
      value REAL,
      stage_id TEXT,
      account_id TEXT,
      owner_id TEXT,
      probability INTEGER,
      close_date DATETIME,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      type TEXT,
      subject TEXT,
      due_date DATETIME,
      status TEXT,
      related_to_type TEXT,
      related_to_id TEXT,
      owner_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deal_stage_history (
      id TEXT PRIMARY KEY,
      deal_id TEXT,
      old_stage_id TEXT,
      new_stage_id TEXT,
      changed_by TEXT,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function seedDatabase(db: CrmDatabase) {
  const stagesCount = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM pipeline_stages');

  if (stagesCount?.count) {
    return;
  }

  await db.exec(`
    INSERT INTO pipeline_stages (id, name, order_index, probability) VALUES
    ('stage_1', 'Lead', 1, 10),
    ('stage_2', 'Qualified', 2, 30),
    ('stage_3', 'Proposal', 3, 60),
    ('stage_4', 'Negotiation', 4, 80),
    ('stage_5', 'Closed Won', 5, 100),
    ('stage_6', 'Closed Lost', 6, 0);

    INSERT INTO users (id, name, email, role) VALUES
    ('user_1', 'Admin User', 'admin@example.com', 'Admin'),
    ('user_2', 'Sales Rep', 'sales@example.com', 'Sales');

    INSERT INTO accounts (id, name, industry, size, owner_id) VALUES
    ('acc_1', 'Acme Corp', 'Technology', 'Enterprise', 'user_1'),
    ('acc_2', 'Globex', 'Manufacturing', 'Mid-Market', 'user_2');

    INSERT INTO contacts (id, first_name, last_name, email, phone, account_id, owner_id, tags) VALUES
    ('con_1', 'John', 'Doe', 'john@acme.com', '555-0100', 'acc_1', 'user_1', '["decision_maker"]'),
    ('con_2', 'Jane', 'Smith', 'jane@globex.com', '555-0200', 'acc_2', 'user_2', '["influencer"]');

    INSERT INTO deals (id, name, value, stage_id, account_id, owner_id, probability, close_date, status) VALUES
    ('deal_1', 'Acme Q3 Software', 50000, 'stage_3', 'acc_1', 'user_1', 60, '2026-09-30', 'open'),
    ('deal_2', 'Globex Expansion', 120000, 'stage_2', 'acc_2', 'user_2', 30, '2026-10-15', 'open');

    INSERT INTO activities (id, type, subject, due_date, status, related_to_type, related_to_id, owner_id) VALUES
    ('act_1', 'Call', 'Initial Discovery Call', '2026-03-25T10:00:00Z', 'Pending', 'contact', 'con_1', 'user_1'),
    ('act_2', 'Email', 'Send Proposal', '2026-03-22T14:00:00Z', 'Completed', 'deal', 'deal_1', 'user_1');
  `);
}

export async function openDatabase(rootDir: string) {
  const db = await open({
    filename: path.join(rootDir, 'crm.db'),
    driver: sqlite3.Database,
  });

  await initializeSchema(db);
  await seedDatabase(db);

  return db;
}
