import { redirect } from 'next/navigation';
import ActiveAutomations from './ActiveAutomations';

export default function ActiveAutomationsPage({
  searchParams,
}: {
  searchParams: { deployment?: string | string[] };
}) {
  const id = searchParams.deployment;
  if (typeof id === 'string' && id) {
    redirect(`/workspace/active/${encodeURIComponent(id)}`);
  }

  return <ActiveAutomations />;
}
