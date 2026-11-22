import { connect, getAccount, signMessage, watchAccount } from 'wagmi/actions';
import { isAddress, isAddressEqual, type Address } from 'viem';
import { APP_CONFIG } from './constants';
import { wagmiConfig } from './wagmi';

type Session = { owner: Address; expiresAt: number; token: string };
type Challenge = { nonce: string; message: string };

let session: Session | undefined;
let walletVersion = 0;
let watching = false;
const sessionKey = 'omniflow.workspace.session.v1';
const sessionListeners = new Set<() => void>();
let expiryTimer: ReturnType<typeof setTimeout> | undefined;

function setSession(next?: Session) {
  session = next;
  clearTimeout(expiryTimer);
  try {
    if (next) sessionStorage.setItem(sessionKey, JSON.stringify(next));
    else sessionStorage.removeItem(sessionKey);
  } catch {
    // The current tab can still use the in-memory session.
  }
  if (next) expiryTimer = setTimeout(() => invalidateWorkspaceSession(next.token), Math.max(0, next.expiresAt - Date.now()));
  sessionListeners.forEach(listener => listener());
}

export function subscribeToWorkspaceSession(listener: () => void) {
  sessionListeners.add(listener);
  trackWorkspaceWallet();
  return () => { sessionListeners.delete(listener); };
}

function trackWorkspaceWallet() {
  if (watching || typeof window === 'undefined') return;
  watching = true;
  try {
    const restored = JSON.parse(sessionStorage.getItem(sessionKey) ?? 'null') as Partial<Session> | null;
    if (restored && typeof restored.owner === 'string' && isAddress(restored.owner) &&
        typeof restored.token === 'string' && typeof restored.expiresAt === 'number' && restored.expiresAt > Date.now()) {
      const account = getAccount(wagmiConfig);
      if (!account.address || isAddressEqual(account.address, restored.owner)) setSession(restored as Session);
      else setSession();
    } else {
      setSession();
    }
  } catch {
    setSession();
  }
  watchAccount(wagmiConfig, {
    onChange(account, previous) {
      if (account.address === previous.address && account.isConnected === previous.isConnected) return;
      walletVersion++;
      walletPrompt?.finish(false);
      if (session && ((account.address && !isAddressEqual(account.address, session.owner)) ||
          (previous.isConnected && !account.isConnected && account.status === 'disconnected'))) {
        invalidateWorkspaceSession(session.token);
      }
    },
  });
}

type WalletPrompt = { canSwitch: boolean; finish: (approved: boolean) => void };
let walletPrompt: WalletPrompt | null = null;
const promptListeners = new Set<() => void>();

export function subscribeToWorkspaceWalletPrompt(listener: () => void) {
  promptListeners.add(listener);
  return () => { promptListeners.delete(listener); };
}

export function getWorkspaceWalletPrompt() {
  return walletPrompt;
}

export class WorkspaceWalletPromptCancelled extends Error {
  constructor() {
    super('');
    this.name = 'WorkspaceWalletPromptCancelled';
  }
}

export class WorkspaceSignInRequired extends Error {
  constructor() {
    super('Sign in to access your wallet workspace.');
    this.name = 'WorkspaceSignInRequired';
  }
}

let promptResult: Promise<boolean> | undefined;
function requestWalletPrompt(canSwitch: boolean) {
  if (walletPrompt?.canSwitch === canSwitch && promptResult) return promptResult;
  walletPrompt?.finish(false);
  promptResult = new Promise<boolean>((resolve) => {
    walletPrompt = {
      canSwitch,
      finish(approved) {
        if (walletPrompt !== this) return;
        walletPrompt = null;
        promptResult = undefined;
        resolve(approved);
        promptListeners.forEach((listener) => listener());
      },
    };
  });
  promptListeners.forEach((listener) => listener());
  return promptResult;
}

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
  setSession();
  revoke(previous);
}

