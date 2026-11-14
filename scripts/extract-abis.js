const fs = require('fs');

const vaultArtifact = JSON.parse(fs.readFileSync('contracts/out/ActionVault.sol/ActionVault.json', 'utf8'));
const pipelineArtifact = JSON.parse(fs.readFileSync('contracts/out/StopLoss_Pipeline.sol/StopLoss_Pipeline.json', 'utf8'));

fs.mkdirSync('packages/shared/src/abis', { recursive: true });

fs.writeFileSync(
  'packages/shared/src/abis/ActionVault.ts',
  `export const ACTION_VAULT_ABI = ${JSON.stringify(vaultArtifact.abi, null, 2)} as const;\n\nexport const ACTION_VAULT_BYTECODE = '${vaultArtifact.bytecode.object}' as const;\n`
);

fs.writeFileSync(
  'packages/shared/src/abis/StopLossPipeline.ts',
  `export const STOP_LOSS_PIPELINE_ABI = ${JSON.stringify(pipelineArtifact.abi, null, 2)} as const;\n\nexport const STOP_LOSS_PIPELINE_BYTECODE = '${pipelineArtifact.bytecode.object}' as const;\n`
);

console.log('EXTRACTED_ABIS_AND_BYTECODE_SUCCESSFULLY');
