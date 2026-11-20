import { createHash, randomBytes } from 'node:crypto';
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

function reclaimExpired<T extends Session>(entries: Map<string, T>, now: number) {
  if (entries.size < capacity) return;
  for (const [key, value] of entries) {
    if (value.expiresAt <= now) entries.delete(key);
  }
}

export class WorkspaceSessionService {
  private readonly challenges = new Map<string, Challenge>();
  private readonly sessions = new Map<string, Session>();

  constructor(private readonly now: () => number = Date.now) {}

  createChallenge(address: Address) {
    const now = this.now();
    reclaimExpired(this.challenges, now);
    if (this.challenges.size >= capacity) return undefined;
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
    this.challenges.set(nonce, { message, owner, expiresAt });
    return { nonce, message, expiresAt };
  }

  async verify(nonce: string, signature: Hex) {
    const challenge = this.challenges.get(nonce);
    if (!challenge || challenge.expiresAt <= this.now()) return undefined;
    const valid = await verifyMessage({
      address: challenge.owner,
      message: challenge.message,
      signature,
    }).catch(() => false);
    const now = this.now();
    if (!valid || challenge.expiresAt <= now || !this.challenges.delete(nonce)) return undefined;

    reclaimExpired(this.sessions, now);
    if (this.sessions.size >= capacity) return undefined;
    const token = randomBytes(32).toString('hex');
    const session = { owner: challenge.owner, expiresAt: now + sessionTtl };
    this.sessions.set(tokenDigest(token), session);
    return { token, ...session };
  }

  getSession(token: string | undefined) {
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return undefined;
    const key = tokenDigest(token);
    const session = this.sessions.get(key);
    if (session && session.expiresAt > this.now()) return session;
    this.sessions.delete(key);
    return undefined;
  }

  revoke(token: string | undefined) {
    if (token) this.sessions.delete(tokenDigest(token));
  }
}

export function bearerToken(header: string | undefined) {
  return /^Bearer ([a-f0-9]{64})$/i.exec(header ?? '')?.[1];
}

export const workspaceSessions = new WorkspaceSessionService();
