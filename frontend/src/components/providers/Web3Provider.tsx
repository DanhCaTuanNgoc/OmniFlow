'use client';

import React, { useEffect, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { getAccount } from 'wagmi/actions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmi';
import { getWorkspaceSessionToken, subscribeToWorkspaceSession } from '@/lib/workspaceSession';

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            staleTime: 15_000, // 15 seconds: keeps balances hot in memory during route switching
            gcTime: 60_000,
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    return subscribeToWorkspaceSession(() => {
      const account = getAccount(wagmiConfig);
      const activeOwner = account.address;
      const activeToken = activeOwner ? getWorkspaceSessionToken(activeOwner) : undefined;
      if (!activeOwner || !activeToken) {
        queryClient.removeQueries({ queryKey: ['workspace'] });
        return;
      }
      const lower = activeOwner.toLowerCase();
      queryClient.removeQueries({
        predicate: (query) =>
          query.queryKey[0] === 'workspace' &&
          typeof query.queryKey[1] === 'string' &&
          query.queryKey[1] !== lower,
      });
    });
  }, [queryClient]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
