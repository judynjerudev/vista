import { defineConfig } from 'vitest/config'

// Run through `npm run test:integration`, which starts the Firestore emulator
// and sets `FIRESTORE_EMULATOR_HOST` before running these tests.
export default defineConfig({
  test: {
    include: ['**/*.integration.test.ts'],
    exclude: ['node_modules', 'dist'],
    env: {
      // The `demo-` prefix keeps the emulator from reaching any real project.
      FIREBASE_PROJECT_ID: 'demo-vista',
    },
    // The test files share one emulator database.
    fileParallelism: false,
  },
})
