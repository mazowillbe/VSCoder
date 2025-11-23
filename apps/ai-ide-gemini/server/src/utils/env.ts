import { z } from 'zod';

const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  WORKSPACE_PATH: z.string().min(1, 'WORKSPACE_PATH is required'),
  PORT: z.string().optional().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
});

export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    console.log('✅ Environment variables validated');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\nPlease check your .env file and ensure all required variables are set.');
      process.exit(1);
    }
    throw error;
  }
}

export type Env = z.infer<typeof envSchema>;
