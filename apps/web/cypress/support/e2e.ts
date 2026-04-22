// @ts-expect-error
import { register as registerCypressGrep } from '@cypress/grep';

registerCypressGrep();

// Somehow shit gets fucked up *only* when running in Cypress, not in the browser
Cypress.on('uncaught:exception', () => false);
