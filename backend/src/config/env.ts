import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ALLOWED_ORIGINS: z.string().default('*'),
  WORKSPACE_DB_PATH: z.string().min(1).default('.workspace/workspace.sqlite'),
  WORKSPACE_ORIGIN: z.string().url().refine((value) => {
    try {
      const url = new URL(value);
      return value === url.origin && (url.protocol === 'https:' ||
        (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)));
    } catch {
      return false;
    }
  }, 'Use a HTTPS origin or a loopback HTTP origin, without a path or trailing slash.').default('http://localhost:3000'),
  BASE_SEPOLIA_RPC_URL: z.string().url().default('https://sepolia.base.org'),
  LASNA_RPC_URL: z.string().url().default('https://lasna-rpc.rnk.dev'),
  SYSTEM_CONTRACT_LASNA: z
    .string()
    .default('0x0000000000000000000000000000000000fffFfF'),
  CALLBACK_PROXY_BASE_SEPOLIA: z
    .string()
    .default('0xa6eA49Ed671B8a4dfCDd34E36b7a75Ac79B8A5a6'),
  RELAYER_PRIVATE_KEY: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/, 'Invalid 32-byte hexadecimal private key')
    .optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
