import dotenv from 'dotenv';
import { z } from 'zod';
import { formatEther, parseEther } from 'viem';
import { STOP_LOSS_TEMPLATE } from '@omniflow/shared';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ALLOWED_ORIGINS: z.string().default('*'),
  WORKSPACE_DB_PATH: z.string().min(1).default('.workspace/workspace.sqlite'),
  DATABASE_URL: z.string().url().refine(value => /^postgres(?:ql)?:\/\//.test(value)).optional(),
  DATABASE_CA_PATH: z.string().min(1).default('supabase-ca.crt'),
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
  RSC_DEPLOY_FUNDING_LREACT: z.string()
    .regex(/^[0-9]{1,18}(?:\.[0-9]{1,18})?$/, 'Use a decimal amount with up to 18 decimal places')
    .default(formatEther(STOP_LOSS_TEMPLATE.fundingWei))
    .transform(value => parseEther(value))
    .refine(value => value > 0n, 'Deployment funding must be positive'),
  SYSTEM_CONTRACT_LASNA: z
    .string()
    .default(STOP_LOSS_TEMPLATE.omniSystem),
  CALLBACK_PROXY_BASE_SEPOLIA: z
    .string()
    .default(STOP_LOSS_TEMPLATE.callbackProxy),
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
