// FAQ content for OmniFlow & Reactive Omni Buildathon
export type FaqItem = { label: string; description: string };

export const FAQ_COLUMNS: FaqItem[][] = [
  [
    {
      label: "What is OmniFlow?",
      description:
        "<p class='mb-8'><b>OmniFlow</b> is the Zapier of Web3: a no-code cross-chain automation platform powered by <b>Reactive Omni</b>. It enables users to visually compose event-driven pipelines: listen on Base Sepolia, process autonomous state machines on Reactive Omni Lasna, and execute callbacks on destination vaults with zero off-chain keepers.</p><p class='mb-8'>Try it live in the <a class='underline' href=\"/workspace/studio\">Studio Canvas</a> or browse pre-built recipes.</p>",
    },
    {
      label: "How does OmniFlow achieve zero off-chain keeper dependencies?",
      description:
        "<p>Traditional cross-chain automations rely on centralized bot relayers (Gelato, Chainlink Keepers, custom webhooks) that suffer from liveness failures and key exposure risks. OmniFlow inverts this paradigm: <b>Reactive Smart Contracts (RSCs)</b> on Reactive Omni Lasna autonomously subscribe to events on Base Sepolia and dispatch callbacks through the Reactive Network consensus.</p>",
    },
    {
      label: "Are user funds safe in ActionVault?",
      description:
        "<p><b>100% Non-Custodial Guarantee.</b> Assets deposited in ActionVault remain under the user's sole ownership. The owner retains unconditional, immediate access to <code class='bg-body-light-bg-ghost rounded-6 p-4'>emergencyWithdraw()</code> (Panic Button) and <code class='bg-body-light-bg-ghost rounded-6 p-4'>executeSafeSweep()</code> at all times, completely bypassing RSC or relayer checks.</p>",
    },
    {
      label: "How does OmniFlow handle rapid 200ms blocks on Base Sepolia?",
      description:
        "<p>Base Sepolia's Denim upgrade introduced 200ms block times. To protect against multi-callback storms and race conditions, OmniFlow RSCs enforce a strict <b>Stateless Cooldown Timestamp</b> guard (<code class='bg-body-light-bg-ghost rounded-6 p-4'>block.timestamp - lastTriggeredTimestamp &gt;= cooldownSeconds</code>) at the start of every <code class='bg-body-light-bg-ghost rounded-6 p-4'>react()</code> cycle.</p>",
    },
  ],
  [
    {
      label: "How are destination trades protected against MEV and sandwich attacks?",
      description:
        "<p>Destination execution in ActionVault enforces <b>Live Price Re-Validation</b>. Even if an RSC triggered at price X, the vault re-queries live pool reserves on Base Sepolia at the exact moment of execution and rejects trades if slippage exceeds the user's configured <code class='bg-body-light-bg-ghost rounded-6 p-4'>minAmountOut</code>.</p>",
    },
    {
      label: "What chains and networks are supported?",
      description:
        "<p>OmniFlow is deployed across:</p>\n      <ul class='list-disc list-outside ml-24 flex flex-col m-8 gap-8'>\n        <li class='m-0 p-0'><b>Origin & Destination:</b> Base Sepolia (Chain ID: 84532, 200ms block time via Denim upgrade).</li>\n        <li class='m-0 p-0'><b>Reactive Core:</b> Reactive Omni Lasna Testnet (Chain ID: 5318007, ~1s block time, CometBFT consensus).</li>\n      </ul>",
    },
    {
      label: "How is callback authorization verified on Base Sepolia?",
      description:
        "<p>On Base Sepolia, ActionVault verifies that <code class='bg-body-light-bg-ghost rounded-6 p-4'>msg.sender</code> equals the official Reactive Callback Proxy address, and that the calling RSC matches <code class='bg-body-light-bg-ghost rounded-6 p-4'>authorizedRSCs[rscCaller] == true</code>. Unauthenticated callback attempts revert immediately.</p>",
    },
    {
      label: "Is OmniFlow open source?",
      description:
        "<p>Yes, Apache-2.0 / MIT. The smart contracts in Foundry, backend WebSocket relayer service, Next.js visual pipeline studio, and multi-chain full-loop verification scripts are fully open source.</p>",
    },
  ],
];
