import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { config } from '../backend/node_modules/dotenv';
import {
  createPublicClient, createWalletClient, decodeAbiParameters, decodeFunctionData, defineChain, encodeFunctionData,
  formatEther, getAddress, http, isAddressEqual, numberToHex, parseAbi, parseEventLogs,
  toEventSelector, type Address, type Hash, type Hex, type TransactionReceipt,
} from '../backend/node_modules/viem';
import { baseSepolia } from '../backend/node_modules/viem/chains';
import { privateKeyToAccount } from '../backend/node_modules/viem/accounts';
import { estimateL1Fee } from '../backend/node_modules/viem/op-stack';
import deployment from '../FULL_LOOP_EVIDENCE.json';
import { callbackConfiguration, findStopLossDelivery } from '../backend/src/services/callbackEvidence';

config({ path: resolve(__dirname, '../.env') });
config({ path: resolve(__dirname, '../backend/.env') });

const lasna = defineChain({
  id: 5318007,
  name: 'Reactive Lasna',
  nativeCurrency: { name: 'Lasna REACT', symbol: 'lREACT', decimals: 18 },
  rpcUrls: { default: { http: ['https://lasna-rpc.rnk.dev'] } },
});
const base = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.BASE_SEPOLIA_RPC_URL || 'https://base-sepolia-rpc.publicnode.com'),
});
const reactive = createPublicClient({ chain: lasna, transport: http(process.env.LASNA_RPC_URL) });
const pair = getAddress((process.env.PAIR_ADDRESS || deployment.contracts.originPair.address).toLowerCase());
const vault = getAddress((process.env.VAULT_ADDRESS || deployment.contracts.destinationVault.address).toLowerCase());
const rsc = getAddress((process.env.RSC_ADDRESS || deployment.contracts.reactiveSmartContract.address).toLowerCase());
const officialProxy = '0x476F44b11F5C942c58f4c8E3d0300E5710743585';
const proxy = getAddress((process.env.CALLBACK_PROXY_BASE_SEPOLIA || officialProxy).toLowerCase());
const system = '0x8888888888888888888888888888888888888888';
const callbackGas = 350_000n;
const reactiveGasCap = 900_000n;

const abi = parseAbi([
  'function debt(address) view returns (uint256)',
  'function reserves(address) view returns (uint256)',
  'function _gasPriceCoeffPer1000() view returns (uint256)',
  'function _extraGas() view returns (uint256)',
  'function _maxChargeGas() view returns (uint256)',
  'function pairAddress() view returns (address)',
  'function actionVault() view returns (address)',
  'function originChainId() view returns (uint256)',
  'function originTopic0() view returns (uint256)',
  'function priceThreshold() view returns (uint256)',
  'function percentToSwap() view returns (uint256)',
  'function requiredHits() view returns (uint256)',
  'function consecutiveHits() view returns (uint256)',
  'function cooldownSeconds() view returns (uint256)',
  'function lastTriggeredTimestamp() view returns (uint256)',
  'function tokenPair() view returns (address)',
  'function owner() view returns (address)',
  'function uniswapRouter() view returns (address)',
  'function usdcToken() view returns (address)',
  'function authorizedRSCs(address) view returns (bool)',
  'function WETH() view returns (address)',
  'function getAmountsOut(uint256, address[]) view returns (uint256[])',
  'function getReserves() view returns (uint112, uint112, uint32)',
  'function setReserves(uint112, uint112)',
  'function executeStopLoss(address, address, uint256, uint256)',
  'function deliverCallback(uint8, bytes)',
  'function callback(address, bytes)',
  'function callbackRnk(uint64, address, bytes)',
  'function getCallbacks(uint256) view returns ((uint256 blockNumber, address requester, uint256 callbackIndex, uint256 chainId, uint256 txHash, bytes err)[])',
  'event Sync(uint112 reserve0, uint112 reserve1)',
  'event CallbackRequest(uint256 indexed chainId, address indexed sender, address indexed recipient, uint8 version, bytes configuration)',
  'event OmniCallbackRequested(uint256 indexed chain_id, address indexed _contract, uint64 indexed gas_limit, bytes payload)',
  'event Callback(uint256 indexed chain_id, address indexed _contract, uint64 indexed gas_limit, bytes payload)',
  'event StopLossExecuted(uint256 ethAmountIn, uint256 minUsdcOut, uint256 timestamp)',
  'event OrderSkipped(string reason, uint256 currentPrice)',
  'event CallbackFailure(address indexed target, bytes payload)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
]);
const syncTopic = toEventSelector('Sync(uint112,uint112)');

