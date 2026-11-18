import React from 'react';
import { Sidebar } from '@/components/common/Sidebar';
import { Header } from '@/components/common/Header';

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark flex h-screen w-screen overflow-hidden bg-[#000000] text-slate-100">
      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 relative overflow-y-auto bg-[#000000]">{children}</main>
      </div>
    </div>
  );
}
