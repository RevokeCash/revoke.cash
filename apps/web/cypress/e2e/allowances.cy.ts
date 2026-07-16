import { Selectors, TEST_URL } from 'cypress/support/utils';

describe(`Allowances (${TEST_URL})`, () => {
  const TEST_ADDRESS = '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a';
  const CHAIN_ID = 1; // Ethereum mainnet

  it('should render table immediately, and spender data eventually', () => {
    cy.visit(`${TEST_URL}/address/${TEST_ADDRESS}?chainId=${CHAIN_ID}`, { timeout: 10_000 });
    cy.wait(1000); // Since App Router we now need this delay before the page is fully loaded -__-

    cy.get(Selectors.ALLOWANCES_TABLE, { timeout: 4_000 }).should('exist');
    cy.wait(100); // Wait for the loading spinner to appear
    cy.get(Selectors.ALLOWANCES_LOADER, { timeout: 60_000 }).should('not.exist'); // Check that the loading spinner is gone

    cy.get(Selectors.CONTROLS_SECTION, { timeout: 4_000 }).should('exist');

    // Check that labels and tooltips are rendered after some time
    cy.contains('OpenSea (old)', { timeout: 20_000 }).should('exist');
    cy.get('.risk-tooltip', { timeout: 20_000 }).should('exist');
  });

  it('should render table immediately', () => {
    cy.visit(`${TEST_URL}/address/${TEST_ADDRESS}?chainId=${CHAIN_ID}`, { timeout: 10_000 });
    cy.wait(1000); // Since App Router we now need this delay before the page is fully loaded -__-

    cy.get(Selectors.ALLOWANCES_TABLE, { timeout: 4_000 }).should('exist');
    cy.wait(100); // Wait for the loading spinner to appear
    cy.get(Selectors.ALLOWANCES_LOADER, { timeout: 60_000 }).should('not.exist'); // Check that the loading spinner is gone

    cy.get(Selectors.CONTROLS_SECTION, { timeout: 4_000 }).should('exist');
  });
});

// biome-ignore lint/complexity/noUselessEmptyExport lint/suspicious/noExportsInTest: Cypress wants this
export {};
