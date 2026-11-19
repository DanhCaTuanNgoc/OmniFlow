import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { config } from '../backend/node_modules/dotenv';
import {
  createPublicClient, createWalletClient, decodeFunctionData, defineChain, encodeFunctionData,
  formatEther, getAddress, http, isAddressEqual, numberToHex, parseAbi, parseEventLogs,
  toEventSelector, type Address, type Hash, type Hex, type TransactionReceipt,
} from '../backend/node_modules/viem';
import { baseSepolia } from '../backend/node_modules/viem/chains';
import { privateKeyToAccount } from '../backend/node_modules/viem/accounts';
import { estimateL1Fee } from '../backend/node_modules/viem/op-stack';
import deployment from '../FULL_LOOP_EVIDENCE.json';

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
  'function callback(address, bytes)',
  'function callbackRnk(uint64, address, bytes)',
  'function getCallbacks(uint256) view returns ((uint256 blockNumber, address requester, uint256 callbackIndex, uint256 chainId, uint256 txHash, bytes err)[])',
  'event Sync(uint112 reserve0, uint112 reserve1)',
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

async function preflight() {
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
  if (price > threshold || threshold === 0n) blockers.push('Current pair price is above the active stop-loss threshold or the threshold is disabled.');
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
  return { reserve0, reserve1, token, owner, blockers };
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
  requireCheck(args.length === 0 || (args.length === 1 && ['--preflight', '--execute'].includes(args[0])),
    'Usage: test-full-loop.ts [--preflight | --execute]');
  const execute = args[0] === '--execute';
  console.log({ pair, vault, rsc, proxy, mode: execute ? 'live execution' : 'read-only preflight' });
  const setup = await preflight();
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
  const trigger = { account: tester, address: pair, abi, functionName: 'setReserves', args: [setup.reserve0, setup.reserve1] } as const;
  const [gas, fees, walletBalance] = await Promise.all([
    base.estimateContractGas(trigger), base.estimateFeesPerGas(), base.getBalance({ address: tester }),
  ]);
  const gasLimit = (gas * 120n + 99n) / 100n;
  const l1Fee = await estimateL1Fee(base, {
    account: tester, to: pair, gas: gasLimit, ...fees, data: encodeFunctionData(trigger),
  });
  const feeBudget = gasLimit * fees.maxFeePerGas + (l1Fee * 120n + 99n) / 100n;
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
  let lasnaCursor = await reactive.getBlockNumber();
  const originHash = await wallet.writeContract({ ...trigger, account, gas: gasLimit, ...fees });
  console.log(`Origin: https://sepolia.basescan.org/tx/${originHash}`);
  const origin = await base.waitForTransactionReceipt({ hash: originHash, timeout: 180_000, checkReplacement: false });
  const [sync] = parseEventLogs({ abi, eventName: 'Sync', logs: origin.logs.filter(log => isAddressEqual(log.address, pair)) });
  requireCheck(origin.status === 'success' && sync && sync.args.reserve0 === setup.reserve0 &&
    sync.args.reserve1 === setup.reserve1, 'Origin receipt is missing the expected Sync event.');

  const reaction = await waitFor('a Lasna receipt referencing the exact origin log', async () => {
    const head = await reactive.getBlockNumber({ cacheTime: 0 });
    while (lasnaCursor <= head) {
      const block = await reactive.getBlock({ blockNumber: lasnaCursor });
      for (const hash of block.transactions) {
        const receipt = await reactive.request({ method: 'eth_getTransactionReceipt', params: [hash] }) as LasnaReceipt | null;
        if (!receipt || receipt.refTx?.toLowerCase() !== originHash.toLowerCase() ||
            !receipt.refChainId || BigInt(receipt.refChainId) !== BigInt(baseSepolia.id) ||
            !receipt.refEventIndex || BigInt(receipt.refEventIndex) !== BigInt(sync.logIndex)) continue;
        const callbacks = parseEventLogs({ abi, eventName: 'Callback',
          logs: receipt.logs.filter(log => isAddressEqual(log.address, rsc)) });
        const callback = callbacks.find(log => log.args.chain_id === BigInt(baseSepolia.id) &&
          isAddressEqual(log.args._contract, vault));
        if (!callback) continue;
        requireCheck(receipt.status === '0x1', 'Lasna execution reverted.');
        const decoded = decodeFunctionData({ abi, data: callback.args.payload });
        requireCheck(decoded.functionName === 'executeStopLoss' && isAddressEqual(decoded.args[1], rsc) &&
          callback.args.gas_limit === callbackGas, 'Lasna requested an unexpected callback payload.');
        return { hash, callback };
      }
      lasnaCursor++;
    }
  });
  console.log(`Reactive: https://lasna.reactscan.net/tx/${reaction.hash}`);

  const callbackRecord = await waitFor('the Lasna system delivery record', async () => {
    const records = await reactive.readContract({
      address: system, abi, functionName: 'getCallbacks', args: [BigInt(reaction.hash)],
    });
    const candidates = (records as readonly { requester: Address; chainId: bigint; txHash: bigint; err: Hex }[]).filter(record => record.chainId === BigInt(baseSepolia.id) &&
      isAddressEqual(record.requester, rsc));
    requireCheck(candidates.length <= 1, 'Multiple Lasna delivery records match this request.');
    return candidates.find(record => record.txHash !== 0n || record.err !== '0x');
  });
  requireCheck(callbackRecord.err === '0x', `Callback delivery error recorded on Lasna: ${callbackRecord.err}`);
  const callbackHash = numberToHex(callbackRecord.txHash, { size: 32 });
  console.log(`Destination: https://sepolia.basescan.org/tx/${callbackHash}`);
  const destination = await base.waitForTransactionReceipt({ hash: callbackHash, timeout: 180_000, checkReplacement: false });
  requireCheck(destination.status === 'success' && destination.to && isAddressEqual(destination.to, proxy) &&
    destination.blockNumber >= origin.blockNumber, 'Destination receipt did not succeed through the configured proxy.');
  const delivery = await base.getTransaction({ hash: callbackHash });
  const decodedDelivery = decodeFunctionData({ abi, data: delivery.input });
  const delivered = decodedDelivery.functionName === 'callbackRnk' ? decodedDelivery.args.slice(1) :
    decodedDelivery.functionName === 'callback' ? decodedDelivery.args : undefined;
  requireCheck(delivered && typeof delivered[0] === 'string' && typeof delivered[1] === 'string' &&
    isAddressEqual(delivered[0] as Address, vault) && delivered[1].slice(0, 10) === reaction.callback.args.payload.slice(0, 10) &&
    delivered[1].slice(74) === reaction.callback.args.payload.slice(74),
  'Proxy calldata does not match the Lasna callback (excluding the injected first argument).');
  const failures = parseEventLogs({ abi, eventName: 'CallbackFailure',
    logs: destination.logs.filter(log => isAddressEqual(log.address, proxy)) });
  requireCheck(!failures.some(log => isAddressEqual(log.args.target, vault)), 'Callback Proxy emitted CallbackFailure.');
  const vaultLogs = destination.logs.filter(log => isAddressEqual(log.address, vault));
  const [skip] = parseEventLogs({ abi, eventName: 'OrderSkipped', logs: vaultLogs });
  requireCheck(!skip, `Vault skipped the order: ${skip?.args.reason}`);
  const [execution] = parseEventLogs({ abi, eventName: 'StopLossExecuted', logs: vaultLogs });
  requireCheck(execution && execution.args.ethAmountIn > 0n && execution.args.minUsdcOut > 0n,
    'Destination receipt lacks a valid StopLossExecuted event.');
  const payouts = parseEventLogs({ abi, eventName: 'Transfer',
    logs: destination.logs.filter(log => isAddressEqual(log.address, setup.token)) });
  const payout = payouts.find(log => isAddressEqual(log.args.to, setup.owner) && log.args.value >= execution.args.minUsdcOut);
  requireCheck(payout, 'Destination receipt lacks a token transfer to the Vault owner meeting minUsdcOut.');

  const evidence = {
    project: 'OmniFlow',
    track: 'Set It and Forget It',
    testExecutionTimestamp: new Date().toISOString(),
    status: 'VERIFIED_FULL_LOOP_ON_TESTNET',
    scenario: 'Stop-loss using a deployed test pool. The destination token may be a test token.',
    verifiableTransactions: {
      step1_originEvent: {
        chainId: baseSepolia.id, contract: pair, event: 'Sync', blockNumber: Number(origin.blockNumber),
        logIndex: sync.logIndex, txHash: originHash, explorerUrl: `https://sepolia.basescan.org/tx/${originHash}`,
      },
      step2_reactiveExecution: {
        chainId: lasna.id, contract: rsc, event: 'Callback', refTx: originHash,
        txHash: reaction.hash, explorerUrl: `https://lasna.reactscan.net/tx/${reaction.hash}`,
      },
      step3_callbackExecution: {
        chainId: baseSepolia.id, contract: vault, proxy, event: 'StopLossExecuted',
        status: destination.status, blockNumber: Number(destination.blockNumber), txHash: callbackHash,
        token: setup.token, recipient: setup.owner, ethAmountIn: execution.args.ethAmountIn.toString(),
        minUsdcOut: execution.args.minUsdcOut.toString(), tokenAmountOut: payout.args.value.toString(),
        explorerUrl: `https://sepolia.basescan.org/tx/${callbackHash}`,
      },
    },
  };
  const output = resolve(__dirname, `../FULL_LOOP_EVIDENCE.${originHash}.json`);
  writeFileSync(output, JSON.stringify(evidence, null, 2) + '\n', { flag: 'wx' });
  console.log(`Verified evidence: ${output}`);
}

main().catch(error => {
  // Log the concise reason only. RPC errors may embed credential-bearing endpoint URLs.
  const reason = error.shortMessage ?? error.message ?? String(error);
  console.error(String(reason).replace(/https?:\/\/\S+/g, '[RPC URL]'));
  process.exitCode = 1;
});
