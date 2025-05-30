import { Selectors, TEST_URL } from 'cypress/support/utils';

describe(`Allowances Async Data Loading (${TEST_URL})`, () => {
  const TEST_ADDRESS = '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a';
  const CHAIN_ID = 1; // Ethereum mainnet

  it('should render table immediately and handle async data loading', () => {
    cy.visit(`${TEST_URL}/address/${TEST_ADDRESS}?chainId=${CHAIN_ID}`, { timeout: 10_000 });
    cy.wait(1000);

    cy.get(Selectors.ALLOWANCES_TABLE, { timeout: 4_000 }).should('exist');
    cy.get(Selectors.ALLOWANCE_TABLE_ROW).should('have.length.greaterThan', 0);

    cy.get(Selectors.ALLOWANCES_LOADER, { timeout: 60_000 }).should('not.exist');

    cy.get(Selectors.ALLOWANCE_TABLE_ROW).should('have.length.greaterThan', 0);
    cy.get(Selectors.ALLOWANCES_TABLE).should('be.visible');
  });

  it('should demonstrate non-blocking async behavior with controlled delays', () => {
    cy.intercept('GET', '**/api/**/token/**/price', (req) => {
      req.reply((res) => {
        setTimeout(() => res.send(), 500);
      });
    }).as('tokenPrice');

    cy.visit(`${TEST_URL}/address/${TEST_ADDRESS}?chainId=${CHAIN_ID}`, { timeout: 15_000 });
    cy.wait(1000);

    cy.get(Selectors.ALLOWANCES_TABLE, { timeout: 4_000 }).should('exist');
    cy.get(Selectors.ALLOWANCE_TABLE_ROW).should('have.length.greaterThan', 0);

    cy.get(Selectors.ALLOWANCES_LOADER, { timeout: 60_000 }).should('not.exist');

    cy.get(Selectors.ALLOWANCE_TABLE_ROW).should('have.length.greaterThan', 0);
  });

  it('should maintain table functionality throughout data loading process', () => {
    cy.visit(`${TEST_URL}/address/${TEST_ADDRESS}?chainId=${CHAIN_ID}`, { timeout: 10_000 });
    cy.wait(1000);

    cy.get(Selectors.ALLOWANCES_TABLE, { timeout: 4_000 }).should('exist');
    cy.get(Selectors.ALLOWANCE_TABLE_ROW).should('have.length.greaterThan', 0);

    cy.get(Selectors.ALLOWANCES_TABLE).should('be.visible');

    cy.get(Selectors.ALLOWANCES_LOADER, { timeout: 60_000 }).should('not.exist');

    cy.get(Selectors.ALLOWANCE_TABLE_ROW).should('have.length.greaterThan', 0);
    cy.get(Selectors.ALLOWANCES_TABLE).should('be.visible');
  });
});

// biome-ignore lint/complexity/noUselessEmptyExport lint/suspicious/noExportsInTest: Cypress wants this
export {};
