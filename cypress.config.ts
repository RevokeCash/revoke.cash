import { defineConfig } from 'cypress';

export default defineConfig({
  experimentalMemoryManagement: true,
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
