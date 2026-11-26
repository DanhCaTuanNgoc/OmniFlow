import { Router } from 'express';
import { z } from 'zod';
import type { CopilotDraft } from '@omniflow/shared';
import { env } from '../config/env.js';

const input = z.object({ prompt: z.string().trim().min(1).max(1000) }).strict();
const templates = ['stop-loss', 'take-profit', 'clarify', 'unsupported'] as const;
const output = z.object({
  template: z.enum(templates),
  thresholdUsd: z.string().regex(/^\d{1,8}(?:\.\d{1,6})?$/).refine(value => Number(value) > 0).nullable(),
  sellPercent: z.number().int().min(1).max(100).nullable(),
}).strict();
const responseJsonSchema = {
  type: 'object',
  properties: {
    template: { type: 'string', enum: templates },
    thresholdUsd: { type: ['string', 'null'] },
    sellPercent: { type: ['integer', 'null'] },
  },
  required: ['template', 'thresholdUsd', 'sellPercent'],
};
const geminiResponse = z.object({
  candidates: z.array(z.object({
    finishReason: z.string().optional(),
    content: z.object({
      parts: z.array(z.object({ text: z.string().optional(), thought: z.boolean().optional() })),
    }).optional(),
  })).optional(),
});

export const copilotRouter = Router();
let windowEnd = 0;
let requests = 0;

copilotRouter.post('/generate-graph', async (req, res) => {
  const parsed = input.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Enter a prompt between 1 and 1,000 characters.' });
  if (!env.GEMINI_API_KEY) return res.status(503).json({ error: 'Studio AI is unavailable. The server needs a Gemini API key.' });

  const now = Date.now();
  if (now >= windowEnd) {
    windowEnd = now + 60_000;
    requests = 0;
  }
  if (requests >= 20) {
    res.set('Retry-After', String(Math.ceil((windowEnd - now) / 1000)));
    return res.status(429).json({ error: 'Studio AI is busy. Try again in a minute.' });
  }
  requests++;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        signal: AbortSignal.timeout(20_000),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: [
            'Extract parameters for exactly one ETH stop-loss or take-profit on Base Sepolia.',
            'Stop-loss triggers at or below the given USD price. Take-profit triggers at or above it.',
            'Use clarify if direction or exact USD threshold is missing or ambiguous.',
            'Use unsupported for other assets, chains, multiple orders, or unsupported actions or custom requirements.',
            'Return the explicitly requested price as a positive decimal string with up to 8 integer and 6 fractional digits, or null.',
            'Return the explicitly requested whole percent to sell, or null when omitted. Do not invent values.',
          ].join(' ') }] },
          contents: [{ role: 'user', parts: [{ text: parsed.data.prompt }] }],
          generationConfig: { responseMimeType: 'application/json', responseJsonSchema },
        }),
      },
    );
    if (response.status === 429) return res.status(429).json({ error: 'Gemini quota is temporarily exhausted. Try again later.' });
    if (!response.ok) {
      console.warn('Gemini request failed with HTTP status', response.status);
      return res.status(502).json({ error: 'Gemini could not generate a draft. Try again later.' });
    }
    const result = geminiResponse.parse(await response.json());
    const candidate = result.candidates?.[0];
    const text = candidate?.finishReason === 'STOP'
      ? candidate.content?.parts.find(part => !part.thought && part.text)?.text
      : undefined;
    const draft = output.parse(JSON.parse(text ?? 'null'));
    if (draft.template === 'unsupported') {
      return res.status(422).json({ error: 'Studio AI currently supports one ETH Stop-Loss or Take-Profit on Base Sepolia.' });
    }
    if (draft.template === 'clarify' || draft.thresholdUsd === null) {
      return res.status(422).json({ error: 'Specify Stop-Loss or Take-Profit and enter an exact USD price.' });
    }
    const proposal: CopilotDraft = { template: draft.template, thresholdUsd: draft.thresholdUsd, sellPercent: draft.sellPercent };
    return res.json(proposal);
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return res.status(504).json({ error: 'Gemini took too long. Generate the draft again.' });
    }
    return res.status(502).json({ error: 'Gemini did not return a usable draft. Try again or rephrase your prompt.' });
  }
});
