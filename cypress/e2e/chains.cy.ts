// This is a list of chain name + address tuples. The chain name will be selected in the dropdown, and the address
// entered in the input field. These addresses are either my own address or random addresses that I've found to have
// allowances on these chains. Because these addresses were chosen randomly it is possible that some allowances may

import { ChainId } from '@revoke.cash/chains';
import { Selectors, TEST_URL } from 'cypress/support/utils';
import { ORDERED_CHAINS, SUPPORTED_CHAINS, getChainName } from 'lib/utils/chains';

const TEST_ADDRESSES = {
  // Mainnets
  [ChainId.Abstract]: '0x08A8494EcA0AaA732B6292c23b8904ea627F156b',
  [ChainId.ApeChain]: '0x722E2E4c15bE1fDDEd3C86f4100bC32b181827F5',
  [ChainId.ArbitrumNova]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.ArbitrumOne]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.Astar]: '0xAE545C0d8d4b4645fBA8c895e370529D22F8a71c',
  [ChainId.AstarzkEVM]: '0x1bb33A99dA07048d3CbCEe3098Cb8356209dd1F6',
  [ChainId.AuroraMainnet]: '0x1D50A8c3295798fCebdDD0C720BeC4FBEdc3D178',
  [ChainId['AvalancheC-Chain']]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.Base]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.Beam]: '0xc1447c8c647eF2f564cEAe520E1b65C758A02f9F',
  [ChainId.BitgertMainnet]: '0x6AC875A1C4E12c25265B01C9A2d1112fbb2AdfaF',
  [ChainId.BitlayerMainnet]: '0x862E82662c7Ef7961bD1D8e2D35Ca70cc0B4DFD6',
  [ChainId.BitTorrentChainMainnet]: '0x2d850d18B0617077585F1D0Cba043168dc90954D',
  [ChainId.BitrockMainnet]: '0x818416066d4a69c05046F6f2d43d50E50E46B6cE',
  [ChainId.Blast]: '0x4ff8ff73C5a485ca231Bc79bEd276c162e360C2e',
  [ChainId.BNBSmartChainMainnet]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.BOB]: '0x873D133876cbB180A333393e333DEaA3D373cDd4',
  [ChainId.BobaNetwork]: '0x164EA2CDE6f59F5Fcb76E78d292679B2521C54C2',
  [ChainId.CallistoMainnet]: '0x3Ce5AE5E6762D568fcddB5Beef8B9B666CBa29Bb',
  [ChainId.Canto]: '0xc2Dd41A21BC1fE912cc9a6EECd5f62d1c75fdc9F',
  [ChainId.CeloMainnet]: '0xDa9760828175a7684371321b17e11e823Aa5F4C0',
  [ChainId.ChilizChainMainnet]: '0x466111CB22867851fA667deaeeBe772cE435148b',
  [ChainId.CoinExSmartChainMainnet]: '0x3eC67Dd5060F8657720915B890A36E66B48D36d1',
  [ChainId.CoreBlockchainMainnet]: '0xF29E73EA0d4EF0366D95cF966dA1Dd58C88d916F',
  [ChainId.CrabNetwork]: '0x492Fa13a258d3b3Daf82272be6C7D7db50Be655a',
  [ChainId.CronosMainnet]: '0xB8cAD90CBCb2157d68FD72c43766756cB9bA9B52',
  [ChainId.DarwiniaNetwork]: '0x492Fa13a258d3b3Daf82272be6C7D7db50Be655a',
  [ChainId.DegenChain]: '0x825853aeD453e8C4201adcbaA9384d62ABbD7dEe',
  [ChainId.DogechainMainnet]: '0x544b7Bfd815905fF87a0d25b1Fb109931851fdCc',
  [ChainId.ElastosSmartChain]: '0xA52B02C68cB65083788c46F2c08c6935f0aB19C1',
  [ChainId.ENULSMainnet]: '0x71396287EeDa50fdE667E8c53771682fd74De1Ac',
  [ChainId.EOSEVMNetwork]: '0x74Ab5D0CcDB5A8b8BE357bF395F121E5BcAeB86f',
  [ChainId.EthereumClassic]: '0x8163dB62D6294bA66261644EcCD5FD5269451495',
  // For some reason Cypress doesn't handle kalis.eth on mainnet, works in regular browser though
  [ChainId.EthereumMainnet]: '0xA9a3D92C3aA8CfDA6C5139eCE02401432b91cbB2',
  [ChainId.ExosamaNetwork]: '0xf0dB619363881ceb6bA06b9AE3dd4886652Aa896',
  [ChainId.FantomOpera]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.FlareMainnet]: '0xDDB43EEeA9B5BAe08F4CaB101CB9BEe56D763738',
  [ChainId.Fraxtal]: '0x7041432cd0eF122d646655100FE16c3910473b89',
  [ChainId.FuseMainnet]: '0x291AeAB2C6E8b87A65BE9dF26E174F41864191A3',
  [ChainId.GeistMainnet]: '0x01Bb7B44cc398AaA2b76Ac6253F0F5634279Db9D',
  [ChainId.Gnosis]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.GoldXChainMainnet]: '0xE62864BC4e3075E9E3784CD0586EBA02CEE785d0',
  [ChainId.HarmonyMainnetShard0]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.HorizenEONMainnet]: '0x8b157B3fFEAD48C8a4CDC6bddBE1C1D170049Da4',
  [ChainId.ImmutablezkEVM]: '0xEAf9eaE01b153FAec95A666427391BCcBdAACC18',
  [ChainId.InEVMMainnet]: '0x83c64A707850cE810A5F001dD51142aFf1fC53b9',
  [ChainId.Ink]: '0xB48586959C7A5e5ef1D36A3d3027C11690E0818c',
  [ChainId.IOTAEVM]: '0xdeD212B8BAb662B98f49e757CbB409BB7808dc10',
  [ChainId.KardiaChainMainnet]: '0xc770C26a40F16010a76A5313ffF138B35C69586C',
  [ChainId.Kava]: '0xC7a0407186E949222B4D214C89431a33745e8b8C',
  [ChainId.KCCMainnet]: '0x14A3a2F8894e769A82Fd49df39209e5a82DcAc7C',
  [ChainId.Kroma]: '0xd2Ce219b6bC6264798b4E43b7a98F8735587b87f',
  [ChainId.LightlinkPhoenixMainnet]: '0x64F0CFb19aD0c6E170F0E29c7584F5f22b0C6ec3',
  [ChainId.Linea]: '0xe8Df96a342628B40a0036DB0F182b917403A6D1B',
  [ChainId.Lisk]: '0x893623d575fd7314dfF31Ec28688E6bCf0c7Dc00',
  // [ChainId.LUKSOMainnet]: '0xF001197e5c9a528f0bCC1bE65727De28AB2bB774',
  [ChainId.MantaPacificMainnet]: '0xCd733fEA07B1b68a63B6FFa84ce0d12a94f0Bc22',
  [ChainId.Mantle]: '0xEF12EAA20882A33487Ab069C2E27855aF49D9B16',
  [ChainId.MaxxChainMainnet]: '0x6D3321dc71BeC0ed52bC043F5046439c41AD416D',
  [ChainId.MerlinMainnet]: '0x5A0c529309B7d674960D3E2b449475f1622C4fCf',
  [ChainId.MetisAndromedaMainnet]: '0x50E92fd1f4A456b6669637635333C6275ada797d',
  [ChainId.MilkomedaC1Mainnet]: '0xa272fBa9033bAB4d6361Fe6EA11D008a6040446c',
  [ChainId.MintMainnet]: '0x0cf19FEAB99a1cdA5e101c1a6689490496aD630A',
  [ChainId.Mode]: '0x0A30C1F21E0268A58327665aA5106a8444c5C21c',
  [ChainId.Moonbeam]: '0x8107b00171a02f83D7a17f62941841C29c3ae60F',
  [ChainId.Moonriver]: '0x8107b00171a02f83D7a17f62941841C29c3ae60F',
  [ChainId.Morph]: '0x82904E95Fd06c2fe9873af6C85ea1b957d70210D',
  [ChainId.Nahmii3Mainnet]: '0x513ae4015edB9E7d6E8C752CB0253675540A5676',
  [ChainId.NeonEVMMainnet]: '0xb0D9a7286659ae4cE9fFADD66Cd89E0B77cE7cE9',
  [ChainId.OasisEmerald]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.OasisSapphire]: '0x25D436EB03b79c818ddb94dB3f0e170706Ff638b',
  [ChainId.OasysMainnet]: '0xf04820Bbc0D6B7F7B1f2fE888E5fc60DF6B61262',
  [ChainId.OctaSpace]: '0x8a6681fb319d009d775FdD7b1b15ad4f2Aad003c',
  [ChainId.OpBNBMainnet]: '0x9bE0B370ECf45528F435c023c92a608b3EbB4A9b',
  [ChainId.OPMainnet]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.Palm]: '0x77564a60d4a1577Ff911B8c24eC5D8a04a71B658',
  [ChainId.PegoNetwork]: '0xDD3B1e1bDD9782E4fCb7364CE5059D79233a25C9',
  [ChainId.PolygonMainnet]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.PolygonzkEVM]: '0xb5026494ea932cBd161c46392ffD7A2855Ca05Af',
  [ChainId.PulseChain]: '0x9c128fFa923B251Fa40F58906034b2DeaE6C3146',
  [ChainId.RARIChainMainnet]: '0xE247B36665d3E1a5B17f0E5F795096ca0015e9d9',
  [ChainId['Re.al']]: '0x39B76a6c3d51e682ECE8760E86ed8DbAc23823FA',
  [ChainId.Redstone]: '0x37c2DD981aC291015DAD1Cf2d4E1eB524Fc64E08',
  [ChainId.RolluxMainnet]: '0x75CCD3a10D9325aE2BF7f59d23A892061952fAF3',
  [ChainId.RootstockMainnet]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.RSS3VSLMainnet]: '0xC7C2f5a9fe35999AA1009139261eB1E563315715',
  [ChainId.RSS3VSLSepoliaTestnet]: '0x2e211B562507169E1C444bA39d77feD711a69A89',
  [ChainId.Sanko]: '0x52daaBF8D7fB9b561476faA8bE58a1Cf25910bF5',
  [ChainId.Scroll]: '0x509Ec750cAB3C6ae4989d93E1A14cbcbbF8972C9',
  [ChainId.SeiNetwork]: '0x98792117648ADf88f1c71d029Ea1aaA9E9Cc0AC7',
  [ChainId.Shape]: '0x93dD77Cd83436ac7B9826BfC88631a18b6E8042D',
  [ChainId.Shibarium]: '0x8fA1F2969082a8d141DA3f0DD06D308C783fe7bB',
  [ChainId.Shiden]: '0xD377cFFCc52C16bF6e9840E77F78F42Ddb946568',
  [ChainId.ShimmerEVM]: '0xAc4682eF9fE8c62980cd8bd8d8a3Bb100FD652e7',
  [ChainId.Soneium]: '0x351F34efCE7BBF960da2ca61130a89bF41471047',
  [ChainId.SonicMainnet]: '0xA93093fc1D0343298966E1F971fAE10a7a629296',
  [ChainId['SongbirdCanary-Network']]: '0x4E8De52271D3bE18cC972af892198103C1e6AfE8',
  [ChainId.StoryOdysseyTestnet]: '0x2343bcb7f864D6e2880b3510492dc3da33E75f14',
  [ChainId.SyscoinMainnet]: '0xc594AE94f7C98d759Ed4c792F5DbFB7285184044',
  [ChainId.TaikoMainnet]: '0xCC16b73b315d511Dd3D8E4DF2e02aE97bB6b3647',
  [ChainId.Vana]: '0xaF9834fC71598c731F2F5a2d04Ce1401a6F3e883',
  [ChainId.VelasEVMMainnet]: '0x11Edb7F25eDD88713db6DAe0bf2BF653b288c8aD',
  [ChainId.Viction]: '0x2CB38284290009Bb9557821300CA1eA5E32c01ad',
  [ChainId.Wanchain]: '0xc0E5427A96879653cd8Fd1CB57CE469649f8B8d6',
  [ChainId['WEMIX3.0Mainnet']]: '0x77B7bAC5413F52fbc6db2E8C0a177F8b69Dcbf02',
  [ChainId.WorldChain]: '0x6A9Cf2489cA50c5dAe3b31cddace1D8c9096630b',
  [ChainId.XDCNetwork]: '0x87dB6eA45E2F960A4DDFCfcef86264CdA78fF5E5',
  [ChainId.XLayerMainnet]: '0x22dF8f85AD9850151582F89E37237Bf0517f87DD',
  [ChainId.ZetaChainMainnet]: '0xc9636B935FB6b3Ce48654a0009755D58F473c064',
  [ChainId.ZERONetwork]: '0x37D2098459efC343e157cb43a79f8AEDfa6B1a3c',
  [ChainId.ZircuitMainnet]: '0x0E276aB356FC73093Ba530dFFa3445786cD859f8',
  [ChainId.ZKFairMainnet]: '0xb0240794108Fd89C99BB828C9eBc0e7d9703C2f8',
  [ChainId.ZkLinkNovaMainnet]: '0x303733613868BF605C6fd343a757829EaA0598f0',
  [ChainId.ZkSyncMainnet]: '0x82FdF36736f3f8eE6f04Ab96eA32213c8d826FaA',
  [ChainId.Zora]: '0x061EFb2DF7767D6e63529BA99394037d4dCa39D6',
  // Testnets
  [ChainId.AbstractSepoliaTestnet]: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
  [ChainId.Amoy]: '0x57BD9b2E821d2bF1f8136026ba3A29848eff9e47',
  [ChainId.ArbitrumSepolia]: '0xDd3287043493E0a08d2B348397554096728B459c',
  [ChainId.AvalancheFujiTestnet]: '0x4D915A2f0a2c94b159b69D36bc26338E0ef8E3F6',
  [ChainId.BaseSepoliaTestnet]: '0xF85A57d965aEcD289c625Cae6161d0Ab5141bC66',
  [ChainId.BeamTestnet]: '0xc1447c8c647eF2f564cEAe520E1b65C758A02f9F',
  [ChainId.BerachainbArtio]: '0xF81b9D1d7e50De9c9D0948815d87519BEb087A94',
  [ChainId.BlastSepoliaTestnet]: '0x01208040F4DB383c9f73C023d3c00a5F15bE5bCa',
  [ChainId.BNBSmartChainTestnet]: '0x40FE4911704f14f409ebEE40475377720C732803',
  [ChainId.CeloAlfajoresTestnet]: '0x486FCa950d82e45e8e6863Fac4d22e0Db1359618',
  [ChainId.CoinExSmartChainTestnet]: '0x5B82588003Ac9db7510702171b94f4acAF87Ca72',
  [ChainId.CreatorChainTestnet]: '0xF5c6d262ec83658D2Aa1ceCC5092ad9F0d981eE2',
  [ChainId.CronosTestnet]: '0x06B2fAe81d5c71F31e3b5266502a779a0D8fC85f',
  [ChainId.FraxtalTestnet]: '0x3289CAbF6FB3435dc645e1e204Ec663456d14ADD',
  [ChainId.FantomTestnet]: '0x9F3A5A019Bd9eE3504F6AfD5Cf96B920aA83c4AF',
  [ChainId.Holesky]: '0x5A8ec40549AebF0E3Fb9d59bCE57b2AfE4d5eDda',
  [ChainId.HorizenGobiTestnet]: '0xbc6b540c8F7fCEC60b89342E65c14cb38CDcAb32',
  [ChainId.IOTAEVMTestnet]: '0xdeD212B8BAb662B98f49e757CbB409BB7808dc10',
  [ChainId.KromaSepolia]: '0x9c9eCFf9f7a4A15BA3554e1c10E576441267063b',
  [ChainId.LineaSepolia]: '0x7061146B49427143FfF175e9C1bF7461630302fF',
  // [ChainId.LUKSOTestnet]: '0xBdDDd277583DCaE0B501046ba86714FEea71B03F',
  [ChainId.MantleSepoliaTestnet]: '0x519a89Daa5d3291730a037B94025ab46425c4003',
  [ChainId.MoonbaseAlpha]: '0xeE146d0808D6a874237701E06A118f444dB13D73',
  [ChainId.MorphHolesky]: '0xA134B3B2F11B861953FF569Be3D0111d997cD537',
  [ChainId.OPSepoliaTestnet]: '0xDd3287043493E0a08d2B348397554096728B459c',
  [ChainId.PolygonzkEVMCardonaTestnet]: '0x2a8ecB983ab270cB31077C9ff6b5eC9739b4845f',
  [ChainId.ScrollSepoliaTestnet]: '0xBF1E9dc0f7c2186346544BF985321e179c3d186c',
  [ChainId.Sepolia]: '0x4795680d9c1C108Ccd0EEA27dE9AfbC5cae6C54a',
  [ChainId.ShimmerEVMTestnet]: '0xecaF55B79fdCf39EF23715cD8dE539C8E58e9119',
  [ChainId.SyscoinTanenbaumTestnet]: '0x2FB7aB1E0357D595877209e74a715D0F5816cC29',
  [ChainId.TabiTestnet]: '0x8450D6fd16048e21996B43c7a63A88A80187ce61',
  [ChainId.TaikoHeklaL2]: '0x5B9a8ADcd12568D0C17A89f8bb2306B1765B5cBc',
  [ChainId.ZetaChainTestnet]: '0x9500c80384DCAd166b1DC345eBa0B53dC21F5131',
  [ChainId.ZkSyncSepoliaTestnet]: '0x46D8e47b9A6487FDAB0a700b269A452cFeED49Aa',
} as const;

