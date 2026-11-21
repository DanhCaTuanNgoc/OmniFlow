import type { ReactNode } from 'react';
import { Sidebar } from '@/components/common/Sidebar';
import { Header } from '@/components/common/Header';
import { WorkspaceWalletModal } from '@/components/common/WorkspaceWalletModal';
import '@/styles/workspace.css';

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ws-shell dark flex h-dvh w-full overflow-hidden font-sans">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="relative min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
      <WorkspaceWalletModal />
    </div>
  );
}
