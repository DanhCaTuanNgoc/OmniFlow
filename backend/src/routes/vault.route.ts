import { Router } from 'express';
import { z } from 'zod';
import { isAddressEqual, zeroAddress, type Address, type Hash } from 'viem';
import { deploymentStore } from '../data/deployments.js';
import { chainService } from '../services/chain.service.js';
import { verifyStopLossMarket, verifyStopLossVault } from '../services/vaultCompatibility.js';

const address = z.custom<Address>(value => typeof value === 'string' &&
  /^0x[0-9a-f]{40}$/i.test(value) && value.toLowerCase() !== zeroAddress);
const marketSchema = z.object({ pair: address, router: address });
const linkSchema = z.object({
  pair: address, vault: address,
  creationTxHash: z.custom<Hash>(value => typeof value === 'string' && /^0x[0-9a-f]{64}$/i.test(value)).optional(),
});

export const vaultRouter = Router();

function vaultFailure(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message.startsWith('DAG Validation Failed:')) {
    return { status: 400, error: message.replace('DAG Validation Failed: ', '') };
  }
  return { status: 502, error: 'Unable to verify the Vault or market on Base Sepolia.' };
}

vaultRouter.post('/market', async (req, res) => {
  const input = marketSchema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'A valid pool and router address are required.' });
  try {
    return res.json(await verifyStopLossMarket(input.data.pair, input.data.router));
  } catch (error) {
    const failure = vaultFailure(error);
    return res.status(failure.status).json({ error: failure.error });
  }
});

vaultRouter.post('/link', async (req, res) => {
  const input = linkSchema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'Valid Vault and pool addresses are required.' });
  const { vault, pair, creationTxHash } = input.data;
  const owner = res.locals.workspaceOwner as Address;
  try {
    const config = await verifyStopLossVault(vault, owner, pair);
    if (creationTxHash) {
      const receipt = await chainService.basePublicClient.getTransactionReceipt({ hash: creationTxHash });
      if (receipt.status !== 'success' || !receipt.contractAddress ||
          !isAddressEqual(receipt.from, owner) || !isAddressEqual(receipt.contractAddress, vault)) {
        return res.status(400).json({ error: 'The creation receipt does not prove that this wallet deployed the Vault.' });
      }
    }
    return res.json({ vault: deploymentStore().linkVault({ ...config, address: vault, chainId: 84532, creationTxHash }) });
  } catch (error) {
    const failure = vaultFailure(error);
    return res.status(failure.status).json({ error: failure.error });
  }
});