function requireCheck(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}

async function funding(
  client: typeof base | typeof reactive, provider: Address, payer: Address, gasBudget: bigint, currency: string,
) {
  const read = { address: provider, abi } as const;
  const [balance, debt, reserves, coefficient, extraGas, chargeGas, price, block] = await Promise.all([
    client.getBalance({ address: payer }),
    client.readContract({ ...read, functionName: 'debt', args: [payer] }),
    client.readContract({ ...read, functionName: 'reserves', args: [payer] }),
    client.readContract({ ...read, functionName: '_gasPriceCoeffPer1000' }),
    client.readContract({ ...read, functionName: '_extraGas' }),
    client.readContract({ ...read, functionName: '_maxChargeGas' }),
    client.getGasPrice(),
    client.getBlock(),
  ]);
  const baseFee = block.baseFeePerGas ?? 0n;
  const gasPrice = price > baseFee ? price : baseFee;
  requireCheck(gasPrice > 0n && coefficient > 0n, 'RPC returned unusable fee parameters.');
  const budget = ((gasBudget + BigInt(extraGas)) * gasPrice * BigInt(coefficient) + 999n) / 1000n;
  console.log({ payer, provider, currency, balance: formatEther(balance), debt: formatEther(debt),
    reserves: formatEther(reserves), estimatedFeeBudget: formatEther(budget) });
  return { balance, debt, reserves, budget, extraGas, chargeGas };
}

