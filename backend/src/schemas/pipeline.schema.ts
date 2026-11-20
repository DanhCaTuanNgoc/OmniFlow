import { z } from 'zod';

export const NodePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const NodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: NodePositionSchema,
  data: z.record(z.any()),
});

export const EdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().nullish(),
  targetHandle: z.string().nullish(),
});

export const PipelineMetadataSchema = z.object({
  name: z.string().min(1, 'Pipeline name is required'),
  ownerAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid owner Ethereum address'),
  createdAt: z.number().optional(),
});

export const PipelineGraphSchema = z.object({
  $schema: z.string().optional(),
  pipelineVersion: z.string().default('1.0.0'),
  metadata: PipelineMetadataSchema,
  networks: z.object({
    originChainId: z.number().default(84532),
    reactiveChainId: z.number().default(5318007),
    destinationChainId: z.number().default(84532),
  }),
  nodes: z.array(NodeSchema).min(2, 'Pipeline must contain at least 2 nodes'),
  edges: z.array(EdgeSchema).min(1, 'Pipeline must contain at least 1 edge connection'),
});

export type PipelineGraph = z.infer<typeof PipelineGraphSchema>;
