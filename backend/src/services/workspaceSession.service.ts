import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import Database from 'better-sqlite3';
import { getAddress, verifyMessage, type Address, type Hex } from 'viem';
import { createSiweMessage } from 'viem/siwe';
import { env } from '../config/env.js';
import { baseSepoliaChain } from '../config/chains.js';

const challengeTtl = 5 * 60_000;
const sessionTtl = 60 * 60_000;
const capacity = 10_000;
const workspaceOrigin = new URL(env.WORKSPACE_ORIGIN);

type Session = { owner: Address; expiresAt: number };
type Challenge = Session & { message: string };

function tokenDigest(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export class WorkspaceSessionService {
  private readonly db: Database.Database;

  constructor(private readonly now: () => number = Date.now, path = ':memory:') {
    if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true });
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS siwe_challenges (
        nonce TEXT PRIMARY KEY, origin TEXT NOT NULL, owner TEXT NOT NULL, message TEXT NOT NULL, expiresAt INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS siwe_challenge_expiry ON siwe_challenges (expiresAt);
      CREATE TABLE IF NOT EXISTS wallet_sessions (
        digest TEXT PRIMARY KEY, origin TEXT NOT NULL, owner TEXT NOT NULL, expiresAt INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS wallet_session_expiry ON wallet_sessions (expiresAt);
    `);
  }

  createChallenge(address: Address) {
    const now = this.now();
    const nonce = randomBytes(16).toString('hex');
    const owner = getAddress(address.toLowerCase());
    const expiresAt = now + challengeTtl;
    const message = createSiweMessage({
      scheme: workspaceOrigin.protocol.slice(0, -1),
      domain: workspaceOrigin.host,
      uri: workspaceOrigin.origin,
      chainId: baseSepoliaChain.id,
      version: '1',
      address: owner,
      statement: 'Sign in to OmniFlow Workspace.',
      nonce,
      issuedAt: new Date(now),
      expirationTime: new Date(expiresAt),
    });
    return this.db.transaction(() => {
      this.db.prepare('DELETE FROM siwe_challenges WHERE expiresAt <= ?').run(now);
      const { count } = this.db.prepare('SELECT COUNT(*) AS count FROM siwe_challenges').get() as { count: number };
      if (count >= capacity) return undefined;
      this.db.prepare('INSERT INTO siwe_challenges VALUES (?, ?, ?, ?, ?)')
        .run(nonce, workspaceOrigin.origin, owner, message, expiresAt);
      return { nonce, message, expiresAt };
    }).immediate();
  }

  async verify(nonce: string, signature: Hex) {
    const challenge = this.db.prepare(`
      SELECT owner, message, expiresAt FROM siwe_challenges WHERE nonce = ? AND origin = ? AND expiresAt > ?
    `).get(nonce, workspaceOrigin.origin, this.now()) as Challenge | undefined;
    if (!challenge) return undefined;
    const valid = await verifyMessage({
      address: challenge.owner,
      message: challenge.message,
      signature,
    }).catch(() => false);
    if (!valid) return undefined;
    return this.db.transaction(() => {
      const now = this.now();
      this.db.prepare('DELETE FROM wallet_sessions WHERE expiresAt <= ?').run(now);
      const { count } = this.db.prepare('SELECT COUNT(*) AS count FROM wallet_sessions').get() as { count: number };
      if (count >= capacity) return undefined;
      const consumed = this.db.prepare('DELETE FROM siwe_challenges WHERE nonce = ? AND origin = ? AND expiresAt > ?')
        .run(nonce, workspaceOrigin.origin, now);
      if (!consumed.changes) return undefined;
      const token = randomBytes(32).toString('hex');
      const session = { owner: challenge.owner, expiresAt: now + sessionTtl };
      this.db.prepare('INSERT INTO wallet_sessions VALUES (?, ?, ?, ?)')
        .run(tokenDigest(token), workspaceOrigin.origin, session.owner, session.expiresAt);
      return { token, ...session };
    }).immediate();
  }

  getSession(token: string | undefined) {
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return undefined;
    return this.db.prepare('SELECT owner, expiresAt FROM wallet_sessions WHERE digest = ? AND origin = ? AND expiresAt > ?')
      .get(tokenDigest(token), workspaceOrigin.origin, this.now()) as Session | undefined;
  }

  revoke(token: string | undefined) {
    if (token) this.db.prepare('DELETE FROM wallet_sessions WHERE digest = ? AND origin = ?')
      .run(tokenDigest(token), workspaceOrigin.origin);
  }

  close() {
    this.db.close();
  }
}

export function bearerToken(header: string | undefined) {
  return /^Bearer ([a-f0-9]{64})$/i.exec(header ?? '')?.[1];
}

export const workspaceSessions = new WorkspaceSessionService(Date.now, env.WORKSPACE_DB_PATH);
