import { defineConfig } from '@playwright/test'

// Start the backend (port 8000) and frontend (port 5173) first, then run `npm run e2e`.
export default defineConfig({
    testDir: './e2e',
    timeout: 60_000,
    retries: 0,
    use: { baseURL: 'http://localhost:5173', trace: 'retain-on-failure' },
})