async function preflight(forRebound = false) {
  requireCheck(isAddressEqual(proxy, officialProxy), `Use the current Base Sepolia callback proxy: ${officialProxy}.`);
  const [baseId, lasnaId] = await Promise.all([base.getChainId(), reactive.getChainId()]);
  requireCheck(baseId === baseSepolia.id && lasnaId === lasna.id, 'Unexpected RPC chain ID.');
  const deployments = await Promise.all([
    base.getCode({ address: pair }), base.getCode({ address: vault }), base.getCode({ address: proxy }),
    reactive.getCode({ address: rsc }), reactive.getCode({ address: system }),
  ]);
  requireCheck(deployments.every(code => code && code !== '0x'), 'A configured contract has no on-chain bytecode.');

  const rscRead = { address: rsc, abi } as const;
  const vaultRead = { address: vault, abi } as const;
  const [callback, reaction, linkedPair, linkedVault, chain, topic, threshold, percent,
    requiredHits, hits, cooldown, lastTrigger, lasnaTip, vaultPair, authorized, router, token, owner, reserves] =
    await Promise.all([
      funding(base, proxy, vault, callbackGas, 'ETH'),
      funding(reactive, system, rsc, reactiveGasCap, 'lREACT'),
      reactive.readContract({ ...rscRead, functionName: 'pairAddress' }),
      reactive.readContract({ ...rscRead, functionName: 'actionVault' }),
      reactive.readContract({ ...rscRead, functionName: 'originChainId' }),
      reactive.readContract({ ...rscRead, functionName: 'originTopic0' }),
      reactive.readContract({ ...rscRead, functionName: 'priceThreshold' }),
      reactive.readContract({ ...rscRead, functionName: 'percentToSwap' }),
      reactive.readContract({ ...rscRead, functionName: 'requiredHits' }),
      reactive.readContract({ ...rscRead, functionName: 'consecutiveHits' }),
      reactive.readContract({ ...rscRead, functionName: 'cooldownSeconds' }),
      reactive.readContract({ ...rscRead, functionName: 'lastTriggeredTimestamp' }),
      reactive.getBlock(),
      base.readContract({ ...vaultRead, functionName: 'tokenPair' }),
      base.readContract({ ...vaultRead, functionName: 'authorizedRSCs', args: [rsc] }),
      base.readContract({ ...vaultRead, functionName: 'uniswapRouter' }),
      base.readContract({ ...vaultRead, functionName: 'usdcToken' }),
      base.readContract({ ...vaultRead, functionName: 'owner' }),
      base.readContract({ address: pair, abi, functionName: 'getReserves' }),
    ]);
  requireCheck(isAddressEqual(linkedPair, pair) && isAddressEqual(vaultPair, pair) &&
    isAddressEqual(linkedVault, vault) && chain === BigInt(baseId) && topic === BigInt(syncTopic) && authorized,
  'Pair, Vault, RSC subscription configuration or authorization does not match.');

  const blockers: string[] = [];
  const callbackTopUp = callback.debt + (callback.budget > callback.reserves ? callback.budget - callback.reserves : 0n);
  // Keep fees prepaid. Legacy RSCs may accept pay() only from the old service address.
  const reactionTopUp = reaction.debt + (reaction.budget > reaction.reserves ? reaction.budget - reaction.reserves : 0n);
  if (callbackTopUp > 0n) blockers.push(
    `Callback reserve needs ${formatEther(callbackTopUp)} ETH via depositTo(${vault}) on ${proxy}, at the current gas quote.`,
  );
  if (reactionTopUp > 0n) blockers.push(
    `RSC needs ${formatEther(reactionTopUp)} lREACT via depositTo(${rsc}) on ${system}, at the current gas quote.`,
  );
  if (callback.balance === 0n) blockers.push(`Vault ${vault} also needs separate ETH for the swap principal.`);
  requireCheck(percent > 0n && percent <= 100n, 'Invalid on-chain swap percentage.');
  const amountIn = callback.balance * BigInt(percent) / 100n;
  if (amountIn === 0n) blockers.push('Vault swap amount rounds down to zero.');
  const [reserve0, reserve1] = reserves;
  requireCheck(reserve0 > 0n && reserve1 > 0n, 'Pair is missing liquidity.');
  const price = reserve1 * 10n ** 18n / reserve0;
  if ((!forRebound && price > threshold) || threshold === 0n) blockers.push('Current pair price is above the active stop-loss threshold or the threshold is disabled.');
  if (hits + 1n < requiredHits) blockers.push(`One Sync cannot trigger this pipeline (hits ${hits}/${requiredHits}).`);
  if (lastTrigger !== 0n && lasnaTip.timestamp < lastTrigger + cooldown) blockers.push('RSC cooldown is still active.');

  if (amountIn > 0n && price <= threshold && threshold > 0n) {
    const weth = await base.readContract({ address: router, abi, functionName: 'WETH' });
    const quote = await base.readContract({ address: router, abi, functionName: 'getAmountsOut', args: [amountIn, [weth, token]] });
    requireCheck(quote.length === 2 && quote[0] === amountIn && quote[1] > 0n, 'Router returned an invalid swap quote.');
    const remainingGas = callbackGas - callback.extraGas - callback.chargeGas;
    requireCheck(remainingGas > 0n, 'Callback gas limit is below proxy overhead.');
    try {
      await base.call({
        account: proxy, to: vault, gas: remainingGas,
        data: encodeFunctionData({ abi, functionName: 'executeStopLoss', args: [rsc, rsc, percent, threshold] }),
      });
      console.log(`Live RPC swap simulation succeeded: ${formatEther(amountIn)} ETH -> ${quote[1]} raw token units.`);
    } catch (error) {
      const reason = error instanceof Error ? error.message.split('\n')[0] : String(error);
      throw new Error(`Live RPC swap simulation failed: ${reason} Verify Vault compatibility before funding.`);
    }
  }
  return { reserve0, reserve1, token, owner, blockers, threshold };
}

type LasnaReceipt = Omit<TransactionReceipt, 'status'> & { status: Hex } & { refTx?: Hash; refChainId?: Hex; refEventIndex?: Hex };

async function waitFor<T>(description: string, read: () => Promise<T | undefined>): Promise<T> {
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    const result = await read();
    if (result !== undefined) return result;
    await delay(2_000);
  }
  throw new Error(`Timed out waiting for ${description}.`);
}

