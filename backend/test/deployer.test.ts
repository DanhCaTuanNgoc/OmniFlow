import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chainService } from '../src/services/chain.service.js';
import { deployerService } from '../src/services/deployer.service.js';
import type { PipelineGraph } from '../src/schemas/pipeline.schema.js';
import { STOP_LOSS_PIPELINE_BYTECODE } from '../src/abis/StopLossPipeline.js';
import { STOP_LOSS_PIPELINE_ABI, stopLossConstructorArgs, resolvePhaseTwo } from '@omniflow/shared';
import { PipelineGraphSchema } from '../src/schemas/pipeline.schema.js';
import { decodeAbiParameters, encodeDeployData, parseEther } from 'viem';

describe('DeployerService & DAG Compiler Suite', () => {
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

  it('uses identical parameters for the preview and encoded constructor', () => {
    const graph = structuredClone(sampleValidGraph);
    graph.nodes[0].data.chainId = 84532;
    graph.nodes[1].data.thresholdPriceUSD = '1850.125';
    graph.nodes[2].data.cooldownSeconds = 0;
    const parameters = deployerService.extractParams(PipelineGraphSchema.parse({
      ...graph,
      edges: graph.edges.map(edge => ({ ...edge, sourceHandle: null, targetHandle: null })),
    }));
    const args = stopLossConstructorArgs(parameters);
    const constructor = STOP_LOSS_PIPELINE_ABI.find(entry => entry.type === 'constructor');
    const payload = encodeDeployData({ abi: STOP_LOSS_PIPELINE_ABI, bytecode: STOP_LOSS_PIPELINE_BYTECODE, args });
    const decoded = decodeAbiParameters(constructor.inputs, `0x${payload.slice(STOP_LOSS_PIPELINE_BYTECODE.length)}`);
    assert.deepEqual(decoded.map(value => typeof value === 'string' ? value.toLowerCase() : value), args);
    assert.equal(parameters.priceThresholdWei, parseEther('1850.125'));
    assert.equal(parameters.cooldownSeconds, 0n);
    assert.equal(parameters.velocityThresholdBps, 0n);
    assert.ok(STOP_LOSS_PIPELINE_ABI.some(entry => entry.type === 'event' && entry.name === 'OmniCallbackRequested'));
  });

  it('compiles Take-Profit into the versioned price-order configuration', () => {
    const graph = structuredClone(sampleValidGraph);
    graph.nodes[1].data.operator = 'GREATER_THAN_OR_EQUAL';
    graph.nodes[1].data.thresholdPriceUSD = '2800';
    graph.nodes[1].data.confirmationHits = 1;
    graph.nodes[2].data.cooldownSeconds = 0;
    graph.nodes[3].data.maxSlippagePercent = 5;
    graph.nodes[3].data.executionPolicy = 'REPEAT';
    const resolved = resolvePhaseTwo(graph);
    assert.equal(resolved.type, 'price-order');
    if (resolved.type !== 'price-order') throw new Error('Expected a price-order template.');
    assert.equal(resolved.config.mode, 1);
    assert.equal(resolved.config.threshold, 2800n * 10n ** 18n);
    assert.equal(resolved.config.originChainId, 84532n);
  });

  const rejectedGraphs: {
    scenario: string;
    edit: (graph: PipelineGraph) => void;
    error: RegExp;
  }[] = [
    {
      scenario: 'a second financial action',
      edit: graph => {
        graph.nodes.push({ ...graph.nodes[3], id: 'extra-swap' });
        graph.edges.push({ id: 'extra-edge', source: 'node-cooldown', target: 'extra-swap' });
      },
      error: /one DEX swap/,
    },
    { scenario: 'a wrong port', edit: graph => { graph.edges[1].targetHandle = 'A'; }, error: /default ports/ },
    {
      scenario: 'an acyclic but incorrectly ordered graph',
      edit: graph => {
        graph.edges[0].target = 'node-cooldown';
        graph.edges[1].source = 'node-cooldown';
        graph.edges[1].target = 'node-price-guard';
        graph.edges[2].source = 'node-price-guard';
      },
      error: /in order/,
    },
    { scenario: 'conflicting legacy chain fields', edit: graph => { graph.nodes[0].data.chainId = 1301; }, error: /chain fields disagree/ },
    {
      scenario: 'an Unichain graph',
      edit: graph => {
        graph.nodes[0].data.originChainId = 1301;
        graph.networks.originChainId = 1301;
      },
      error: /only Base Sepolia/,
    },
    {
      scenario: 'a take-profit threshold',
      edit: graph => { graph.nodes[1].data.operator = 'GREATER_THAN_OR_EQUAL'; },
      error: /less-than-or-equal/,
    },
    { scenario: 'an invalid cooldown', edit: graph => { graph.nodes[2].data.cooldownSeconds = -1; }, error: /cooldown must/ },
    { scenario: 'an invalid amount', edit: graph => { graph.nodes[3].data.amountPercentage = 0; }, error: /swap percentage/ },
    { scenario: 'a legacy 1% slippage draft', edit: graph => { graph.nodes[3].data.maxSlippagePercent = 1; }, error: /fixed 5%/ },
  ];

  for (const { scenario, edit, error } of rejectedGraphs) {
    it(`rejects ${scenario} before deployment`, async () => {
      const graph = structuredClone(sampleValidGraph);
      edit(graph);
      await assert.rejects(deployerService.deployPipeline(graph), error);
    });
  }

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

