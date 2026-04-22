import { Selectors, TEST_URL } from 'cypress/support/utils';

// This depends on me keeping these domains registered
const RESULTION_FIXTURES = [
  'kalis.eth',
  'kalis.crypto',
  'kalis.avax',
  'KaLiS.ETh',
  'KAlis.cryptO',
  'kALis.AVaX',
  'misTer.blockchAIN',
];

// This depends on people keeping these domains registered
const REVERSE_RESOLUTION_FIXTURES = [
  ['0xe126b3E5d052f1F575828f61fEBA4f4f2603652a', 'kalis.eth'],
  ['0x16959Ac6E43f509F9d16De76B3B6f60D908BF816', 'apocalypticbear.x'],
  ['0xc6fED32F84fca103E946eB21Ad16fD7887a3CEc5', 'coconaut.avax'],
];

// This depends on me keeping open approvals to these spenders
const LABEL_FIXTURES = ['OpenSea', 'OpenSea (old)', 'Permit2', 'Uniswap', 'SushiSwap'];

describe('whois', () => {
  describe('Name resolution', () => {
    RESULTION_FIXTURES.forEach((name) => {
      it(`should resolve ${name} in the search bar`, () => {
        cy.visit(TEST_URL, { timeout: 10_000 });
        cy.get(Selectors.SEARCH_WALLET_INPUT).click().type(name);
        cy.get(Selectors.SEARCH_WALLET_BUTTON).click();
        cy.contains('0xe126b3...03652a', { timeout: 10_000 }).should('exist');
      });

      it(`should resolve ${name} in the URL`, () => {
        cy.visit(`${TEST_URL}/address/${name}`, { timeout: 10_000 });
        cy.contains('0xe126b3...03652a', { timeout: 10_000 }).should('exist');
      });
    });
  });

  describe('Reverse name resolution', () => {
    REVERSE_RESOLUTION_FIXTURES.forEach(([address, name]) => {
      it(`should reverse resolve to ${name}`, () => {
        cy.visit(`${TEST_URL}/address/${address}`, { timeout: 10_000 });
        cy.contains(name, { timeout: 10_000 }).should('exist');
      });
    });
  });

  describe('Spender labels', () => {
    it('should resolve spender labels', () => {
      cy.visit(`${TEST_URL}/address/0xe126b3E5d052f1F575828f61fEBA4f4f2603652a`, { timeout: 10_000 });
      LABEL_FIXTURES.forEach((label) => {
        cy.contains(label, { timeout: 60_000 }).should('exist');
      });
    });
  });
});
