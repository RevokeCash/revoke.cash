import { ChainId } from '@revoke.cash/core/chains/ids';
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

// This depends on me keeping open approvals to these spenders. Permit2 comes from an all-chains label (chain 0),
// OpenSea, Uniswap and SushiSwap from chain labels and 'OpenSea (old)' from the name of revoke.cash's own spender check
const LABEL_FIXTURES = ['OpenSea', 'OpenSea (old)', 'Permit2', 'Uniswap', 'SushiSwap'];

const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

const getLabelUrl = (labelType: 'spenders' | 'tokens', chainId: number, address: string) => {
  return `${TEST_URL}/generated/${labelType}/${chainId}/${address}.json`;
};

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

  describe('Public label routes', () => {
    it('should return the USDT token label', () => {
      cy.request(getLabelUrl('tokens', ChainId.Ethereum, USDT_ADDRESS)).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body.symbol).to.be.a('string').and.not.be.empty;
        expect(response.body.decimals).to.equal(6);
        expect(response.body.logoURI).to.be.a('string').and.not.be.empty;
      });
    });

    [ChainId.Ethereum, ChainId.KasplexZkEVM].forEach((chainId) => {
      it(`should return the Permit2 spender label on chain ${chainId}`, () => {
        cy.request(getLabelUrl('spenders', chainId, PERMIT2_ADDRESS)).then((response) => {
          expect(response.status).to.equal(200);
          expect(response.body.name).to.equal('Permit2');
        });
      });
    });

    it('should return the same body for a lowercase path', () => {
      cy.request(getLabelUrl('tokens', ChainId.Ethereum, USDT_ADDRESS)).then((checksummedResponse) => {
        cy.request(getLabelUrl('tokens', ChainId.Ethereum, USDT_ADDRESS.toLowerCase())).then((lowercaseResponse) => {
          expect(lowercaseResponse.status).to.equal(200);
          expect(lowercaseResponse.body).to.deep.equal(checksummedResponse.body);
        });
      });
    });

    it('should return an empty object for a random address', () => {
      const randomAddress = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      cy.request(getLabelUrl('spenders', ChainId.Ethereum, randomAddress)).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.deep.equal({});
      });
    });

    it('should allow requests from any origin', () => {
      cy.request(getLabelUrl('spenders', ChainId.Ethereum, PERMIT2_ADDRESS)).then((response) => {
        expect(response.headers['access-control-allow-origin']).to.equal('*');
      });
    });
  });
});
