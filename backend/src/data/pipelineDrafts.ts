import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { Pool, type PoolClient } from 'pg';
import type { Address } from 'viem';
import { env } from '../config/env.js';
import { deploymentEnvironment, deploymentStore, type Draft } from './deployments.js';

type Revision = { id: string; updatedAt: number };
type DraftRow = Omit<Draft, 'updatedAt'> & { updatedAt: string };
const columns = 'id, owner, name, graph_json AS "graphJson", updated_at AS "updatedAt"';

let pool: Pool | undefined;
export function draftPool() {
  if (!env.DATABASE_URL) return undefined;
  if (!pool) {
    const url = new URL(env.DATABASE_URL);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    const useTls = !loopback || url.searchParams.get('sslmode') !== 'disable';
    // Keep URL SSL options from overriding the verified TLS configuration.
    for (const key of ['ssl', 'sslmode', 'sslrootcert', 'sslcert', 'sslkey']) url.searchParams.delete(key);
    const ca = useTls && existsSync(env.DATABASE_CA_PATH) ? readFileSync(env.DATABASE_CA_PATH, 'utf8') : undefined;
    pool = new Pool({
      connectionString: url.href,
      ssl: useTls ? { ca, rejectUnauthorized: true } : false,
      connectionTimeoutMillis: 5000,
      statement_timeout: 5000,
    });
    pool.on('error', () => console.error('Workspace PostgreSQL idle connection failed.'));
  }
  return pool;
}

export async function listDrafts(owner: Address) {
  const db = draftPool();
  if (!db) return deploymentStore().listDrafts(owner);
  const result = await db.query<Pick<DraftRow, 'id' | 'name' | 'updatedAt'>>(
    `SELECT id, name, updated_at AS "updatedAt" FROM omniflow.pipeline_drafts
     WHERE owner = $1 AND environment = $2 ORDER BY updated_at DESC, id`,
    [owner.toLowerCase(), deploymentEnvironment],
  );
  return result.rows.map(row => ({ ...row, updatedAt: Number(row.updatedAt) }));
}

export async function getDraft(owner: Address, id: string): Promise<Draft | undefined> {
  const db = draftPool();
  if (!db) return deploymentStore().getDraft(owner, id);
  const { rows: [row] } = await db.query<DraftRow>(
    `SELECT ${columns} FROM omniflow.pipeline_drafts WHERE id = $1 AND owner = $2 AND environment = $3`,
    [id, owner.toLowerCase(), deploymentEnvironment],
  );
  return row && { ...row, updatedAt: Number(row.updatedAt) };
}

export async function saveDraft(owner: Address, graphJson: string, name: string, existing?: Revision) {
  const db = draftPool();
  if (!db) return deploymentStore().saveDraft(owner, graphJson, name, existing);
  const id = existing?.id ?? randomUUID();
  const updatedAt = Math.max(Date.now(), (existing?.updatedAt ?? 0) + 1);
  const fields = [id, owner.toLowerCase(), deploymentEnvironment, name, graphJson, updatedAt];
  const result = existing
    ? await db.query(
      `UPDATE omniflow.pipeline_drafts SET name = $4, graph_json = $5, updated_at = $6
       WHERE id = $1 AND owner = $2 AND environment = $3 AND updated_at = $7`, [...fields, existing.updatedAt])
    : await db.query(
      `INSERT INTO omniflow.pipeline_drafts (id, owner, environment, name, graph_json, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)`, fields);
  return result.rowCount === 1 ? { id, updatedAt } : undefined;
}

export async function deleteDraft(owner: Address, id: string, revision?: Revision) {
  const db = draftPool();
  if (!db) return deploymentStore().deleteDraft(owner, id, revision);
  const result = revision
    ? await db.query(
      `DELETE FROM omniflow.pipeline_drafts
       WHERE id = $1 AND owner = $2 AND environment = $3 AND updated_at = $4`,
      [id, owner.toLowerCase(), deploymentEnvironment, revision.updatedAt])
    : await db.query(
      `DELETE FROM omniflow.pipeline_drafts
       WHERE id = $1 AND owner = $2 AND environment = $3`,
      [id, owner.toLowerCase(), deploymentEnvironment]);
  return (result.rowCount ?? 0) === 1;
}

// Preserve the ID from the SQLite deployment reservation across retries and process restarts.
export async function publishReservedDraft(owner: Address, id: string) {
  const db = draftPool();
  if (!db) return;
  const draft = deploymentStore().getDraft(owner, id);
  if (draft) await importDraft(db, draft);
}

export async function importDraft(db: Pool | PoolClient, draft: Draft) {
  const result = await db.query(
    `INSERT INTO omniflow.pipeline_drafts (id, owner, environment, name, graph_json, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
    [draft.id, draft.owner, deploymentEnvironment, draft.name, draft.graphJson, draft.updatedAt],
  );
  return result.rowCount ?? 0;
}
