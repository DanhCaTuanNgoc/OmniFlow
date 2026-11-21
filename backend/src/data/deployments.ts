import Database from 'better-sqlite3';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Address, Hash, Hex } from 'viem';
import { env } from '../config/env.js';
import type { PipelineGraph } from '../schemas/pipeline.schema.js';
import type { ActivityLogEntry, PendingExecution } from './activityLog.js';

export function graphSnapshot(graph: PipelineGraph) {
  const { createdAt: _createdAt, ...metadata } = graph.metadata;
  return JSON.stringify({ ...graph, metadata }, (_key, value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0));
  });
}

export class DeploymentConflict extends Error {}
export class DeploymentLimit extends Error {}

export const deploymentEnvironment = 'base-sepolia-lasna';

export type DeploymentIntent = {
  id: string;
  revisionId: string;
  workspacePipelineId: string;
  owner: Address;
  key: string;
  graphHash: string;
  graphJson: string;
  template: string;
  environment: string;
  createdAt: number;
  signer: Address;
  nonce: number;
  signedTransaction: Hex;
  txHash: Hash;
  status: 'signed' | 'deployed' | 'reverted';
  rscAddress: Address | null;
  broadcastCount: number;
  lastBroadcastAt: number;
};

export type NewDeploymentIntent = Omit<DeploymentIntent, 'id' | 'revisionId' | 'workspacePipelineId' |
  'graphHash' | 'createdAt' | 'status' | 'rscAddress' | 'broadcastCount' | 'lastBroadcastAt'> & { workspacePipelineId?: string };

export type Draft = { id: string; owner: Address; name: string; graphJson: string; updatedAt: number };

