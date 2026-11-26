'use client';

import { useEffect, useState } from 'react';
import type { Address } from 'viem';
import { workspaceRequest } from '@/lib/workspaceSession';

type Status = { enabled: boolean; linked: boolean };
type Link = { url: string; expires: number };

export function TelegramAlerts({ owner }: { owner: Address }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [link, setLink] = useState<Link | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function check() {
      try {
        const next = await workspaceRequest<Status>(owner, '/telegram/status', {
          sessionOnly: true, signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setStatus(next);
        setError('');
        if (next.linked) setLink(null);
        else if (link && Date.now() >= link.expires) {
          setLink(null);
          setExpired(true);
        } else if (link) timer = setTimeout(check, 2500);
      } catch {
        if (!controller.signal.aborted) setError('Could not check Telegram status.');
      }
    }
    void check();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [owner, link, refresh]);

  async function changeLink(method: 'POST' | 'DELETE') {
    setBusy(true);
    setError('');
    setExpired(false);
    try {
      if (method === 'POST') {
        setLink(await workspaceRequest<Link>(owner, '/telegram/link', { method, sessionOnly: true }));
      } else {
        await workspaceRequest(owner, '/telegram/link', { method, sessionOnly: true });
        setLink(null);
        setStatus(previous => previous && { ...previous, linked: false });
        setRefresh(value => value + 1);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update Telegram alerts.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-1 py-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-100">Telegram alerts</h2>
        <p role="status" className="mt-1 text-sm text-slate-300">
          {error || (status?.linked ? 'Linked to this wallet.' : expired ? 'Link expired. Create a new link.' :
            link ? 'Press Start in Telegram to finish linking.' : status?.enabled ?
              'Get a message when a vault executes or skips an order.' :
              status ? 'Telegram alerts are unavailable.' : 'Checking Telegram status…')}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {error && <button type="button" className="ws-button" onClick={() => setRefresh(value => value + 1)}>
          Refresh status
        </button>}
        {link && <a className="ws-button" href={link.url} target="_blank" rel="noopener noreferrer">Open Telegram</a>}
        {status?.enabled && !status.linked && !link && <button
          type="button" className="ws-button" disabled={busy} onClick={() => void changeLink('POST')}
        >
          Connect Telegram
        </button>}
        {(status?.linked || link) && <button
          type="button" className="ws-button" disabled={busy} onClick={() => void changeLink('DELETE')}
        >
          {status?.linked ? 'Disconnect' : 'Cancel link'}
        </button>}
      </div>
    </section>
  );
}
