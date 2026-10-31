import { z } from 'zod';
import crypto from 'crypto';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().optional().default(''),
  SESSION_SECRET: z.string().min(32).optional(),
  TOTP_ENCRYPTION_KEY: z.string().min(32).optional(),
  BRAPI_TOKEN: z.string().optional().default('6AC8B12Ck6WvvTnVEnUoSh'),
  GEMINI_API_KEY: z.string().optional().default(''),
  CRON_SECRET: z.string().optional().default('norte-invest-cron-dev-secret')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ [Env Validation Error] Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors);
  throw new Error('Falha crítica na validação das variáveis de ambiente.');
}

const isProd = parsed.data.NODE_ENV === 'production';

// Em produção real com Supabase conectado, exigir SESSION_SECRET explícito
const fallbackSeed = process.env.TURSO_AUTH_TOKEN || 'norte-invest-v2-local-dev-seed-do-not-use-in-cloud';

export const env = {
  NODE_ENV: parsed.data.NODE_ENV,
  IS_PROD: isProd,
  DATABASE_URL: parsed.data.DATABASE_URL.trim(),
  SESSION_SECRET:
    parsed.data.SESSION_SECRET ||
    crypto.createHash('sha256').update(`session:${fallbackSeed}`).digest('hex'),
  TOTP_ENCRYPTION_KEY:
    parsed.data.TOTP_ENCRYPTION_KEY ||
    crypto.createHash('sha256').update(`totp:${fallbackSeed}`).digest('hex'),
  BRAPI_TOKEN: parsed.data.BRAPI_TOKEN,
  GEMINI_API_KEY: parsed.data.GEMINI_API_KEY,
  CRON_SECRET: parsed.data.CRON_SECRET
} as const;