async function main() {
  const args = process.argv.slice(2);
  const expectSkip = args[0] === '--expect-skipped';
  if (expectSkip) args.shift();
  const replay = args[0] === '--verify-existing';
  requireCheck((!expectSkip && (args.length === 0 || (args.length === 1 && ['--preflight', '--execute', '--execute-skip'].includes(args[0])))) ||
    (replay && (expectSkip ? [3, 4, 5] : [3, 4]).includes(args.length) &&
      args.slice(1).every(hash => /^0x[0-9a-fA-F]{64}$/.test(hash))),
  'Usage: test-full-loop.ts [--preflight | --execute | --execute-skip | [--expect-skipped] --verify-existing ORIGIN LASNA [DESTINATION [REBOUND]]]');
  const executeSkip = args[0] === '--execute-skip';
  const execute = args[0] === '--execute' || executeSkip;
  const isolated = Boolean(process.env.PAIR_ADDRESS && process.env.VAULT_ADDRESS && process.env.RSC_ADDRESS &&
    !isAddressEqual(pair, deployment.contracts.originPair.address) &&
    !isAddressEqual(vault, deployment.contracts.destinationVault.address) &&
    !isAddressEqual(rsc, deployment.contracts.reactiveSmartContract.address));
  if (executeSkip) {
    requireCheck(isolated, 'Set dedicated testbed PAIR_ADDRESS, VAULT_ADDRESS and RSC_ADDRESS before the rebound trial.');
  }
  console.log({ pair, vault, rsc, proxy, mode: execute ? 'live execution' : 'read-only verification' });
  if (replay) {
    const vaultRead = { address: vault, abi } as const;
    const [token, owner] = await Promise.all([
      base.readContract({ ...vaultRead, functionName: 'usdcToken' }),
      base.readContract({ ...vaultRead, functionName: 'owner' }),
    ]);
    await verifyLoop({ token, owner }, args[1] as Hash, 0n, args[2] as Hash, args[3] as Hash | undefined,
      expectSkip, args[4] as Hash | undefined);
    return;
  }
  const setup = await preflight(isolated);
  const key = process.env.TESTER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
  requireCheck(!key || /^0x[0-9a-fA-F]{64}$/.test(key), 'Tester private key has an invalid format.');
  const account = key ? privateKeyToAccount(key as Hex) : undefined;
  const tester = account?.address ?? (process.env.TESTER_ADDRESS ? getAddress(process.env.TESTER_ADDRESS) : undefined);
  if (!tester) {
    console.log('Tester wallet gas was not checked. Set TESTER_ADDRESS to check it without a private key.');
    requireCheck(setup.blockers.length === 0, setup.blockers.join('\n'));
    requireCheck(!execute, 'Configure TESTER_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY locally to execute.');
    return;
  }
  const scale = 10n ** 18n;
  const thresholdReserve1 = setup.threshold * setup.reserve0 / scale;
  const lowReserve1 = (executeSkip || (isolated && setup.reserve1 > thresholdReserve1))
    ? thresholdReserve1 : setup.reserve1;
  const highReserve1 = executeSkip ? ((setup.threshold + 1n) * setup.reserve0 + scale - 1n) / scale : lowReserve1;
  requireCheck(lowReserve1 > 0n && highReserve1 < 2n ** 112n && (!executeSkip || highReserve1 > lowReserve1),
    'Trial reserves exceed the test pair limits or cannot represent both prices.');
  const trigger = { account: tester, address: pair, abi, functionName: 'setReserves', args: [setup.reserve0, lowReserve1] } as const;
  const rebound = { ...trigger, args: [setup.reserve0, highReserve1] } as const;
  const [gas, reboundGas, fees, walletBalance] = await Promise.all([
    base.estimateContractGas(trigger), executeSkip ? base.estimateContractGas(rebound) : 0n,
    base.estimateFeesPerGas(), base.getBalance({ address: tester }),
  ]);
  const gasLimit = (gas * 120n + 99n) / 100n;
  const reboundGasLimit = (reboundGas * 120n + 99n) / 100n;
  const l1Fees = await Promise.all([
    estimateL1Fee(base, { account: tester, to: pair, gas: gasLimit, ...fees, data: encodeFunctionData(trigger) }),
    executeSkip ? estimateL1Fee(base, { account: tester, to: pair, gas: reboundGasLimit, ...fees, data: encodeFunctionData(rebound) }) : 0n,
  ]);
  const feeBudget = (gasLimit + reboundGasLimit) * fees.maxFeePerGas + (l1Fees.reduce((sum, fee) => sum + fee, 0n) * 120n + 99n) / 100n;
  console.log(`Tester ${tester}: ${formatEther(walletBalance)} ETH; estimated gas budget including L1 data: ${formatEther(feeBudget)} ETH.`);
  if (walletBalance < feeBudget) setup.blockers.push(
    `Base Sepolia faucet: fund ${tester} with at least ${formatEther(feeBudget - walletBalance)} ETH at the current quote.`,
  );
  requireCheck(setup.blockers.length === 0, setup.blockers.join('\n'));
  if (!execute) return;
  requireCheck(account, 'Configure TESTER_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY locally to execute.');

  const wallet = createWalletClient({
    account, chain: baseSepolia,
    transport: http(process.env.BASE_SEPOLIA_RPC_URL || 'https://base-sepolia-rpc.publicnode.com'),
  });
  const lasnaCursor = await reactive.getBlockNumber();
  const nonce = await base.getTransactionCount({ address: account.address, blockTag: 'pending' });
  const originHash = await wallet.writeContract({ ...trigger, account, gas: gasLimit, nonce, ...fees });
  console.log(`Origin submitted: ${originHash}`);
  let reboundHash: Hash | undefined;
  if (executeSkip) {
    reboundHash = await wallet.writeContract({ ...rebound, account, gas: reboundGasLimit, nonce: nonce + 1, ...fees });
    console.log(`Rebound submitted: ${reboundHash}`);
  }
  await verifyLoop({ ...setup, reserve1: lowReserve1 }, originHash, lasnaCursor, undefined, undefined, executeSkip, reboundHash);
}

