import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on, config) { // eslint-disable-line @typescript-eslint/no-unused-vars
      // implement node event listeners here
    },
    experimentalRunAllSpecs: false,
    experimentalMemoryManagement: true,
    defaultCommandTimeout: 10000,
  },
  viewportWidth: 1280,
  viewportHeight: 720,
  video: false,
  screenshotOnRunFailure: true,
  chromeWebSecurity: false,
  retries: {
    runMode: 2,
    openMode: 0
  },
});
