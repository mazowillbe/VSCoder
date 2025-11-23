"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    GEMINI_API_KEY: zod_1.z.string().min(1, 'GEMINI_API_KEY is required'),
    WORKSPACE_PATH: zod_1.z.string().min(1, 'WORKSPACE_PATH is required'),
    PORT: zod_1.z.string().optional().default('3001'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).optional().default('development'),
});
function validateEnv() {
    try {
        const env = envSchema.parse(process.env);
        console.log('✅ Environment variables validated');
        return env;
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
//# sourceMappingURL=env.js.map