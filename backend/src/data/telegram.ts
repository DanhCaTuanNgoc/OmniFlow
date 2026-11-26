import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { ActivityLogEntry } from './activityLog.js';

const digest = (code: string) => createHash('sha256').update(code).digest('hex');
export const linkLifetimeMs = 10 * 60_000;

export type TelegramDelivery = { id: number; chat: string; report: string; attempts: number };

export class TelegramStore {
  constructor(private readonly db: Database.Database) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS telegram_codes (
        owner TEXT PRIMARY KEY, hash TEXT NOT NULL UNIQUE, expires INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS telegram_links (
        id TEXT PRIMARY KEY, owner TEXT NOT NULL UNIQUE, chat TEXT NOT NULL UNIQUE, created INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS telegram_deliveries (
        id INTEGER PRIMARY KEY AUTOINCREMENT, link TEXT NOT NULL, execution TEXT NOT NULL, report TEXT NOT NULL,
        due INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, state TEXT NOT NULL DEFAULT 'pending',
        UNIQUE (link, execution)
      );
      CREATE INDEX IF NOT EXISTS telegram_deliveries_due ON telegram_deliveries (state, due);
    `);
  }

  status(owner: string) {
    return Boolean(this.db.prepare('SELECT 1 FROM telegram_links WHERE owner = ?').get(owner));
  }

  createCode(owner: string) {
    const code = randomBytes(24).toString('base64url');
    const expires = Date.now() + linkLifetimeMs;
    this.db.prepare('INSERT OR REPLACE INTO telegram_codes VALUES (?, ?, ?)').run(owner, digest(code), expires);
    return { code, expires };
  }

  redeem(code: string, chat: string) {
    return this.db.transaction(() => {
      const entry = this.db.prepare('DELETE FROM telegram_codes WHERE hash = ? AND expires > ? RETURNING owner')
        .get(digest(code), Date.now()) as { owner: string } | undefined;
      if (!entry) return 'invalid';
      const result = this.db.prepare('INSERT OR IGNORE INTO telegram_links VALUES (?, ?, ?, ?)')
        .run(randomUUID(), entry.owner, chat, Date.now());
      return result.changes ? 'linked' : 'conflict';
    }).immediate();
  }

  disconnect(owner: string) {
    this.db.transaction(() => {
      this.db.prepare('DELETE FROM telegram_codes WHERE owner = ?').run(owner);
      this.db.prepare(`
        DELETE FROM telegram_deliveries WHERE link IN (SELECT id FROM telegram_links WHERE owner = ?)
      `).run(owner);
      this.db.prepare('DELETE FROM telegram_links WHERE owner = ?').run(owner);
    }).immediate();
  }

  owner(chat: string) {
    return (this.db.prepare('SELECT owner FROM telegram_links WHERE chat = ?').get(chat) as
      { owner: string } | undefined)?.owner;
  }

  enqueue(deploymentId: string, report: ActivityLogEntry) {
    if (!['SUCCESS', 'SKIPPED'].includes(report.status) || !report.destinationTxHash ||
        !report.reactiveTxHash || !report.destinationBlockHash) return;
    this.db.prepare(`
      INSERT OR IGNORE INTO telegram_deliveries (link, execution, report, due)
      SELECT telegram_links.id, ?, ?, ? FROM telegram_links
      JOIN deployments ON deployments.owner = telegram_links.owner
      WHERE deployments.id = ? AND telegram_links.created <= ?
    `).run(report.id, JSON.stringify(report), Date.now(), deploymentId, Date.parse(report.timestamp));
  }

  nextDelivery() {
    return this.db.prepare(`
      SELECT d.id, l.chat, d.report, d.attempts FROM telegram_deliveries d
      JOIN telegram_links l ON l.id = d.link WHERE d.state = 'pending' AND d.due <= ?
      ORDER BY d.due, d.id LIMIT 1
    `).get(Date.now()) as TelegramDelivery | undefined;
  }

  complete(id: number, state: 'sent' | 'failed' | 'pending', due = Date.now()) {
    this.db.prepare('UPDATE telegram_deliveries SET state = ?, due = ?, attempts = attempts + 1 WHERE id = ?')
      .run(state, due, id);
  }
}
