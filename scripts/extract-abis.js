const fs = require('fs');
const path = require('path');
const { createHash } = require('node:crypto');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const check = process.argv.includes('--check');

const vaultArtifact = JSON.parse(read('contracts/out/ActionVault.sol/ActionVault.json'));
const pipelineArtifact = JSON.parse(read('contracts/out/StopLoss_Pipeline.sol/StopLoss_Pipeline.json'));
const phaseTwoContracts = [
  ['PriceOrderVault', 'PRICE_ORDER_VAULT'],
  ['PriceOrderPipeline', 'PRICE_ORDER_PIPELINE'],
  ['PriceGatePipeline', 'PRICE_GATE_PIPELINE'],
];

function runtimeFingerprint({ deployedBytecode }) {
  const bytes = Buffer.from(deployedBytecode.object.slice(2), 'hex');
  const size = bytes.length - bytes.readUInt16BE(bytes.length - 2) - 2;
  const immutables = Object.values(deployedBytecode.immutableReferences).flat()
    .sort((left, right) => left.start - right.start);
  for (const { start, length } of immutables) bytes.fill(0, start, start + length);
  return { size, immutables, sha256: createHash('sha256').update(bytes.subarray(0, size)).digest('hex') };
}

const actionVaultContent = `export const ACTION_VAULT_ABI = ${JSON.stringify(vaultArtifact.abi, null, 2)} as const;\n\nexport const ACTION_VAULT_BYTECODE = '${vaultArtifact.bytecode.object}' as const;\n`;
const pipelineContent = `export const STOP_LOSS_PIPELINE_ABI = ${JSON.stringify(pipelineArtifact.abi, null, 2)} as const;\n\nexport const STOP_LOSS_PIPELINE_BYTECODE = '${pipelineArtifact.bytecode.object}' as const;\n`;

const source = read('contracts/src/StopLoss_Pipeline.sol').replace(/\r\n/g, '\n');
const files = {
  'packages/shared/src/abis/ActionVault.ts': actionVaultContent,
  'backend/src/abis/ActionVault.ts': actionVaultContent,
  'packages/shared/src/abis/StopLossPipeline.ts': pipelineContent,
  'backend/src/abis/StopLossPipeline.ts': pipelineContent,
  'backend/src/abis/runtimeFingerprints.ts': [
    `export const VAULT_RUNTIME = ${JSON.stringify(runtimeFingerprint(vaultArtifact), null, 2)};`,
    `export const STOP_LOSS_RUNTIME = ${JSON.stringify(runtimeFingerprint(pipelineArtifact), null, 2)};`,
    '',
  ].join('\n'),
  'packages/shared/src/abis/StopLossPipelineSource.ts':
    `export const STOP_LOSS_PIPELINE_SOURCE = ${JSON.stringify(source)};\n`,
};

for (const [contract, symbol] of phaseTwoContracts) {
  const artifact = JSON.parse(read(`contracts/out/${contract}.sol/${contract}.json`));
  const source = read(`contracts/src/${contract}.sol`).replace(/\r\n/g, '\n');
  files[`packages/shared/src/abis/${contract}.ts`] = [
    `export const ${symbol}_ABI = ${JSON.stringify(artifact.abi, null, 2)} as const;`,
    `export const ${symbol}_BYTECODE = '${artifact.bytecode.object}' as const;`,
    `export const ${symbol}_SOURCE = ${JSON.stringify(source)};`,
    '',
  ].join('\n\n');
}

for (const [file, content] of Object.entries(files)) {
  if (check) {
    if (read(file).replace(/\r\n/g, '\n') !== content) throw new Error(`Stale generated artifact: ${file}`);
  } else {
    fs.writeFileSync(path.join(root, file), content);
  }
}

console.log(check ? 'Solidity artifacts match generated files.' : 'Generated Solidity ABI, bytecode and preview source.');