async function verifyLoop(
  setup: { token: Address; owner: Address; reserve0?: bigint; reserve1?: bigint }, originHash: Hash, lasnaCursor: bigint,
  knownReaction?: Hash, knownDestination?: Hash, expectSkip = false, reboundHash?: Hash,
) {
  console.log(`Origin: https://sepolia.basescan.org/tx/${originHash}`);
  const origin = await base.waitForTransactionReceipt({ hash: originHash, timeout: 180_000, checkReplacement: false });
  const syncs = parseEventLogs({ abi, eventName: 'Sync', logs: origin.logs.filter(log => isAddressEqual(log.address, pair)) });
  requireCheck(origin.status === 'success' && syncs.length === 1, 'Origin receipt must contain exactly one Sync from the test pair.');
  const [sync] = syncs;
  if (!knownReaction) {
    requireCheck(sync.args.reserve0 === setup.reserve0 && sync.args.reserve1 === setup.reserve1,
      'Origin receipt reserves do not match the submitted trigger.');
  }

  async function readReaction(hash: Hash) {
    const receipt = await reactive.request({ method: 'eth_getTransactionReceipt', params: [hash] }) as LasnaReceipt | null;
    if (!receipt || receipt.refTx?.toLowerCase() !== originHash.toLowerCase() ||
        !receipt.refChainId || BigInt(receipt.refChainId) !== BigInt(baseSepolia.id) ||
        !receipt.refEventIndex || BigInt(receipt.refEventIndex) !== BigInt(sync.logIndex)) return;
    const callbacks = parseEventLogs({ abi, eventName: ['Callback', 'OmniCallbackRequested'],
      logs: receipt.logs.filter(log => isAddressEqual(log.address, rsc)) });
    const callback = callbacks.find(log => log.args.chain_id === BigInt(baseSepolia.id) &&
      isAddressEqual(log.args._contract, vault));
    if (!callback) return;
    requireCheck(receipt.status === '0x1', 'Lasna execution reverted.');
    const decoded = decodeFunctionData({ abi, data: callback.args.payload });
    requireCheck(decoded.functionName === 'executeStopLoss' && isAddressEqual(decoded.args[1], rsc) &&
      callback.args.gas_limit === callbackGas, 'Lasna requested an unexpected callback payload.');
    if (callback.eventName === 'OmniCallbackRequested') {
      const requests = parseEventLogs({ abi, eventName: 'CallbackRequest',
        logs: receipt.logs.filter(log => isAddressEqual(log.address, system)) });
      const matching = requests.filter(({ args }) => {
        if (args.version !== 0 || args.chainId !== BigInt(baseSepolia.id) ||
            !isAddressEqual(args.sender, rsc) || !isAddressEqual(args.recipient, vault)) return false;
        const [config] = decodeAbiParameters(callbackConfiguration, args.configuration);
        return config.chainId === BigInt(baseSepolia.id) && isAddressEqual(config.recipient, vault) &&
          config.gasLimit === callbackGas && config.payload === callback.args.payload;
      });
      requireCheck(matching.length === 1, 'Missing a unique Lasna system callback request matching the RSC payload.');
    }
    return { hash, callback, blockNumber: Number(receipt.blockNumber) };
  }

  const reaction = knownReaction ? await readReaction(knownReaction) :
    await waitFor('a Lasna receipt referencing the exact origin log', async () => {
      const head = await reactive.getBlockNumber({ cacheTime: 0 });
      while (lasnaCursor <= head) {
        const block = await reactive.getBlock({ blockNumber: lasnaCursor });
        for (const hash of block.transactions) {
          const match = await readReaction(hash);
          if (match) return match;
        }
        lasnaCursor++;
      }
    });
  requireCheck(reaction, 'Lasna receipt does not reference the exact origin log.');
  console.log(`Reactive: https://lasna.reactscan.net/tx/${reaction.hash}`);

  const requestedPayload = reaction.callback.args.payload;
  const requestedCall = decodeFunctionData({ abi, data: requestedPayload });
  requireCheck(requestedCall.functionName === 'executeStopLoss', 'Unexpected stop-loss selector.');
  const [, , , threshold] = requestedCall.args;
  async function matchingDelivery(hash: Hash) {
    const tx = await base.getTransaction({ hash });
    if (!tx.to || !isAddressEqual(tx.to, proxy)) return false;
    const decoded = decodeFunctionData({ abi, data: tx.input });
    if (decoded.functionName === 'deliverCallback') {
      if (decoded.args[0] !== 0) return false;
      const [config] = decodeAbiParameters(callbackConfiguration, decoded.args[1]);
      return config.chainId === BigInt(baseSepolia.id) && config.gasLimit === callbackGas &&
        isAddressEqual(config.recipient, vault) &&
        config.payload === `${requestedPayload.slice(0, 10)}${rsc.slice(2).toLowerCase().padStart(64, '0')}${requestedPayload.slice(74)}`;
    }
    const delivered = decoded.functionName === 'callbackRnk' ? decoded.args.slice(1) :
      decoded.functionName === 'callback' ? decoded.args : undefined;
    return delivered && typeof delivered[0] === 'string' && typeof delivered[1] === 'string' &&
      isAddressEqual(delivered[0] as Address, vault) &&
      delivered[1].slice(0, 10) === requestedPayload.slice(0, 10) &&
      delivered[1].slice(74) === requestedPayload.slice(74);
  }

  let correlation: 'system' | 'receipt-window' = 'system';
  const callbackHash = await waitFor('the matching Base Sepolia callback', async () => {
    const records = await reactive.readContract({
      address: system, abi, functionName: 'getCallbacks', args: [BigInt(reaction.hash)],
    });
    const candidates = (records as readonly { requester: Address; chainId: bigint; txHash: bigint; err: Hex }[]).filter(record => record.chainId === BigInt(baseSepolia.id) &&
      isAddressEqual(record.requester, rsc) && (record.txHash !== 0n || record.err !== '0x'));
    requireCheck(candidates.length <= 1, 'Multiple Lasna delivery records match this request.');
    if (candidates.length === 1) {
      const [record] = candidates;
      requireCheck(record.err === '0x', `Callback delivery error recorded on Lasna: ${record.err}`);
      const hash = numberToHex(record.txHash, { size: 32 });
      requireCheck(!knownDestination || knownDestination.toLowerCase() === hash, 'Delivery record points to another transaction.');
      return hash;
    }

    if (!knownReaction || reaction.callback.eventName !== 'OmniCallbackRequested') return;
    const [reactionBlock, finalized, cooldown] = await Promise.all([
      reactive.getBlock({ blockNumber: BigInt(reaction.blockNumber) }), base.getBlock({ blockTag: 'finalized' }),
      reactive.readContract({ address: rsc, abi, functionName: 'cooldownSeconds' }),
    ]);
    const payload = `${requestedPayload.slice(0, 10)}${rsc.slice(2).toLowerCase().padStart(64, '0')}${requestedPayload.slice(74)}` as Hex;
    const fallback = await findStopLossDelivery(base, {
      vault, proxy, payload, gasLimit: callbackGas, cooldown, originBlock: origin.blockNumber,
      reactionTimestamp: reactionBlock.timestamp, finalizedBlock: finalized.number,
    });
    requireCheck(fallback.status === 'found',
      'No indexed callback or unique finalized proxy delivery is available. Retry after Base finality if the run is recent.');
    requireCheck(!knownDestination || knownDestination.toLowerCase() === fallback.hash, 'The verified window points to another transaction.');
    correlation = 'receipt-window';
    return fallback.hash;
  });
  requireCheck(await matchingDelivery(callbackHash), 'Proxy calldata does not match the Lasna callback.');
  console.log(`Destination: https://sepolia.basescan.org/tx/${callbackHash}`);
  const destination = await base.waitForTransactionReceipt({ hash: callbackHash, timeout: 180_000, checkReplacement: false });
  const after = (left: TransactionReceipt, right: TransactionReceipt) => left.blockNumber > right.blockNumber ||
    (left.blockNumber === right.blockNumber && left.transactionIndex > right.transactionIndex);
  requireCheck(destination.status === 'success' && destination.to && isAddressEqual(destination.to, proxy) &&
    after(destination, origin), 'Destination receipt did not succeed through the configured proxy.');
  if (reboundHash) {
    const rebound = await base.getTransactionReceipt({ hash: reboundHash });
    requireCheck(rebound.status === 'success' && after(rebound, origin) && after(destination, rebound),
      'The rebound transaction did not settle between the origin Sync and Vault delivery.');
    const rises = parseEventLogs({ abi, eventName: 'Sync', logs: rebound.logs.filter(log => isAddressEqual(log.address, pair)) });
    requireCheck(rises.length === 1 && rises[0].args.reserve0 > 0n &&
      rises[0].args.reserve1 * 10n ** 18n / rises[0].args.reserve0 > threshold,
    'The rebound receipt does not prove that the test pool price moved above the threshold.');
  }
  const failures = parseEventLogs({ abi, eventName: 'CallbackFailure',
    logs: destination.logs.filter(log => isAddressEqual(log.address, proxy)) });
  requireCheck(!failures.some(log => isAddressEqual(log.args.target, vault)), 'Callback Proxy emitted CallbackFailure.');
  const vaultLogs = destination.logs.filter(log => isAddressEqual(log.address, vault));
  const skips = parseEventLogs({ abi, eventName: 'OrderSkipped', logs: vaultLogs });
  const executions = parseEventLogs({ abi, eventName: 'StopLossExecuted', logs: vaultLogs });
  const payouts = parseEventLogs({ abi, eventName: 'Transfer',
    logs: destination.logs.filter(log => isAddressEqual(log.address, setup.token)) });
  let outcome: { event: string; [key: string]: string };
  if (expectSkip) {
    const [skip] = skips;
    requireCheck(skips.length === 1 && executions.length === 0 &&
      skip.args.reason === 'Price bounced back above stop threshold' && skip.args.currentPrice > threshold,
      'Destination receipt does not prove that the Vault skipped because the price rebounded.');
    requireCheck(sync.args.reserve0 > 0n && sync.args.reserve1 * 10n ** 18n / sync.args.reserve0 <= threshold,
      'The origin Sync did not meet the callback price threshold.');
    requireCheck(!payouts.some(log => isAddressEqual(log.args.to, setup.owner) || isAddressEqual(log.args.from, vault)),
      'A quote-token transfer involving the Vault or owner appeared in the skipped callback receipt.');
    outcome = {
      event: 'OrderSkipped',
      reason: skip.args.reason,
      currentPrice: skip.args.currentPrice.toString(),
      threshold: threshold.toString(),
    };
  } else {
    requireCheck(skips.length === 0, `Vault skipped the order: ${skips[0]?.args.reason}`);
    const [execution] = executions;
    requireCheck(executions.length === 1 && execution.args.ethAmountIn > 0n && execution.args.minUsdcOut > 0n,
      'Destination receipt lacks a unique valid StopLossExecuted event.');
    const payout = payouts.find(log => isAddressEqual(log.args.to, setup.owner) && log.args.value >= execution.args.minUsdcOut);
    requireCheck(payout, 'Destination receipt lacks a token transfer to the Vault owner meeting minUsdcOut.');
    outcome = {
      event: 'StopLossExecuted',
      ethAmountIn: execution.args.ethAmountIn.toString(),
      minUsdcOut: execution.args.minUsdcOut.toString(),
      tokenAmountOut: payout.args.value.toString(),
    };
  }

  const [originBlock, destinationBlock] = await Promise.all([
    base.getBlock({ blockNumber: origin.blockNumber }),
    base.getBlock({ blockNumber: destination.blockNumber }),
  ]);
  const deliverySeconds = destinationBlock.timestamp - originBlock.timestamp;
  requireCheck(deliverySeconds >= 0n && deliverySeconds < 180n,
    'Destination timestamp is outside the full-loop verification window.');
  const evidence = {
    project: 'OmniFlow',
    track: 'Set It and Forget It',
    testExecutionTimestamp: new Date(Number(destinationBlock.timestamp) * 1000).toISOString(),
    lastVerifiedAt: new Date().toISOString(),
    originToDestinationSeconds: Number(deliverySeconds),
    status: 'VERIFIED_FULL_LOOP_ON_TESTNET',
    scenario: expectSkip
      ? 'Stop-loss skipped on public testnets after the price rebounded above the threshold.'
      : 'Stop-loss executed on public testnets using a deployed test pool and a test token.',
    ...(reboundHash ? { reboundTxHash: reboundHash } : {}),
    verifiableTransactions: {
      step1_originEvent: {
        chainId: baseSepolia.id, contract: pair, event: 'Sync', blockNumber: Number(origin.blockNumber),
        logIndex: sync.logIndex, txHash: originHash, explorerUrl: `https://sepolia.basescan.org/tx/${originHash}`,
      },
      step2_reactiveExecution: {
        chainId: lasna.id, contract: rsc, event: reaction.callback.eventName, refTx: originHash,
        blockNumber: reaction.blockNumber,
        txHash: reaction.hash, explorerUrl: `https://lasna.reactscan.net/tx/${reaction.hash}`,
      },
      step3_callbackExecution: {
        chainId: baseSepolia.id, contract: vault, proxy, correlation, ...outcome,
        status: destination.status, blockNumber: Number(destination.blockNumber), txHash: callbackHash,
        token: setup.token, recipient: setup.owner,
        explorerUrl: `https://sepolia.basescan.org/tx/${callbackHash}`,
      },
    },
  };
  const output = resolve(process.env.FULL_LOOP_EVIDENCE_DIR ?? resolve(__dirname, '..'), `FULL_LOOP_EVIDENCE.${originHash}.json`);
  writeFileSync(output, JSON.stringify(evidence, null, 2) + '\n', { flag: 'wx' });
  console.log(`Verified evidence: ${output}`);
}

main().catch(error => {
  // Log the concise reason only. RPC errors may embed credential-bearing endpoint URLs.
  const reason = error.shortMessage ?? error.message ?? String(error);
  console.error(String(reason).replace(/https?:\/\/\S+/g, '[RPC URL]'));
  process.exitCode = 1;
});