export function getWorkspaceSessionToken(owner: Address) {
  return session && session.expiresAt > Date.now() && isAddressEqual(owner, session.owner) ? session.token : undefined;
}

export function clearWorkspaceSession() {
  if (session) invalidateWorkspaceSession(session.token);
}

let pendingConnection: Promise<Session> | undefined;
export function connectAndSignInToWorkspace() {
  if (pendingConnection) return pendingConnection;
  pendingConnection = (async () => {
    trackWorkspaceWallet();
    const account = getAccount(wagmiConfig);
    if (account.isConnected && account.address) return signInToWorkspace(account.address);
    const connector = wagmiConfig.connectors[0];
    if (!connector) throw new Error('Open MetaMask to connect a wallet.');
    const connection = await connect(wagmiConfig, { connector });
    return signInToWorkspace(connection.accounts[0]);
  })().finally(() => { pendingConnection = undefined; });
  return pendingConnection;
}

let pendingSignIn: { owner: Address; task: Promise<Session> } | undefined;

export async function signInToWorkspace(owner: Address) {
  if (pendingSignIn && isAddressEqual(owner, pendingSignIn.owner)) return pendingSignIn.task;
  const task = createWorkspaceSession(owner);
  pendingSignIn = { owner, task };
  try {
    return await task;
  } finally {
    if (pendingSignIn?.task === task) pendingSignIn = undefined;
  }
}

async function createWorkspaceSession(owner: Address) {
  trackWorkspaceWallet();

  const version = walletVersion;
  const ensureCurrentWallet = async (mustBeOnBase: boolean) => {
    const account = getAccount(wagmiConfig);
    if (version !== walletVersion || !account.isConnected || !account.address ||
        !isAddressEqual(owner, account.address)) {
      await requestWalletPrompt(false);
      throw new WorkspaceWalletPromptCancelled();
    }
    if (mustBeOnBase && account.chainId !== 84532) {
      const approved = await requestWalletPrompt(true);
      const current = getAccount(wagmiConfig);
      if (!approved || version !== walletVersion || current.chainId !== 84532) {
        throw new WorkspaceWalletPromptCancelled();
      }
    }
  };
  await ensureCurrentWallet(false);
  if (session && session.expiresAt > Date.now() && isAddressEqual(owner, session.owner)) return session;

  await ensureCurrentWallet(true);
  const challenge = await post<Challenge>('challenge', { address: owner });
  await ensureCurrentWallet(true);
  const signature = await signMessage(wagmiConfig, { account: owner, message: challenge.message });
  await ensureCurrentWallet(true);
  const verified = await post<Session>('verify', { nonce: challenge.nonce, signature });
  try {
    await ensureCurrentWallet(true);
    if (!isAddressEqual(owner, verified.owner)) throw new Error('The workspace session belongs to another wallet.');
  } catch (error) {
    revoke(verified);
    throw error;
  }
  if (session) revoke(session);
  setSession(verified);
  return verified;
}

type WorkspaceRequestOptions = RequestInit & { sessionOnly?: boolean };

export async function workspaceRequest<T>(owner: Address, path: string, options?: WorkspaceRequestOptions): Promise<T> {
  const { sessionOnly, ...request } = options ?? {};
  request.signal?.throwIfAborted();
  const token = sessionOnly ? getWorkspaceSessionToken(owner) : (await signInToWorkspace(owner)).token;
  if (!token) throw new WorkspaceSignInRequired();
  request.signal?.throwIfAborted();
  const version = walletVersion;
  const headers = new Headers(request.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (request.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${APP_CONFIG.backendUrl}/api${path}`, { ...request, headers, cache: 'no-store' });
  if (response.status === 401) {
    invalidateWorkspaceSession(token);
    if (sessionOnly) throw new WorkspaceSignInRequired();
  }
  const result = await response.json();
  if (version !== walletVersion) throw new Error('The connected wallet changed.');
  if (!response.ok) throw new Error(result.message || result.error || `Workspace request failed (${response.status}).`);
  return result;
}
