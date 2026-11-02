import { defineConfig } from 'vitest/config'

// Run through `npm run test:integration`, which starts the Firestore emulator
// and sets `FIRESTORE_EMULATOR_HOST` before running these tests. Redis comes
// from `docker compose up -d` locally and from service containers in CI.
export default defineConfig({
  test: {
    include: ['**/*.integration.test.ts'],
    exclude: ['node_modules', 'dist'],
    env: {
      // The `demo-` prefix keeps the emulator from reaching any real project.
      FIREBASE_PROJECT_ID: 'demo-vista',
      UPSTASH_REDIS_REST_URL: 'http://127.0.0.1:8079',
      UPSTASH_REDIS_REST_TOKEN: 'local-dev-token',
    },
    // The test files share one emulator database.
    fileParallelism: false,
    // Vercel's runtime can't `require()` an ES module, although Node 24 can.
    // Turning that off here makes a dependency that relies on it fail these
    // tests instead of failing in production.
    execArgv: ['--no-experimental-require-module'],
  },
})
