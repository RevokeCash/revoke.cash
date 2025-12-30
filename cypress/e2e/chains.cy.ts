// This is a list of chain name + address tuples. The chain name will be selected in the dropdown, and the address
// entered in the input field. These addresses are either my own address or random addresses that I've found to have
// allowances on these chains. Because these addresses were chosen randomly it is possible that some allowances may

import { ChainId } from '@revoke.cash/chains';
import { TEST_ADDRESSES } from 'cypress/support/chain-fixtures';
import { Selectors, TEST_URL } from 'cypress/support/utils';
import { getChainConfig, getChainName, ORDERED_CHAINS } from 'lib/utils/chains';

describe(`Chain Support (${TEST_URL})`, () => {
  it('should have a test for every item in the chain selection dropdown menu', () => {
    cy.visit(`${TEST_URL}/address/0xe126b3E5d052f1F575828f61fEBA4f4f2603652a`, { timeout: 10_000 });
    cy.wait(1000); // Since App Router we now need this delay before the page is fully loaded -__-

    cy.get(Selectors.CHAIN_SELECT_BUTTON).should('exist').click();

    const fixtureChainNames = ORDERED_CHAINS.map((chainId) => getChainName(chainId));
    const appChainNames = cy.get(Selectors.CHAIN_SELECT_OPTION).should('have.length', fixtureChainNames.length);
    appChainNames.each((chain) => cy.wrap(chain).invoke('text').should('be.oneOf', fixtureChainNames));
  });

  ORDERED_CHAINS.forEach((chainId) => {
    const chainName = getChainName(chainId);
    const supportType = getChainConfig(chainId).type;
    const fixtureAddress = TEST_ADDRESSES[chainId];

    // Skip PulseChain because it is too slow, causing failures
    const describeFunction = chainId === ChainId.PulseChain ? describe.skip : describe;

    const testName = `${chainName} (chainId: ${chainId}) --- ${supportType} (${TEST_URL}/address/${fixtureAddress}?chainId=${chainId})`;
    describeFunction(testName, () => {
      it('should be able to check approvals', () => {
        cy.visit(`${TEST_URL}/address/${fixtureAddress}`, { timeout: 10_000 });
        cy.wait(1000); // Since App Router we now need this delay before the page is fully loaded -__-

        cy.get(Selectors.CHAIN_SELECT_BUTTON).click({ force: true });
        cy.get(Selectors.CHAIN_SELECT_OPTION).contains(chainName).click();

        cy.get(Selectors.ALLOWANCES_TABLE, { timeout: 4_000 }).should('exist');
        cy.wait(100); // Wait for the loading spinner to appear
        cy.get(Selectors.ALLOWANCES_LOADER, { timeout: 60_000 }).should('not.exist'); // Check that the loading spinner is gone
        cy.get(Selectors.CONTROLS_SECTION, { timeout: 4_000 }).should('exist');

        // Get the number of approvals from the UI and store it in a file to compare with production
        if (Cypress.env('CHECK_REGRESSIONS')) {
          cy.get(Selectors.TOTAL_ALLOWANCES)
            .should('exist')
            .invoke('text')
            .then((text) => {
              cy.writeFile(`cypress/downloads/temp_${chainId}_total_allowances.txt`, text);
            });

          cy.get(Selectors.ALLOWANCE_TABLE_ROW)
            .its('length')
            .then((length) => {
              cy.writeFile(`cypress/downloads/temp_${chainId}_total_rows.txt`, `${length}`);
            });
        }

        if (Cypress.env('CHECK_EXPLORER')) {
          // To test that the explorer link works, we navigate to the "Last Updated" URL and check that the address is present
          const linkElement = cy.get(Selectors.LAST_UPDATED_LINK).first();
          linkElement.invoke('attr', 'href').then((href) => {
            cy.origin(href!, { args: { href, fixtureAddress } }, ({ href, fixtureAddress }) => {
              // Suppress errors on the explorer page
              cy.on('uncaught:exception', () => false);

              cy.visit(href!);
              cy.get(`a[href*="${fixtureAddress}" i]`, { timeout: 10_000 }).should('exist');
            });
          });
        }
      });

      if (Cypress.env('CHECK_REGRESSIONS')) {
        it('should return the same results as production', () => {
          cy.visit(`https://revoke.cash/address/${fixtureAddress}?chainId=${chainId}`, { timeout: 10_000 });
          cy.wait(1000); // Since App Router we now need this delay before the page is fully loaded -__-

          cy.get(Selectors.ALLOWANCES_TABLE, { timeout: 4_000 }).should('exist');
          cy.wait(100); // Wait for the loading spinner to appear
          cy.get(Selectors.ALLOWANCES_LOADER, { timeout: 60_000 }).should('not.exist'); // Check that the loading spinner is gone
          cy.get(Selectors.CONTROLS_SECTION, { timeout: 4_000 }).should('exist');

          // Check that the number of approvals is the same as the number of approvals on production
          cy.readFile(`cypress/downloads/temp_${chainId}_total_allowances.txt`).then((expectedNumberOfApprovals) => {
            cy.get(Selectors.TOTAL_ALLOWANCES)
              .should('exist')
              .invoke('text')
              .should('equal', expectedNumberOfApprovals);
          });

          cy.readFile(`cypress/downloads/temp_${chainId}_total_rows.txt`).then((expectedNumberOfRows) => {
            cy.get(Selectors.ALLOWANCE_TABLE_ROW).its('length').should('equal', Number(expectedNumberOfRows));
          });
        });
      }
    });
  });
});

// biome-ignore lint/complexity/noUselessEmptyExport lint/suspicious/noExportsInTest: Cypress somehow wants this
export {};
