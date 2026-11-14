export const STOP_LOSS_PIPELINE_ABI = [
  {
    type: 'constructor',
    inputs: [
      { name: '_pairAddress', type: 'address' },
      { name: '_priceThreshold', type: 'uint256' },
      { name: '_cooldownSeconds', type: 'uint256' },
      { name: '_percentToSwap', type: 'uint256' },
      { name: '_actionVault', type: 'address' },
    ],
    stateMutability: 'payable',
  },
  {
    name: 'react',
    type: 'function',
    inputs: [
      {
        name: 'log',
        type: 'tuple',
        components: [
          { name: '_chain_id', type: 'uint256' },
          { name: '_contract', type: 'address' },
          { name: '_topic_0', type: 'uint256' },
          { name: '_topic_1', type: 'uint256' },
          { name: '_topic_2', type: 'uint256' },
          { name: '_topic_3', type: 'uint256' },
          { name: 'data', type: 'bytes' },
          { name: '_block_number', type: 'uint256' },
          { name: '_op_code', type: 'uint256' },
          { name: '_block_hash', type: 'uint256' },
          { name: '_tx_hash', type: 'uint256' },
          { name: '_log_index', type: 'uint256' },
        ],
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'lastTriggeredTimestamp',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'ConditionTriggered',
    type: 'event',
    inputs: [
      { name: 'currentPrice', type: 'uint256', indexed: false },
      { name: 'blockTime', type: 'uint256', indexed: false },
    ],
  },
] as const;

/**
 * Bytecode giả lập / stub cho môi trường test khi chưa chạy forge build
 */
export const STOP_LOSS_PIPELINE_BYTECODE = '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe' as `0x${string}`;
