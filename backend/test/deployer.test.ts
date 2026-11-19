import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chainService } from '../src/services/chain.service.js';
import { deployerService } from '../src/services/deployer.service.js';
import type { PipelineGraph } from '../src/schemas/pipeline.schema.js';
import { STOP_LOSS_PIPELINE_BYTECODE } from '../src/abis/StopLossPipeline.js';

describe('DeployerService & DAG Compiler Suite (10 Test Cases)', () => {
  const sampleValidGraph: PipelineGraph = {
    pipelineVersion: '1.0.0',
    metadata: {
      name: 'Base Sepolia Stop-Loss Vault Sweeper',
      ownerAddress: '0x1111111111111111111111111111111111111111',
    },
    networks: {
      originChainId: 84532,
      reactiveChainId: 5318007,
      destinationChainId: 84532,
    },
    nodes: [
      {
        id: 'node-trigger',
        type: 'watchDEXPrice',
        position: { x: 100, y: 100 },
        data: {
          label: 'Uniswap V2 Pair',
          pairAddress: '0x9a796b794999cabcd10d08f777b24ceb76e34b3e',
          originChainId: 84532,
        },
      },
      {
        id: 'node-price-guard',
        type: 'priceThresholdGuard',
        position: { x: 350, y: 100 },
        data: {
          label: 'Threshold Guard',
          thresholdPriceUSD: 1850,
          confirmationHits: 2,
        },
      },
      {
        id: 'node-cooldown',
        type: 'cooldownGuard',
        position: { x: 600, y: 100 },
        data: {
          label: '200ms Cooldown',
          cooldownSeconds: 120,
        },
      },
      {
        id: 'node-action',
        type: 'dexSwap',
        position: { x: 850, y: 100 },
        data: {
          label: 'Action Vault Execution',
          actionVaultAddress: '0x005d4cb896c9e0B07Bbf961FDC26b098D84079d7',
          amountPercentage: 75,
        },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'node-trigger', target: 'node-price-guard' },
      { id: 'e2-3', source: 'node-price-guard', target: 'node-cooldown' },
      { id: 'e3-4', source: 'node-cooldown', target: 'node-action' },
    ],
  };

  // DEP-01
  it('DEP-01: test_ExtractParams_ValidDAG - Trích xuất chính xác toàn bộ tham số từ DAG hợp lệ', () => {
    const params = deployerService.extractParams(sampleValidGraph);
    assert.equal(params.pairAddress.toLowerCase(), '0x9a796b794999cabcd10d08f777b24ceb76e34b3e'.toLowerCase());
    assert.equal(params.priceThresholdWei, 1850n * 10n ** 18n);
    assert.equal(params.cooldownSeconds, 120n);
    assert.equal(params.percentToSwap, 75n);
    assert.equal(params.actionVaultAddress.toLowerCase(), '0x005d4cb896c9e0B07Bbf961FDC26b098D84079d7'.toLowerCase());
    assert.equal(params.requiredHits, 2n);
    assert.equal(params.originChainId, 84532n);
  });

  // DEP-02
  it('DEP-02: test_Reject_CyclicGraph - Phát hiện và từ chối đồ thị có chu trình lặp (Cyclic Graph)', () => {
    const cyclicGraph: PipelineGraph = {
      ...sampleValidGraph,
      edges: [
        { id: 'e1-2', source: 'node-trigger', target: 'node-price-guard' },
        { id: 'e2-3', source: 'node-price-guard', target: 'node-action' },
        { id: 'e3-cycle', source: 'node-action', target: 'node-trigger' }, // Vòng lặp!
      ],
    };
    const validation = deployerService.validateDAG(cyclicGraph);
    assert.equal(validation.valid, false);
    assert.ok(validation.errors.some((e) => e.includes('Cycle detected')));
  });

  // DEP-03
  it('DEP-03: test_Reject_MissingTriggerNode - Từ chối đồ thị thiếu Node Trigger đầu vào', () => {
    const noTriggerGraph: PipelineGraph = {
      ...sampleValidGraph,
      nodes: sampleValidGraph.nodes.filter((n) => n.id !== 'node-trigger'),
      edges: [{ id: 'e2-3', source: 'node-price-guard', target: 'node-action' }],
    };
    const validation = deployerService.validateDAG(noTriggerGraph);
    assert.equal(validation.valid, false);
    assert.ok(validation.errors.some((e) => e.includes('Missing required Trigger node')));
  });

  // DEP-04
  it('DEP-04: test_Reject_MissingActionNode - Từ chối đồ thị thiếu Node Action đầu ra', () => {
    const noActionGraph: PipelineGraph = {
      ...sampleValidGraph,
      nodes: sampleValidGraph.nodes.filter((n) => n.id !== 'node-action'),
      edges: [{ id: 'e1-2', source: 'node-trigger', target: 'node-price-guard' }],
    };
    const validation = deployerService.validateDAG(noActionGraph);
    assert.equal(validation.valid, false);
    assert.ok(validation.errors.some((e) => e.includes('Missing required Action node')));
  });

  // DEP-05
  it('DEP-05: test_Reject_DisjointComponents - Phát hiện và từ chối các node rời rạc, không nối dây', () => {
    const disjointGraph: PipelineGraph = {
      ...sampleValidGraph,
      nodes: [
        ...sampleValidGraph.nodes,
        {
          id: 'node-orphan',
          type: 'balanceThreshold',
          position: { x: 500, y: 500 },
          data: { label: 'Orphan Node' },
        },
      ],
    };
    const validation = deployerService.validateDAG(disjointGraph);
    assert.equal(validation.valid, false);
    assert.ok(validation.errors.some((e) => e.includes('Disconnected node detected')));
  });

  // DEP-06
  it('DEP-06: test_EncodeConstructorBytecode - Pre-compiled Bytecode hợp lệ và không rỗng', () => {
    assert.ok(STOP_LOSS_PIPELINE_BYTECODE.length > 100);
    assert.ok(STOP_LOSS_PIPELINE_BYTECODE.startsWith('0x'));
  });

  it('rejects deployment with a missing origin pool address', async () => {
    const graph = structuredClone(sampleValidGraph);
    delete graph.nodes.find(node => node.type === 'watchDEXPrice')!.data.pairAddress;
    await assert.rejects(deployerService.deployPipeline(graph), /configure a valid origin pool address/);
  });

  it('rejects deployment with a missing Vault address', async () => {
    const graph = structuredClone(sampleValidGraph);
    delete graph.nodes.find(node => node.type === 'dexSwap')!.data.actionVaultAddress;
    await assert.rejects(deployerService.deployPipeline(graph), /configure a valid ActionVault address/);
  });

  // DEP-09
  it('DEP-09: test_Deploy_Timeout_RetryHandling - Chặn triển khai nếu đồ thị sai và ném lỗi rõ ràng', async () => {
    const invalidGraph: PipelineGraph = {
      ...sampleValidGraph,
      nodes: [sampleValidGraph.nodes[0]], // Chỉ có 1 node
      edges: [],
    };
    await assert.rejects(
      async () => {
        await deployerService.deployPipeline(invalidGraph);
      },
      (err: Error) => {
        return err.message.includes('DAG Validation Failed');
      }
    );
  });

  it('fails without a relayer signer instead of returning a fabricated deployment', async (context) => {
    const descriptor = Object.getOwnPropertyDescriptor(chainService, 'lasnaWalletClient');
    Object.defineProperty(chainService, 'lasnaWalletClient', { configurable: true, value: undefined });
    context.after(() => {
      if (descriptor) Object.defineProperty(chainService, 'lasnaWalletClient', descriptor);
      else Reflect.deleteProperty(chainService, 'lasnaWalletClient');
    });
    await assert.rejects(deployerService.deployPipeline(sampleValidGraph), /signer is not configured/);
  });
});
