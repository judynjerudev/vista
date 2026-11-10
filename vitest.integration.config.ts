import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.integration.test.ts'],
    exclude: ['node_modules', 'dist'],
    env: {
      FIREBASE_PROJECT_ID: 'demo-vista',
      UPSTASH_REDIS_REST_URL: 'http://127.0.0.1:8079',
      UPSTASH_REDIS_REST_TOKEN: 'local-dev-token',
    },
    fileParallelism: false,
    execArgv: ['--no-experimental-require-module'],
  },
})