export class DeploymentStore {
  private readonly db: Database.Database;

  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true });
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = FULL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS deployments (
        id TEXT PRIMARY KEY, revisionId TEXT NOT NULL UNIQUE, owner TEXT NOT NULL,
        key TEXT NOT NULL, graphHash TEXT NOT NULL, graphJson TEXT NOT NULL, template TEXT NOT NULL,
        environment TEXT NOT NULL, createdAt INTEGER NOT NULL, signer TEXT NOT NULL,
        nonce INTEGER NOT NULL, signedTransaction TEXT NOT NULL, txHash TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL CHECK (status IN ('signed', 'deployed', 'reverted')), rscAddress TEXT,
        workspacePipelineId TEXT,
        broadcastCount INTEGER NOT NULL DEFAULT 0, lastBroadcastAt INTEGER NOT NULL DEFAULT 0,
        UNIQUE (owner, environment, key), UNIQUE (signer, environment, nonce)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS one_signed_deployment_per_relayer
        ON deployments (signer, environment) WHERE status = 'signed';
      CREATE INDEX IF NOT EXISTS deployments_by_environment_time ON deployments (environment, createdAt);
      CREATE TABLE IF NOT EXISTS pipeline_drafts (
        id TEXT PRIMARY KEY, owner TEXT NOT NULL, environment TEXT NOT NULL, name TEXT NOT NULL,
        graphJson TEXT NOT NULL, updatedAt INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS drafts_by_owner ON pipeline_drafts (owner, environment, updatedAt);
      CREATE TABLE IF NOT EXISTS deployment_steps (
        deploymentId TEXT NOT NULL REFERENCES deployments(id), kind TEXT NOT NULL, txHash TEXT NOT NULL,
        chainId INTEGER NOT NULL, blockNumber TEXT NOT NULL, blockHash TEXT NOT NULL,
        PRIMARY KEY (deploymentId, kind, txHash)
      );
      CREATE TABLE IF NOT EXISTS execution_cursors (
        deploymentId TEXT PRIMARY KEY REFERENCES deployments(id), nextLasnaBlock TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS executions (
        deploymentId TEXT NOT NULL REFERENCES deployments(id), reactiveTxHash TEXT NOT NULL,
        originTxHash TEXT NOT NULL, originLogIndex INTEGER NOT NULL, report TEXT, checkedAt INTEGER NOT NULL DEFAULT 0,
        conflictingReaction INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (deploymentId, reactiveTxHash)
      );
      CREATE INDEX IF NOT EXISTS executions_by_origin ON executions (deploymentId, originTxHash, originLogIndex);
      CREATE TABLE IF NOT EXISTS vault_links (
        owner TEXT NOT NULL, address TEXT NOT NULL, chainId INTEGER NOT NULL, pair TEXT NOT NULL,
        router TEXT NOT NULL, quote TEXT NOT NULL, proxy TEXT NOT NULL, creationTxHash TEXT,
        verifiedAt INTEGER NOT NULL, PRIMARY KEY (owner, address, chainId)
      );
    `);
    const columns = this.db.pragma('table_info(deployments)') as { name: string }[];
    if (!columns.some(column => column.name === 'workspacePipelineId')) {
      this.db.exec('ALTER TABLE deployments ADD COLUMN workspacePipelineId TEXT');
    }
    if (!columns.some(column => column.name === 'broadcastCount')) {
      this.db.exec('ALTER TABLE deployments ADD COLUMN broadcastCount INTEGER NOT NULL DEFAULT 0');
      this.db.exec('ALTER TABLE deployments ADD COLUMN lastBroadcastAt INTEGER NOT NULL DEFAULT 0');
    }
    const executionColumns = this.db.pragma('table_info(executions)') as { name: string }[];
    if (!executionColumns.some(column => column.name === 'conflictingReaction')) {
      this.db.exec('ALTER TABLE executions ADD COLUMN conflictingReaction INTEGER NOT NULL DEFAULT 0');
    }
  }

  get(owner: Address, environment: string, key: string) {
    return this.db.prepare('SELECT * FROM deployments WHERE owner = ? AND environment = ? AND key = ?')
      .get(owner, environment, key) as DeploymentIntent | undefined;
  }

  list(owner: Address, environment: string) {
    return this.db.prepare('SELECT * FROM deployments WHERE owner = ? AND environment = ? ORDER BY createdAt DESC')
      .all(owner, environment) as DeploymentIntent[];
  }

  deployed() {
    return this.db.prepare("SELECT * FROM deployments WHERE status = 'deployed' AND environment = ?")
      .all(deploymentEnvironment) as DeploymentIntent[];
  }

  pendingForSigner(signer: Address) {
    return this.db.prepare("SELECT * FROM deployments WHERE status = 'signed' AND signer = ? AND environment = ?")
      .get(signer.toLowerCase(), deploymentEnvironment) as DeploymentIntent | undefined;
  }

  claimBroadcast(id: string) {
    const now = Date.now();
    return this.db.prepare(`
      UPDATE deployments SET broadcastCount = broadcastCount + 1, lastBroadcastAt = ?
      WHERE id = ? AND status = 'signed' AND broadcastCount < 5 AND lastBroadcastAt <= ?
    `).run(now, id, now - 30_000).changes === 1;
  }

  cursor(deploymentId: string) {
    const row = this.db.prepare('SELECT nextLasnaBlock FROM execution_cursors WHERE deploymentId = ?')
      .get(deploymentId) as { nextLasnaBlock: string } | undefined;
    return row ? BigInt(row.nextLasnaBlock) : undefined;
  }

  ingestExecutionLogs(deploymentId: string, nextBlock: bigint, entries: PendingExecution[]) {
    const insert = this.db.prepare(`
      INSERT OR IGNORE INTO executions (deploymentId, reactiveTxHash, originTxHash, originLogIndex)
      VALUES (@deploymentId, @reactiveTxHash, @originTxHash, @originLogIndex)
    `);
    const originMatch = this.db.prepare(
      'SELECT reactiveTxHash FROM executions WHERE deploymentId = ? AND originTxHash = ? AND originLogIndex = ? LIMIT 1',
    );
    const markConflict = this.db.prepare(
      "UPDATE executions SET conflictingReaction = 1, report = NULL, checkedAt = 0 WHERE deploymentId = ? AND reactiveTxHash = ? AND conflictingReaction = 0",
    );
    this.db.transaction(() => {
      for (const entry of entries) {
        const current = originMatch.get(entry.deploymentId, entry.originTxHash, entry.originLogIndex) as { reactiveTxHash: Hash } | undefined;
        if (!current) insert.run(entry);
        else if (entry.reactiveTxHash !== current.reactiveTxHash) markConflict.run(entry.deploymentId, current.reactiveTxHash);
      }
      const previous = this.cursor(deploymentId);
      if (previous === undefined || previous < nextBlock) {
        this.db.prepare('INSERT OR REPLACE INTO execution_cursors VALUES (?, ?)').run(deploymentId, nextBlock.toString());
      }
    }).immediate();
  }

  pendingExecutions(deploymentId: string, limit: number) {
    const rows = this.db.prepare(`
      SELECT deploymentId, reactiveTxHash, originTxHash, originLogIndex, conflictingReaction FROM executions
      WHERE deploymentId = ? AND (report IS NULL OR json_extract(report, '$.status') IN ('PENDING', 'UNVERIFIED', 'REORGED'))
      ORDER BY checkedAt ASC, rowid ASC LIMIT ?
    `).all(deploymentId, limit) as (Omit<PendingExecution, 'conflictingReaction'> & { conflictingReaction: number })[];
    return rows.map(({ conflictingReaction, ...entry }) => conflictingReaction ? { ...entry, conflictingReaction: true } : entry);
  }

  updateExecution(entry: PendingExecution, report: ActivityLogEntry) {
    const result = this.db.prepare(`
      UPDATE executions SET report = ? WHERE deploymentId = ? AND reactiveTxHash = ? AND report IS NOT ?
    `);
    const value = JSON.stringify(report);
    return result.run(value, entry.deploymentId, entry.reactiveTxHash, value).changes > 0;
  }

  markExecutionChecked(entry: PendingExecution) {
    this.db.prepare('UPDATE executions SET checkedAt = ? WHERE deploymentId = ? AND reactiveTxHash = ?')
      .run(Date.now(), entry.deploymentId, entry.reactiveTxHash);
  }

  history(owner: Address, deploymentId?: string) {
    return this.historyPage(owner, deploymentId).logs;
  }

  historyPage(owner: Address, deploymentId?: string, before?: { timestamp: string; sequence: number }) {
    const rows = this.db.prepare(`
      SELECT executions.report, executions.rowid AS sequence FROM executions
      JOIN deployments ON deployments.id = executions.deploymentId
      WHERE deployments.owner = ? AND deployments.environment = ?
        AND (? IS NULL OR deployments.id = ?) AND executions.report IS NOT NULL
        AND (? IS NULL OR json_extract(executions.report, '$.timestamp') < ?
          OR (json_extract(executions.report, '$.timestamp') = ? AND executions.rowid < ?))
      ORDER BY json_extract(executions.report, '$.timestamp') DESC, executions.rowid DESC LIMIT 51
    `).all(owner.toLowerCase(), deploymentEnvironment, deploymentId ?? null, deploymentId ?? null,
      before?.timestamp ?? null, before?.timestamp ?? null, before?.timestamp ?? null, before?.sequence ?? null
    ) as { report: string; sequence: number }[];
    const results = rows.slice(0, 50).map(row => ({ sequence: row.sequence, entry: JSON.parse(row.report) as ActivityLogEntry }));
    const last = results.at(-1);
    return {
      logs: results.map(row => row.entry),
      next: rows.length > 50 && last ? { timestamp: last.entry.timestamp, sequence: last.sequence } : null,
    };
  }

  owns(owner: Address, id: string) {
    return Boolean(this.getById(owner, id));
  }

  getById(owner: Address, id: string) {
    return this.db.prepare('SELECT * FROM deployments WHERE id = ? AND owner = ? AND environment = ?')
      .get(id, owner.toLowerCase(), deploymentEnvironment) as DeploymentIntent | undefined;
  }

  getDraft(owner: Address, id: string) {
    return this.db.prepare('SELECT id, owner, name, graphJson, updatedAt FROM pipeline_drafts WHERE id = ? AND owner = ? AND environment = ?')
      .get(id, owner.toLowerCase(), deploymentEnvironment) as Draft | undefined;
  }

  listDrafts(owner: Address) {
    return this.db.prepare('SELECT id, name, updatedAt FROM pipeline_drafts WHERE owner = ? AND environment = ? ORDER BY updatedAt DESC')
      .all(owner.toLowerCase(), deploymentEnvironment) as Omit<Draft, 'owner' | 'graphJson'>[];
  }

  draftsForMigration() {
    return this.db.prepare('SELECT id, owner, name, graphJson, updatedAt FROM pipeline_drafts WHERE environment = ?')
      .iterate(deploymentEnvironment) as IterableIterator<Draft>;
  }

  saveDraft(owner: Address, graphJson: string, name: string, existing?: { id: string; updatedAt: number }) {
    const draft = { id: existing?.id ?? randomUUID(), owner: owner.toLowerCase(), environment: deploymentEnvironment,
      name, graphJson, updatedAt: Math.max(Date.now(), (existing?.updatedAt ?? 0) + 1) };
    if (existing) {
      const result = this.db.prepare(`
        UPDATE pipeline_drafts SET name = @name, graphJson = @graphJson, updatedAt = @updatedAt
        WHERE id = @id AND owner = @owner AND environment = @environment AND updatedAt = @previous
      `).run({ ...draft, previous: existing.updatedAt });
      if (!result.changes) return undefined;
    } else {
      this.db.prepare('INSERT INTO pipeline_drafts VALUES (@id, @owner, @environment, @name, @graphJson, @updatedAt)').run(draft);
    }
    return draft;
  }

  recordStep(step: { deploymentId: string; kind: string; txHash: Hash; chainId: number; blockNumber: string; blockHash: Hash }) {
    this.db.prepare('INSERT OR IGNORE INTO deployment_steps VALUES (@deploymentId, @kind, @txHash, @chainId, @blockNumber, @blockHash)')
      .run(step);
  }

  steps(deploymentId: string) {
    return this.db.prepare('SELECT kind, txHash, chainId, blockNumber, blockHash FROM deployment_steps WHERE deploymentId = ? ORDER BY CAST(blockNumber AS INTEGER) DESC')
      .all(deploymentId) as { kind: string; txHash: Hash; chainId: number; blockNumber: string; blockHash: Hash }[];
  }

  linkVault(link: { owner: Address; address: Address; chainId: number; pair: Address; router: Address;
    quote: Address; proxy: Address; creationTxHash?: Hash }) {
    const input = { ...link, owner: link.owner.toLowerCase(), address: link.address.toLowerCase(),
      creationTxHash: link.creationTxHash ?? null, verifiedAt: Date.now() };
    this.db.prepare(`
      INSERT INTO vault_links VALUES (@owner, @address, @chainId, @pair, @router, @quote, @proxy, @creationTxHash, @verifiedAt)
      ON CONFLICT (owner, address, chainId) DO UPDATE SET
        creationTxHash = COALESCE(excluded.creationTxHash, vault_links.creationTxHash), verifiedAt = excluded.verifiedAt
    `).run(input);
    return this.db.prepare('SELECT * FROM vault_links WHERE owner = ? AND address = ? AND chainId = ?')
      .get(input.owner, input.address, input.chainId);
  }

  reserve(input: NewDeploymentIntent, verifiedDraftId?: string) {
    return this.db.transaction(() => {
      const existing = this.get(input.owner, input.environment, input.key);
      if (existing) {
        if (existing.graphJson !== input.graphJson || existing.template !== input.template ||
            (input.workspacePipelineId && existing.workspacePipelineId !== input.workspacePipelineId)) {
          throw new DeploymentConflict('This deployment key is already bound to another revision.');
        }
        return existing;
      }
      const createdAt = Date.now();
      const cutoff = createdAt - 24 * 60 * 60_000;
      const limits = this.db.prepare(`
        SELECT COUNT(*) AS total, COUNT(CASE WHEN owner = ? THEN 1 END) AS personal
        FROM deployments WHERE environment = ? AND createdAt > ?
      `).get(input.owner, input.environment, cutoff) as { total: number; personal: number };
      if (limits.personal >= 3 || limits.total >= 20) {
        throw new DeploymentLimit('The testnet relay quota has been reached. Try again later.');
      }
      const conflictingNonce = this.db.prepare(`
        SELECT 1 FROM deployments WHERE signer = ? AND environment = ? AND (status = 'signed' OR nonce = ?)
      `).get(input.signer, input.environment, input.nonce);
      if (conflictingNonce) throw new DeploymentConflict('A relay transaction is pending or the nonce changed. Retry the same deployment.');

      const workspacePipelineId = input.workspacePipelineId
        ? verifiedDraftId === input.workspacePipelineId ? verifiedDraftId : this.getDraft(input.owner, input.workspacePipelineId)?.id
        : this.saveDraft(input.owner, input.graphJson, (JSON.parse(input.graphJson) as PipelineGraph).metadata.name)?.id;
      if (!workspacePipelineId) throw new DeploymentConflict('The workspace pipeline is unavailable.');
      const intent: DeploymentIntent = {
        ...input,
        workspacePipelineId,
        id: randomUUID(),
        revisionId: randomUUID(),
        graphHash: createHash('sha256').update(input.graphJson).digest('hex'),
        createdAt,
        status: 'signed',
        rscAddress: null,
        broadcastCount: 0,
        lastBroadcastAt: 0,
      };
      this.db.prepare(`
        INSERT INTO deployments (id, revisionId, owner, key, graphHash, graphJson, template, environment, createdAt,
          signer, nonce, signedTransaction, txHash, status, rscAddress, workspacePipelineId, broadcastCount)
        VALUES (
          @id, @revisionId, @owner, @key, @graphHash, @graphJson, @template, @environment, @createdAt,
          @signer, @nonce, @signedTransaction, @txHash, @status, @rscAddress, @workspacePipelineId, @broadcastCount
        )
      `).run(intent);
      return intent;
    }).immediate();
  }

  settle(intent: DeploymentIntent, status: 'deployed' | 'reverted', rscAddress: Address | null) {
    this.db.prepare("UPDATE deployments SET status = ?, rscAddress = ? WHERE id = ? AND status = 'signed'")
      .run(status, rscAddress, intent.id);
    return this.get(intent.owner, intent.environment, intent.key)!;
  }

  close() {
    this.db.close();
  }
}

let store: DeploymentStore | undefined;
export function deploymentStore() {
  return store ??= new DeploymentStore(env.WORKSPACE_DB_PATH);
}
