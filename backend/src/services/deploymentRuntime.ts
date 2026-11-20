import { isAddressEqual, parseAbi, type Address } from 'viem';
import { ACTION_VAULT_ABI, STOP_LOSS_TEMPLATE, resolveStopLoss } from '@omniflow/shared';
import type { deployerService } from './deployer.service.js';
import { chainService } from './chain.service.js';

const feeAbi = parseAbi([
  'function debt(address) view returns (uint256)',
  'function reserves(address) view returns (uint256)',
  'function _gasPriceCoeffPer1000() view returns (uint256)',
  'function _extraGas() view returns (uint256)',
]);
type Deployment = NonNullable<ReturnType<typeof deployerService.getDeployment>>;

async function fees(client: typeof chainService.basePublicClient, provider: Address, payer: Address, gasCap: bigint) {
  const read = { address: provider, abi: feeAbi } as const;
  const [debt, reserves, coefficient, overhead, gasPrice] = await Promise.all([
    client.readContract({ ...read, functionName: 'debt', args: [payer] }),
    client.readContract({ ...read, functionName: 'reserves', args: [payer] }),
    client.readContract({ ...read, functionName: '_gasPriceCoeffPer1000' }),
    client.readContract({ ...read, functionName: '_extraGas' }),
    client.getGasPrice(),
  ]);
  if (coefficient <= 0n || gasPrice <= 0n) throw new Error('Fee parameters are unavailable.');
  const budget = ((gasCap + BigInt(overhead)) * coefficient * gasPrice + 999n) / 1000n;
  return { debt, reserves, budget };
}

export async function readDeploymentRuntime(deployment: Deployment, owner: Address) {
  const { rscAddress, vaultAddress } = deployment.contracts;
  if (!rscAddress || deployment.status !== 'deployed') return null;
  const { basePublicClient: base, lasnaPublicClient: lasna } = chainService;
  const vault = { address: vaultAddress, abi: ACTION_VAULT_ABI } as const;
  const [baseRead, lasnaRead] = await Promise.allSettled([
    (async () => {
      if (await base.getChainId() !== 84532) throw new Error('Unexpected Base RPC.');
      const [principal, currentOwner, authorized, callback] = await Promise.all([
        base.getBalance({ address: vaultAddress }),
        base.readContract({ ...vault, functionName: 'owner' }),
        base.readContract({ ...vault, functionName: 'authorizedRSCs', args: [rscAddress] }),
        fees(base, STOP_LOSS_TEMPLATE.callbackProxy, vaultAddress, 350_000n),
      ]);
      return { principal, authorized: authorized && isAddressEqual(owner, currentOwner), callback };
    })(),
    (async () => {
      if (await lasna.getChainId() !== 5318007) throw new Error('Unexpected Lasna RPC.');
      const [native, reactive] = await Promise.all([
        lasna.getBalance({ address: rscAddress }),
        fees(lasna, STOP_LOSS_TEMPLATE.omniSystem, rscAddress, 900_000n),
      ]);
      return { native, reactive };
    })(),
  ]);
  const baseData = baseRead.status === 'fulfilled' ? baseRead.value : null;
  const lasnaData = lasnaRead.status === 'fulfilled' ? lasnaRead.value : null;
  const { percentToSwap } = resolveStopLoss(deployment.graph);
  const status = !baseData || !lasnaData ? 'unverified' : !baseData.authorized ? 'awaiting-authorization' :
    baseData.principal * percentToSwap / 100n === 0n ? 'awaiting-principal' :
    baseData.callback.debt > 0n || lasnaData.reactive.debt > 0n || baseData.callback.reserves < baseData.callback.budget ||
      lasnaData.native + lasnaData.reactive.reserves < lasnaData.reactive.budget ? 'awaiting-fees' : 'ready';
  return JSON.parse(JSON.stringify({ status, base: baseData, lasna: lasnaData, readAt: new Date().toISOString() },
    (_key, value) => typeof value === 'bigint' ? value.toString() : value));
}
