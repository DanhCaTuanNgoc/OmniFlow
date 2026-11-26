import { setTimeout as delay } from 'node:timers/promises';
import { Bot, isTransientError, TelegramApiError, type Update } from 'node-telegram-bot-api';
import { formatEther, type Address } from 'viem';
import { env } from '../config/env.js';
import type { ActivityLogEntry } from '../data/activityLog.js';
import { deploymentEnvironment, deploymentStore } from '../data/deployments.js';

function notification(report: ActivityLogEntry) {
  const { amountIn, amountOut, executedPrice, reason, vaultEthBalance, ownerQuoteBalance } = report.details;
  return [
    `OmniFlow · ${report.status === 'SUCCESS' ? 'Executed' : 'Skipped'}`,
    report.pipelineName.slice(0, 160),
    reason,
    amountIn && amountOut ? `Swapped ${formatEther(BigInt(amountIn))} ETH → ${formatEther(BigInt(amountOut))} quote tokens` : undefined,
    executedPrice && executedPrice !== '0' ? `Price at callback: ${formatEther(BigInt(executedPrice))} quote / ETH` : undefined,
    vaultEthBalance !== undefined ? `Vault balance at callback block: ${formatEther(BigInt(vaultEthBalance))} ETH` : undefined,
    ownerQuoteBalance !== undefined ? `Owner balance at callback block: ${formatEther(BigInt(ownerQuoteBalance))} quote tokens` : undefined,
    report.fullLoopLatencyMs === undefined ? undefined : `Full loop: ${report.fullLoopLatencyMs} ms (block timestamps)`,
    `Origin: https://sepolia.basescan.org/tx/${report.originTxHash}`,
    `Lasna: https://lasna.reactscan.net/tx/${report.reactiveTxHash}`,
    `Callback: https://sepolia.basescan.org/tx/${report.destinationTxHash}`,
  ].filter(Boolean).join('\n');
}

async function handleUpdate(bot: Bot, update: Update, signal: AbortSignal) {
  if (!('message' in update)) return;
  const message = update.message;
  if (message?.chat.type !== 'private' || !message.text) return;
  const chat = String(message.chat.id);
  const [command, code] = message.text.trim().split(/\s+/, 2);
  const store = deploymentStore();
  let reply: string;
  if (command === '/start' && code && /^[\w-]{32}$/.test(code)) {
    const result = store.telegram.redeem(code, chat);
    reply = result === 'linked' ? 'Wallet linked. You will receive verified OmniFlow execution alerts here.' :
      result === 'conflict' ? 'This chat or wallet is already linked. Disconnect it in Vault Manager first.' :
        'This link has expired or was already used. Create a new link in Vault Manager.';
  } else if (command === '/start' || command === '/status' || command === '/panic') {
    const owner = store.telegram.owner(chat) as Address | undefined;
    const vaultUrl = `${env.WORKSPACE_ORIGIN}/workspace/vault`;
    if (!owner) reply = `Connect your wallet in Vault Manager first.\n${vaultUrl}`;
    else if (command === '/panic') reply = `Open Vault Manager, select your vault and sign the emergency withdrawal with your wallet.\n${vaultUrl}`;
    else if (command === '/status') {
      const deployments = store.list(owner, deploymentEnvironment).filter(item => item.archivedAt === null);
      const rows = deployments.slice(0, 15).map(item => {
        const name = JSON.parse(item.graphJson).metadata.name as string;
        return `${name.slice(0, 120)} · ${item.status}`;
      });
      reply = [...rows, rows.length ? vaultUrl : `No current deployments.\n${vaultUrl}`].join('\n');
    } else reply = 'Wallet already linked. Use /status to view deployments.';
  } else return;
  await bot.api.sendMessage({ chat_id: chat, text: reply, link_preview_options: { is_disabled: true } }, signal);
}

async function poll(bot: Bot, signal: AbortSignal) {
  let offset: number | undefined;
  while (!signal.aborted) {
    try {
      const updates = await bot.api.getUpdates({ offset, timeout: 20, allowed_updates: ['message'] }, signal);
      for (const update of updates) {
        if (signal.aborted) return;
        try {
          await handleUpdate(bot, update, signal);
        } catch {
          if (!signal.aborted) console.warn('Telegram could not process a bot command.');
        }
        offset = update.update_id + 1;
      }
    } catch (error) {
      if (signal.aborted) return;
      console.warn('Telegram polling failed; retrying.');
      await delay(retryDelay(error, 5000), undefined, { signal });
    }
  }
}

function retryDelay(error: unknown, fallback: number) {
  return error instanceof TelegramApiError && error.retryAfter !== undefined ? error.retryAfter * 1000 : fallback;
}

async function deliver(bot: Bot, signal: AbortSignal) {
  while (!signal.aborted) {
    try {
      if (await deliverNext(bot, signal)) continue;
    } catch {
      if (!signal.aborted) console.warn('Telegram delivery queue is unavailable.');
    }
    await delay(2000, undefined, { signal });
  }
}

async function deliverNext(bot: Bot, signal: AbortSignal) {
  const store = deploymentStore().telegram;
  const item = store.nextDelivery();
  if (!item) return false;
  try {
    const text = notification(JSON.parse(item.report) as ActivityLogEntry);
    await bot.api.sendMessage({ chat_id: item.chat, text, link_preview_options: { is_disabled: true } },
      AbortSignal.any([signal, AbortSignal.timeout(10_000)]));
  } catch (error) {
    if (signal.aborted) return false;
    const retry = item.attempts < 5 && isTransientError(error);
    store.complete(item.id, retry ? 'pending' : 'failed', Date.now() + retryDelay(error, 5000 * 2 ** item.attempts));
    if (!retry) console.warn('Telegram notification delivery failed.');
    return true;
  }
  store.complete(item.id, 'sent');
  return true;
}

export function startTelegram(signal: AbortSignal) {
  if (!env.TELEGRAM_BOT_TOKEN) return;
  const bot = new Bot(env.TELEGRAM_BOT_TOKEN, { timeoutMs: 30_000, maxRetries: 0 });
  void (async () => {
    while (!signal.aborted) {
      try {
        const me = await bot.api.getMe(signal);
        if (me.username?.toLowerCase() !== env.TELEGRAM_BOT_USERNAME?.toLowerCase()) {
          console.warn('Telegram bot username does not match configuration.');
          return;
        }
        await Promise.all([poll(bot, signal), deliver(bot, signal)]);
        return;
      } catch {
        if (!signal.aborted) console.warn('Telegram worker failed.');
        await delay(5000, undefined, { signal });
      }
    }
  })().catch(() => {
    if (!signal.aborted) console.warn('Telegram worker stopped unexpectedly.');
  });
}
