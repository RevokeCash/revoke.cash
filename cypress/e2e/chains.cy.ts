// This is a list of chain name + address tuples. The chain name will be selected in the dropdown, and the address
// entered in the input field. These addresses are either my own address or random addresses that I've found to have
// allowances on these chains. Because these addresses were chosen randomly it is possible that some allowances may

import { Selectors, TEST_URL } from 'cypress/support/utils';
import {
  ETHERSCAN_SUPPORTED_CHAINS,
  SUPPORTED_CHAINS,
  getChainApiUrl,
  getChainExplorerUrl,
  getChainLogo,
  getChainLogsRpcUrl,
  getChainName,
  getChainNativeToken,
  getChainRpcUrl,
  getChainSlug,
} from 'lib/utils/chains';

// get revoked, causing the tests to fail. In that case we need to replace the address with a new one.
const fixtures = [
  // For some reason Cypress doesn't handle kalis.eth on mainnet, works in regular browser though
  ['Ethereum', '0xA9a3D92C3aA8CfDA6C5139eCE02401432b91cbB2'],
  ['BNB Chain', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  ['Avalanche', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  ['Polygon', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  ['Polygon zkEVM', '0x16959Ac6E43f509F9d16De76B3B6f60D908BF816'],
  ['Arbitrum', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  ['Arbitrum Nova', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  ['Optimism', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  ['zkSync Era', '0x82FdF36736f3f8eE6f04Ab96eA32213c8d826FaA'],
  ['Base', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  ['Linea', '0xe8Df96a342628B40a0036DB0F182b917403A6D1B'],
  ['Cronos', '0xB8cAD90CBCb2157d68FD72c43766756cB9bA9B52'],
  ['Fantom', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  ['Kava', '0xC7a0407186E949222B4D214C89431a33745e8b8C'],
  ['Gnosis', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  ['Canto', '0xc2Dd41A21BC1fE912cc9a6EECd5f62d1c75fdc9F'],
  ['Aurora', '0x1D50A8c3295798fCebdDD0C720BeC4FBEdc3D178'],
  ['Celo', '0xDa9760828175a7684371321b17e11e823Aa5F4C0'],
  ['Moonbeam', '0x8107b00171a02f83D7a17f62941841C29c3ae60F'],
  ['Moonriver', '0x8107b00171a02f83D7a17f62941841C29c3ae60F'],
  ['Rootstock', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  ['Dogechain', '0x544b7Bfd815905fF87a0d25b1Fb109931851fdCc'],
  ['KCC', '0x14A3a2F8894e769A82Fd49df39209e5a82DcAc7C'],
  ['Metis', '0x50E92fd1f4A456b6669637635333C6275ada797d'],
  ['Astar', '0xAE545C0d8d4b4645fBA8c895e370529D22F8a71c'],
  ['Oasis Emerald', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  ['CORE', '0xF29E73EA0d4EF0366D95cF966dA1Dd58C88d916F'],
  ['Harmony', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  ['Godwoken', '0x8c0f57b0D6a2D0Bfac7fe8fea6a0C4e8DdBbDCB1'],
  ['SmartBCH', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  ['Songbird', '0x4E8De52271D3bE18cC972af892198103C1e6AfE8'],
  ['Boba', '0x164EA2CDE6f59F5Fcb76E78d292679B2521C54C2'],
  ['Fuse', '0x291AeAB2C6E8b87A65BE9dF26E174F41864191A3'],
  ['Evmos', '0x8d354807f14fd6f006ac959AB4A2A9c13FA5484a'],
  ['Syscoin', '0xc594AE94f7C98d759Ed4c792F5DbFB7285184044'],
  ['Callisto', '0x3Ce5AE5E6762D568fcddB5Beef8B9B666CBa29Bb'],
  ['Nahmii', '0xd342d75FE943AD8b92594BAeC3A7f86E5dF0BEb6'],
  ['Ethereum Classic', '0x8163dB62D6294bA66261644EcCD5FD5269451495'],
  ['BTT Chain', '0x2d850d18B0617077585F1D0Cba043168dc90954D'],
  ['CoinEx Smart Chain', '0x3eC67Dd5060F8657720915B890A36E66B48D36d1'],
  ['Flare', '0xDDB43EEeA9B5BAe08F4CaB101CB9BEe56D763738'],
  ['Shiden', '0xD377cFFCc52C16bF6e9840E77F78F42Ddb946568'],
  ['PulseChain', '0x9c128fFa923B251Fa40F58906034b2DeaE6C3146'],
  ['Oasys', '0xf04820Bbc0D6B7F7B1f2fE888E5fc60DF6B61262'],
  ['Palm', '0x77564a60d4a1577Ff911B8c24eC5D8a04a71B658'],
  ['Exosama', '0xf0dB619363881ceb6bA06b9AE3dd4886652Aa896'],
  ['Redlight', '0xfE294d4CfA1F3b57b902d60c17B583DED8C519bb'],
  ['Wanchain', '0x208B907d345c0E79cEAfF30BBe925c29da1D78C0'],
  ['ENULS', '0x71396287EeDa50fdE667E8c53771682fd74De1Ac'],
  ['Horizen EON', '0x8b157B3fFEAD48C8a4CDC6bddBE1C1D170049Da4'],
  ['Mantle', '0xEF12EAA20882A33487Ab069C2E27855aF49D9B16'],
  ['Zora', '0x061EFb2DF7767D6e63529BA99394037d4dCa39D6'],
  // ['Gather', '0x50c302E717552C1a199cD5a2f304781C03E24804'],
  ['Goerli', '0xFCBD25BB345765192fFC2f2E35F1F5348badC3F6'],
  ['Sepolia', '0x4795680d9c1C108Ccd0EEA27dE9AfbC5cae6C54a'],
  ['BNB Chain Testnet', '0x40FE4911704f14f409ebEE40475377720C732803'],
  ['Avalanche Fuji', '0x4D915A2f0a2c94b159b69D36bc26338E0ef8E3F6'],
  ['Polygon Mumbai', '0x61bEE7b65F860Fe5a22958421b0a344a0F146983'],
  ['Polygon zkEVM Testnet', '0xe9Cc1396bcbB6e1168d731347F376A2d5709B42a'],
  ['Arbitrum Goerli', '0x3383A622FA7a30fC83527d6ce1820af928455EA8'],
  ['Optimism Goerli', '0x3239a95A9262034ca28b9a03133775f716f119f8'],
  ['zkSync Era Goerli', '0xa1c7c279c232f36a16f5FB556fDE14E6103E6E24'],
  ['Linea Goerli', '0x444111CD376893AFCd7405239CE72b64d5A22958'],
  ['Scroll Alpha', '0x444111CD376893AFCd7405239CE72b64d5A22958'],
  ['Base Goerli', '0xDEA7DBE814dc0B13C57ed78ff2b3B3cc8Efab4be'],
  ['Taiko Grimsvotn', '0xc3f86b0181e7E2bdf8224271839f8DdaC56574F0'],
  ['Cronos Testnet', '0x06B2fAe81d5c71F31e3b5266502a779a0D8fC85f'],
  ['Fantom Testnet', '0x9F3A5A019Bd9eE3504F6AfD5Cf96B920aA83c4AF'],
  ['Celo Alfajores', '0x486FCa950d82e45e8e6863Fac4d22e0Db1359618'],
  ['Moonbase Alpha', '0xeE146d0808D6a874237701E06A118f444dB13D73'],
  ['CoinEx Testnet', '0x5B82588003Ac9db7510702171b94f4acAF87Ca72'],
  ['Syscoin Tanenbaum', '0x2FB7aB1E0357D595877209e74a715D0F5816cC29'],
  ['Horizen Gobi', '0xbc6b540c8F7fCEC60b89342E65c14cb38CDcAb32'],
  ['PulseChain Testnet', '0xc068aEAdc48427fde985866DAa3e52D4d63935C3'],
  ['Gather Testnet', '0x50c302E717552C1a199cD5a2f304781C03E24804'],
  ['Shimmer Testnet', '0xecaF55B79fdCf39EF23715cD8dE539C8E58e9119'],
  ['ZetaChain Athens', '0x9500c80384DCAd166b1DC345eBa0B53dC21F5131'],
  ['Mantle Testnet', '0x868A8Da54f817A1FDf4cE2ba8dBa3ef61e9DE610'],
];

describe('Chain Support', () => {
  it('should have full data for every supported chain', () => {
    SUPPORTED_CHAINS.forEach((chainId) => {
      cy.wrap(getChainName(chainId)).should('not.be.empty');
      cy.wrap(getChainExplorerUrl(chainId)).should('not.be.empty');
      cy.wrap(getChainRpcUrl(chainId)).should('not.be.empty');
      cy.wrap(getChainLogsRpcUrl(chainId)).should('not.be.empty');
      cy.wrap(getChainLogo(chainId)).should('not.be.empty');
      cy.wrap(getChainNativeToken(chainId)).should('not.be.empty');
      cy.wrap(getChainSlug(chainId)).should('not.be.empty');
    });

    ETHERSCAN_SUPPORTED_CHAINS.forEach((chainId) => {
      cy.wrap(getChainApiUrl(chainId)).should('not.be.empty');
    });
  });

  it('should have a test for every item in the chain selection dropdown menu', () => {
    cy.visit(`${TEST_URL}/address/0xe126b3E5d052f1F575828f61fEBA4f4f2603652a`, { timeout: 10_000 });
    cy.get(Selectors.CHAIN_SELECT_BUTTON).should('exist').click();

    const fixtureChainNames = fixtures.map(([chainName]) => chainName);
    const appChainNames = cy.get(Selectors.CHAIN_SELECT_OPTION).should('have.length', fixtureChainNames.length);
    appChainNames.each((chain) => cy.wrap(chain).invoke('text').should('be.oneOf', fixtureChainNames));
  });

  fixtures.forEach(([chainName, fixtureAddress]) => {
    it(`should support ${chainName}`, () => {
      cy.visit(`${TEST_URL}/address/${fixtureAddress}`, { timeout: 10_000 });

      cy.get(Selectors.CHAIN_SELECT_BUTTON).click();
      cy.get(Selectors.CHAIN_SELECT_OPTION).contains(chainName).click();

      cy.get(Selectors.ALLOWANCES_TABLE, { timeout: 4_000 }).should('exist');
      cy.wait(100); // Wait for the loading spinner to appear
      cy.get(Selectors.ALLOWANCES_LOADER, { timeout: 60_000 }).should('not.exist'); // Check that the loading spinner is gone
      cy.get(Selectors.CONTROLS_SECTION, { timeout: 4_000 }).should('exist');

      const shouldCheckExplorer = Boolean(Cypress.env('checkExplorer'));
      if (shouldCheckExplorer) {
        // To test that the explorer link works, we navigate to the "Last Updated" URL and check that the address is present
        const linkElement = cy.get(Selectors.LAST_UPDATED_LINK).first();
        linkElement.invoke('attr', 'href').then((href) => {
          cy.origin(href, { args: { href, fixtureAddress } }, ({ href, fixtureAddress }) => {
            // Supress errors on the explorer page
            cy.on('uncaught:exception', () => false);

            cy.visit(href);
            cy.get(`a[href*="${fixtureAddress}" i]`, { timeout: 10_000 }).should('exist');
          });
        });
      }
    });
  });
});

export {};
