import { createHash } from 'node:crypto';
import type { Hex } from 'viem';

type RuntimeFingerprint = { size: number; immutables: { start: number; length: number }[]; sha256: string };

export function matchesRuntime(code: Hex | undefined, fingerprint: RuntimeFingerprint) {
  if (!code) return false;
  const bytes = Buffer.from(code.slice(2), 'hex');
  if (bytes.length < fingerprint.size + 2) return false;
  const metadataLength = bytes.readUInt16BE(bytes.length - 2);
  if (bytes.length - metadataLength - 2 !== fingerprint.size) return false;
  for (const { start, length } of fingerprint.immutables) bytes.fill(0, start, start + length);
  return createHash('sha256').update(bytes.subarray(0, fingerprint.size)).digest('hex') === fingerprint.sha256;
}
