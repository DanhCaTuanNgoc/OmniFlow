import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { env } from '../src/config/env.js';
import { DeploymentStore } from '../src/data/deployments.js';
import { draftPool, importDraft } from '../src/data/pipelineDrafts.js';

async function migrate() {
  const db = draftPool();
  if (!db) throw new Error('DATABASE_URL is required.');
  try {
    const sql = await readFile(resolve(__dirname, '../../supabase/migrations/20261121000000_workspace_drafts.sql'), 'utf8');
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(20261121, 1)');
      await client.query(sql);
      let imported = 0;
      if (process.argv.includes('--import-sqlite') && existsSync(env.WORKSPACE_DB_PATH)) {
        const local = new DeploymentStore(env.WORKSPACE_DB_PATH);
        try {
          for (const draft of local.draftsForMigration()) imported += await importDraft(client, draft);
        } finally {
          local.close();
        }
      }
      await client.query('COMMIT');
      console.log(`PostgreSQL draft schema ready. Imported ${imported} SQLite drafts.`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await db.end();
  }
}

migrate().catch(error => {
  console.error('Workspace draft migration failed:', error?.code ?? error?.name ?? 'Unknown error');
  process.exitCode = 1;
});
