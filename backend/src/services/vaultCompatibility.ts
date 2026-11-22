import { BaseError, ContractFunctionRevertedError, isAddressEqual, parseAbi, type Address } from 'viem';
import { ACTION_VAULT_ABI, PRICE_ORDER_VAULT_ABI, STOP_LOSS_TEMPLATE } from '@omniflow/shared';
import { PRICE_ORDER_VAULT_RUNTIME, VAULT_RUNTIME } from '../abis/runtimeFingerprints.js';
import { chainService } from './chain.service.js';
import { matchesRuntime } from './runtimeBytecode.js';

const marketAbi = parseAbi([
  'function WETH() view returns (address)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function decimals() view returns (uint8)',
]);

export function verifyStopLossVault(address: Address, expectedOwner: Address, expectedPair: Address) {
  return verifyVault(address, expectedOwner, expectedPair, ACTION_VAULT_ABI, VAULT_RUNTIME, 'Action Vault');
}

export function verifyPriceOrderVault(address: Address, expectedOwner: Address, expectedPair: Address) {
  return verifyVault(address, expectedOwner, expectedPair, PRICE_ORDER_VAULT_ABI, PRICE_ORDER_VAULT_RUNTIME, 'Price Order Vault');
}

async function verifyVault(address: Address, expectedOwner: Address, expectedPair: Address,
  abi: typeof ACTION_VAULT_ABI | typeof PRICE_ORDER_VAULT_ABI, runtime: typeof VAULT_RUNTIME, vaultLabel: string) {
  const base = chainService.basePublicClient;
  const vault = { address, abi } as const;
  const [chain, vaultCode, proxyCode] = await Promise.all([
    base.getChainId(), base.getCode({ address }),
    base.getCode({ address: STOP_LOSS_TEMPLATE.callbackProxy }),
  ]);
  if (chain !== STOP_LOSS_TEMPLATE.networks.destinationChainId) {
    throw new Error('Vault RPC must point to Base Sepolia.');
  }
  if (!proxyCode || proxyCode === '0x') {
    throw new Error('The configured Base Sepolia callback proxy has no deployed contract.');
  }
  if (!vaultCode || vaultCode === '0x') {
    throw new Error('DAG Validation Failed: no Vault contract is deployed at this address on Base Sepolia.');
  }
  if (!matchesRuntime(vaultCode, runtime)) {
    throw new Error(`DAG Validation Failed: this address is not a supported ${vaultLabel}. Select or create a ${vaultLabel} on Base Sepolia.`);
  }
  const [owner, pair, router, quote, slippage] = await Promise.all([
    base.readContract({ ...vault, functionName: 'owner' }),
    base.readContract({ ...vault, functionName: 'tokenPair' }),
    base.readContract({ ...vault, functionName: 'uniswapRouter' }),
    base.readContract({ ...vault, functionName: 'usdcToken' }),
    base.readContract({ ...vault, functionName: 'MAX_SLIPPAGE_BPS' }),
  ]);
  if (!isAddressEqual(owner, expectedOwner)) {
    throw new Error('DAG Validation Failed: the selected Vault belongs to another wallet.');
  }
  if (!isAddressEqual(pair, expectedPair) || slippage !== BigInt(STOP_LOSS_TEMPLATE.maxSlippageBps)) {
    throw new Error('DAG Validation Failed: the Vault must use the selected pool and supported slippage limit.');
  }
  try {
    await base.simulateContract({
      ...vault, functionName: 'pay', args: [0n], account: STOP_LOSS_TEMPLATE.callbackProxy,
    });
  } catch (error) {
    if (error instanceof BaseError && error.walk(cause => cause instanceof ContractFunctionRevertedError) instanceof ContractFunctionRevertedError) {
      throw new Error('DAG Validation Failed: the Vault does not accept the current callback proxy.');
    }
    throw error;
  }
  await verifyStopLossMarket(pair, router, quote);
  return { owner, pair, router, quote, proxy: STOP_LOSS_TEMPLATE.callbackProxy };
}

export async function verifyStopLossMarket(pair: Address, router: Address, expectedQuote?: Address) {
  const base = chainService.basePublicClient;
  if (await base.getChainId() !== STOP_LOSS_TEMPLATE.networks.destinationChainId) {
    throw new Error('Vault RPC must point to Base Sepolia.');
  }
  const [token0, token1, weth] = await Promise.all([
    base.readContract({ address: pair, abi: marketAbi, functionName: 'token0' }),
    base.readContract({ address: pair, abi: marketAbi, functionName: 'token1' }),
    base.readContract({ address: router, abi: marketAbi, functionName: 'WETH' }),
  ]);
  const decimals = await Promise.all([token0, token1].map(address =>
    base.readContract({ address, abi: marketAbi, functionName: 'decimals' })));
  if (!isAddressEqual(token0, weth) || (expectedQuote && !isAddressEqual(token1, expectedQuote)) ||
      isAddressEqual(token0, token1) || decimals.some(value => value !== 18)) {
    throw new Error('DAG Validation Failed: stop-loss requires WETH as token0 and the Vault quote token as token1, both with 18 decimals.');
  }
  return { quote: token1 };
}
