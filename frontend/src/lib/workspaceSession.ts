import { getAccount, signMessage, watchAccount } from 'wagmi/actions';
import { isAddressEqual, type Address } from 'viem';
import { APP_CONFIG } from './constants';
import { wagmiConfig } from './wagmi';

type Session = { owner: Address; expiresAt: number; token: string };
type Challenge = { nonce: string; message: string };

let session: Session | undefined;
let walletVersion = 0;
let watching = false;

const sessionUrl = `${APP_CONFIG.backendUrl}/api/session`;

function revoke(previous: Session) {
  void fetch(sessionUrl, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${previous.token}` },
    keepalive: true,
  }).catch(() => undefined); // The server also expires sessions independently.
}

async function post<T>(path: string, body: object): Promise<T> {
  const response = await fetch(`${sessionUrl}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const failure = await response.json().catch(() => null);
    throw new Error(failure?.error ?? `Workspace sign-in failed (${response.status}).`);
  }
  return response.json();
}

export function invalidateWorkspaceSession(token: string) {
  if (session?.token !== token) return;
  const previous = session;
  session = undefined;
  revoke(previous);
}

export function getWorkspaceSessionToken(owner: Address) {
  return session && session.expiresAt > Date.now() && isAddressEqual(owner, session.owner) ? session.token : undefined;
}

export async function signInToWorkspace(owner: Address) {
  if (!watching) {
    watching = true;
    watchAccount(wagmiConfig, {
      onChange(account, previous) {
        if (account.address === previous.address && account.isConnected === previous.isConnected) return;
        walletVersion++;
        if (session) invalidateWorkspaceSession(session.token);
      },
    });
  }

  const version = walletVersion;
  const ensureCurrentWallet = (mustBeOnBase: boolean) => {
    const account = getAccount(wagmiConfig);
    if (version !== walletVersion || !account.isConnected || !account.address ||
        !isAddressEqual(owner, account.address) || (mustBeOnBase && account.chainId !== 84532)) {
      throw new Error('Connect the deployment wallet to Base Sepolia to sign in.');
    }
  };
  ensureCurrentWallet(false);
  if (session && session.expiresAt > Date.now() && isAddressEqual(owner, session.owner)) return session;

  ensureCurrentWallet(true);
  const challenge = await post<Challenge>('challenge', { address: owner });
  ensureCurrentWallet(true);
  const signature = await signMessage(wagmiConfig, { account: owner, message: challenge.message });
  ensureCurrentWallet(true);
  const verified = await post<Session>('verify', { nonce: challenge.nonce, signature });
  try {
    ensureCurrentWallet(true);
    if (!isAddressEqual(owner, verified.owner)) throw new Error('The workspace session belongs to another wallet.');
  } catch (error) {
    revoke(verified);
    throw error;
  }
  if (session) revoke(session);
  session = verified;
  return verified;
}

export async function workspaceRequest<T>(owner: Address, path: string, options?: RequestInit): Promise<T> {
  const signedIn = await signInToWorkspace(owner);
  const version = walletVersion;
  const headers = new Headers(options?.headers);
  headers.set('Authorization', `Bearer ${signedIn.token}`);
  if (options?.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${APP_CONFIG.backendUrl}/api${path}`, { ...options, headers });
  if (response.status === 401) invalidateWorkspaceSession(signedIn.token);
  const result = await response.json();
  if (version !== walletVersion) throw new Error('The connected wallet changed.');
  if (!response.ok) throw new Error(result.message || result.error || `Workspace request failed (${response.status}).`);
  return result;
}
