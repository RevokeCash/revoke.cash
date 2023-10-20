// This is a list of chain name + address tuples. The chain name will be selected in the dropdown, and the address
// entered in the input field. These addresses are either my own address or random addresses that I've found to have
// allowances on these chains. Because these addresses were chosen randomly it is possible that some allowances may

import { ChainId } from '@revoke.cash/chains';
import { Selectors, TEST_URL } from 'cypress/support/utils';
import {
  ETHERSCAN_SUPPORTED_CHAINS,
  ORDERED_CHAINS,
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

const TEST_ADDRESSES = {
  // Mainnets
  [ChainId.ArbitrumNova]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.ArbitrumOne]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.Astar]: '0xAE545C0d8d4b4645fBA8c895e370529D22F8a71c',
  [ChainId.AuroraMainnet]: '0x1D50A8c3295798fCebdDD0C720BeC4FBEdc3D178',
  [ChainId['AvalancheC-Chain']]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.Base]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.BitgertMainnet]: '0x6AC875A1C4E12c25265B01C9A2d1112fbb2AdfaF',
  [ChainId.BitTorrentChainMainnet]: '0x2d850d18B0617077585F1D0Cba043168dc90954D',
  [ChainId.BNBSmartChainMainnet]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.BobaNetwork]: '0x164EA2CDE6f59F5Fcb76E78d292679B2521C54C2',
  [ChainId.CallistoMainnet]: '0x3Ce5AE5E6762D568fcddB5Beef8B9B666CBa29Bb',
  [ChainId.Canto]: '0xc2Dd41A21BC1fE912cc9a6EECd5f62d1c75fdc9F',
  [ChainId.CeloMainnet]: '0xDa9760828175a7684371321b17e11e823Aa5F4C0',
  [ChainId.CoinExSmartChainMainnet]: '0x3eC67Dd5060F8657720915B890A36E66B48D36d1',
  [ChainId.CoreBlockchainMainnet]: '0xF29E73EA0d4EF0366D95cF966dA1Dd58C88d916F',
  [ChainId.CronosMainnet]: '0xB8cAD90CBCb2157d68FD72c43766756cB9bA9B52',
  [ChainId.DogechainMainnet]: '0x544b7Bfd815905fF87a0d25b1Fb109931851fdCc',
  [ChainId.ElastosSmartChain]: '0xA52B02C68cB65083788c46F2c08c6935f0aB19C1',
  [ChainId.ENULSMainnet]: '0x71396287EeDa50fdE667E8c53771682fd74De1Ac',
  [ChainId.EthereumClassicMainnet]: '0x8163dB62D6294bA66261644EcCD5FD5269451495',
  // For some reason Cypress doesn't handle kalis.eth on mainnet, works in regular browser though
  [ChainId.EthereumMainnet]: '0xA9a3D92C3aA8CfDA6C5139eCE02401432b91cbB2',
  [ChainId.Evmos]: '0x8d354807f14fd6f006ac959AB4A2A9c13FA5484a',
  [ChainId.ExosamaNetwork]: '0xf0dB619363881ceb6bA06b9AE3dd4886652Aa896',
  [ChainId.FantomOpera]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.FlareMainnet]: '0xDDB43EEeA9B5BAe08F4CaB101CB9BEe56D763738',
  [ChainId.FuseMainnet]: '0x291AeAB2C6E8b87A65BE9dF26E174F41864191A3',
  [ChainId.Gnosis]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.HarmonyMainnetShard0]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.HorizenEONMainnet]: '0x8b157B3fFEAD48C8a4CDC6bddBE1C1D170049Da4',
  [ChainId.KardiaChainMainnet]: '0xc770C26a40F16010a76A5313ffF138B35C69586C',
  [ChainId.Kava]: '0xC7a0407186E949222B4D214C89431a33745e8b8C',
  [ChainId.KCCMainnet]: '0x14A3a2F8894e769A82Fd49df39209e5a82DcAc7C',
  [ChainId.Linea]: '0xe8Df96a342628B40a0036DB0F182b917403A6D1B',
  [ChainId.MantaPacificMainnet]: '0xCd733fEA07B1b68a63B6FFa84ce0d12a94f0Bc22',
  [ChainId.Mantle]: '0xEF12EAA20882A33487Ab069C2E27855aF49D9B16',
  [ChainId.MaxxChainMainnet]: '0x6D3321dc71BeC0ed52bC043F5046439c41AD416D',
  [ChainId.MetisAndromedaMainnet]: '0x50E92fd1f4A456b6669637635333C6275ada797d',
  [ChainId.MilkomedaC1Mainnet]: '0xa272fBa9033bAB4d6361Fe6EA11D008a6040446c',
  [ChainId.Moonbeam]: '0x8107b00171a02f83D7a17f62941841C29c3ae60F',
  [ChainId.Moonriver]: '0x8107b00171a02f83D7a17f62941841C29c3ae60F',
  [ChainId.NahmiiMainnet]: '0xd342d75FE943AD8b92594BAeC3A7f86E5dF0BEb6',
  [ChainId.OasisEmerald]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.OasysMainnet]: '0xf04820Bbc0D6B7F7B1f2fE888E5fc60DF6B61262',
  [ChainId.OctaSpace]: '0x8a6681fb319d009d775FdD7b1b15ad4f2Aad003c',
  [ChainId.OpBNBMainnet]: '0x9bE0B370ECf45528F435c023c92a608b3EbB4A9b',
  [ChainId.OPMainnet]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.Palm]: '0x77564a60d4a1577Ff911B8c24eC5D8a04a71B658',
  [ChainId.PegoNetwork]: '0xDD3B1e1bDD9782E4fCb7364CE5059D79233a25C9',
  [ChainId.PolygonMainnet]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.PolygonzkEVM]: '0x16959Ac6E43f509F9d16De76B3B6f60D908BF816',
  [ChainId.PulseChain]: '0x9c128fFa923B251Fa40F58906034b2DeaE6C3146',
  [ChainId.RedlightChainMainnet]: '0xfE294d4CfA1F3b57b902d60c17B583DED8C519bb',
  [ChainId.RolluxMainnet]: '0x75CCD3a10D9325aE2BF7f59d23A892061952fAF3',
  [ChainId.RootstockMainnet]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.Scroll]: '0x509Ec750cAB3C6ae4989d93E1A14cbcbbF8972C9',
  [ChainId.Shibarium]: '0x8fA1F2969082a8d141DA3f0DD06D308C783fe7bB',
  [ChainId.Shiden]: '0xD377cFFCc52C16bF6e9840E77F78F42Ddb946568',
  [ChainId.ShimmerEVMMainnet]: '0xAc4682eF9fE8c62980cd8bd8d8a3Bb100FD652e7',
  [ChainId['SongbirdCanary-Network']]: '0x4E8De52271D3bE18cC972af892198103C1e6AfE8',
  [ChainId.SyscoinMainnet]: '0xc594AE94f7C98d759Ed4c792F5DbFB7285184044',
  [ChainId.VelasEVMMainnet]: '0x11Edb7F25eDD88713db6DAe0bf2BF653b288c8aD',
  [ChainId.Wanchain]: '0x208B907d345c0E79cEAfF30BBe925c29da1D78C0',
  [ChainId['WEMIX3.0Mainnet']]: '0x77B7bAC5413F52fbc6db2E8C0a177F8b69Dcbf02',
  [ChainId.XinFinXDCNetwork]: '0x87dB6eA45E2F960A4DDFCfcef86264CdA78fF5E5',
  [ChainId.ZkSyncEraMainnet]: '0x82FdF36736f3f8eE6f04Ab96eA32213c8d826FaA',
  [ChainId.Zora]: '0x061EFb2DF7767D6e63529BA99394037d4dCa39D6',
  // Testnets
  [ChainId.ArbitrumGoerli]: '0x3383A622FA7a30fC83527d6ce1820af928455EA8',
  [ChainId.AvalancheFujiTestnet]: '0x4D915A2f0a2c94b159b69D36bc26338E0ef8E3F6',
  [ChainId.BaseGoerliTestnet]: '0xDEA7DBE814dc0B13C57ed78ff2b3B3cc8Efab4be',
  [ChainId.BNBSmartChainTestnet]: '0x40FE4911704f14f409ebEE40475377720C732803',
  [ChainId.CeloAlfajoresTestnet]: '0x486FCa950d82e45e8e6863Fac4d22e0Db1359618',
  [ChainId.CoinExSmartChainTestnet]: '0x5B82588003Ac9db7510702171b94f4acAF87Ca72',
  [ChainId.CronosTestnet]: '0x06B2fAe81d5c71F31e3b5266502a779a0D8fC85f',
  [ChainId.FantomTestnet]: '0x9F3A5A019Bd9eE3504F6AfD5Cf96B920aA83c4AF',
  [ChainId.GatherTestnetNetwork]: '0x50c302E717552C1a199cD5a2f304781C03E24804',
  [ChainId.Goerli]: '0xFCBD25BB345765192fFC2f2E35F1F5348badC3F6',
  [ChainId.HorizenGobiTestnet]: '0xbc6b540c8F7fCEC60b89342E65c14cb38CDcAb32',
  [ChainId.LineaTestnet]: '0x444111CD376893AFCd7405239CE72b64d5A22958',
  [ChainId.MantleTestnet]: '0x868A8Da54f817A1FDf4cE2ba8dBa3ef61e9DE610',
  [ChainId.MoonbaseAlpha]: '0xeE146d0808D6a874237701E06A118f444dB13D73',
  [ChainId.Mumbai]: '0x61bEE7b65F860Fe5a22958421b0a344a0F146983',
  [ChainId.OptimismGoerliTestnet]: '0x3239a95A9262034ca28b9a03133775f716f119f8',
  [ChainId.PolygonzkEVMTestnet]: '0xe9Cc1396bcbB6e1168d731347F376A2d5709B42a',
  [ChainId.PulseChainTestnetv4]: '0xc068aEAdc48427fde985866DAa3e52D4d63935C3',
  [ChainId.ScrollSepoliaTestnet]: '0xBF1E9dc0f7c2186346544BF985321e179c3d186c',
  [ChainId.Sepolia]: '0x4795680d9c1C108Ccd0EEA27dE9AfbC5cae6C54a',
  [ChainId.ShimmerEVMTestnet]: '0xecaF55B79fdCf39EF23715cD8dE539C8E58e9119',
  [ChainId.SyscoinTanenbaumTestnet]: '0x2FB7aB1E0357D595877209e74a715D0F5816cC29',
  [ChainId.TaikoJolnirL2]: '0xe5fC964C4b03BC7B84adc3A18Fc93bfe54c6EabB',
  [ChainId.ZetaChainAthens3Testnet]: '0x9500c80384DCAd166b1DC345eBa0B53dC21F5131',
  [ChainId.ZkSyncEraTestnet]: '0xa1c7c279c232f36a16f5FB556fDE14E6103E6E24',
} as const;

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

    const fixtureChainNames = SUPPORTED_CHAINS.map((chainId) => getChainName(chainId));
    const appChainNames = cy.get(Selectors.CHAIN_SELECT_OPTION).should('have.length', fixtureChainNames.length);
    appChainNames.each((chain) => cy.wrap(chain).invoke('text').should('be.oneOf', fixtureChainNames));

    SUPPORTED_CHAINS.forEach((chainId) => {
      cy.wrap(getChainName(chainId)).should('not.be.empty');
      cy.wrap(TEST_ADDRESSES[chainId]).should('not.be.empty');
    });
  });

  ORDERED_CHAINS.forEach((chainId) => {
    const chainName = getChainName(chainId);
    const fixtureAddress = TEST_ADDRESSES[chainId];

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
