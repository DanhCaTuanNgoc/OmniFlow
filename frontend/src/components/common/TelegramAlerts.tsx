'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Address } from 'viem';
import { workspaceRequest } from '@/lib/workspaceSession';
import {
  invalidateTelegramCache,
  useWorkspaceTelegramStatusQuery,
  workspaceQueryKeys,
  writeWorkspaceCache,
  type TelegramStatus,
} from '@/lib/workspaceCache';

type Link = { url: string; expires: number };

export function TelegramAlerts({ owner }: { owner: Address }) {
  const queryClient = useQueryClient();
  const statusQuery = useWorkspaceTelegramStatusQuery(owner, true);
  const status = statusQuery.data ?? null;
  const [link, setLink] = useState<Link | null>(null);
  const [busy, setBusy] = useState(false);
  const [mutationError, setMutationError] = useState('');
  const [expired, setExpired] = useState(false);
  const error = mutationError || (statusQuery.isError ? 'Could not check Telegram status.' : '');

  useEffect(() => {
    if (!link) return;
    const timer = setInterval(() => {
      if (Date.now() >= link.expires) {
        setLink(null);
        setExpired(true);
        return;
      }
      void statusQuery.refetch().then((result) => {
        if (result.data?.linked) {
          setLink(null);
          writeWorkspaceCache(owner, 'telegram-status', result.data);
        }
      });
    }, 2500);
    return () => clearInterval(timer);
  }, [link, owner, statusQuery]);

  async function changeLink(method: 'POST' | 'DELETE') {
    setBusy(true);
    setMutationError('');
    setExpired(false);
    try {
      if (method === 'POST') {
        setLink(await workspaceRequest<Link>(owner, '/telegram/link', { method, sessionOnly: true }));
      } else {
        await workspaceRequest(owner, '/telegram/link', { method, sessionOnly: true });
        setLink(null);
        queryClient.setQueryData<TelegramStatus>(workspaceQueryKeys.telegramStatus(owner), (previous) => {
          const next = previous ? { ...previous, linked: false } : previous;
          if (next) writeWorkspaceCache(owner, 'telegram-status', next);
          return next;
        });
        void invalidateTelegramCache(queryClient, owner);
      }
    } catch (cause) {
      setMutationError(cause instanceof Error ? cause.message : 'Could not update Telegram alerts.');
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
        {error && <button type="button" className="ws-button" onClick={() => {
          setMutationError('');
          void statusQuery.refetch();
        }}>
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