describe(`Chain Support (${TEST_URL})`, () => {
  it('should have a test for every item in the chain selection dropdown menu', () => {
    cy.visit(`${TEST_URL}/address/0xe126b3E5d052f1F575828f61fEBA4f4f2603652a`, { timeout: 10_000 });
    cy.wait(1000); // Since App Router we now need this delay before the page is fully loaded -__-
    cy.get(Selectors.CHAIN_SELECT_BUTTON).should('exist').click();

    const fixtureChainNames = ORDERED_CHAINS.map((chainId) => getChainName(chainId));
    const appChainNames = cy.get(Selectors.CHAIN_SELECT_OPTION).should('have.length', fixtureChainNames.length);
    appChainNames.each((chain) => cy.wrap(chain).invoke('text').should('be.oneOf', fixtureChainNames));

    ORDERED_CHAINS.forEach((chainId) => {
      cy.wrap(getChainName(chainId)).should('not.be.empty');
      cy.wrap(TEST_ADDRESSES[chainId]).should('not.be.empty');
    });

    cy.wrap(SUPPORTED_CHAINS.sort()).should('deep.equal', ORDERED_CHAINS.sort());
  });

  ORDERED_CHAINS.forEach((chainId) => {
    const chainName = getChainName(chainId);
    const fixtureAddress = TEST_ADDRESSES[chainId];

    // Skip PulseChain because it is too slow, causing failures
    const describeFunction = chainId === ChainId.PulseChain ? describe.skip : describe;

    describeFunction(chainName, () => {
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
