// This is a list of chain name + address tuples. The chain name will be selected in the dropdown, and the address
// entered in the input field. These addresses are either my own address or random addresses that I've found to have
// allowances on these chains. Because these addresses were chosen randomly it is possible that some allowances may
// get revoked, causing the tests to fail. In that case we need to replace the address with a new one.
const fixtures = [
  // For some reason Cypress doesn't handle kalis.eth on mainnet, works in regular browser though
  ['Ethereum', '0xA9a3D92C3aA8CfDA6C5139eCE02401432b91cbB2'],
  ['Binance Smart Chain', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  ['Avalanche', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  ['Polygon', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  ['Arbitrum', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  ['Arbitrum Nova', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  ['Optimism', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  ['Cronos', '0xB8cAD90CBCb2157d68FD72c43766756cB9bA9B52'],
  ['Fantom', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  ['Kava', '0xC7a0407186E949222B4D214C89431a33745e8b8C'],
  ['Gnosis', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  ['Canto', '0xc2Dd41A21BC1fE912cc9a6EECd5f62d1c75fdc9F'],
  ['Aurora', '0x1D50A8c3295798fCebdDD0C720BeC4FBEdc3D178'],
  ['Celo', '0xDa9760828175a7684371321b17e11e823Aa5F4C0'],
  ['Moonbeam', '0x8107b00171a02f83D7a17f62941841C29c3ae60F'],
  ['Moonriver', '0x8107b00171a02f83D7a17f62941841C29c3ae60F'],
  ['RSK', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  ['Metis', '0x50E92fd1f4A456b6669637635333C6275ada797d'],
  ['Astar', '0xAE545C0d8d4b4645fBA8c895e370529D22F8a71c'],
  ['IoTeX', '0x936f83c34ba628aa08e54bc8f6f9f357a0f65d80'],
  ['Oasis Emerald', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  ['Harmony', '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a'],
  // ['Dogechain', '0x544b7Bfd815905fF87a0d25b1Fb109931851fdCc'],
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
  ['Palm', '0x77564a60d4a1577Ff911B8c24eC5D8a04a71B658'],
  ['Exosama', '0xf0dB619363881ceb6bA06b9AE3dd4886652Aa896'],
  ['Proof of Memes', '0xe8509b1F74f2024AB52f423A6568ed5aaCE87C32'],
  ['Goerli', '0xFCBD25BB345765192fFC2f2E35F1F5348badC3F6'],
  ['Sepolia', '0x4795680d9c1C108Ccd0EEA27dE9AfbC5cae6C54a'],
  ['BSC Testnet', '0x40FE4911704f14f409ebEE40475377720C732803'],
  ['Avalanche Fuji', '0x4D915A2f0a2c94b159b69D36bc26338E0ef8E3F6'],
  ['Polygon Mumbai', '0x61bEE7b65F860Fe5a22958421b0a344a0F146983'],
  ['Arbitrum Goerli', '0x3383A622FA7a30fC83527d6ce1820af928455EA8'],
  ['Optimism Goerli', '0x3239a95A9262034ca28b9a03133775f716f119f8'],
  ['Cronos Testnet', '0x06B2fAe81d5c71F31e3b5266502a779a0D8fC85f'],
  ['Fantom Testnet', '0x9F3A5A019Bd9eE3504F6AfD5Cf96B920aA83c4AF'],
  ['Celo Alfajores', '0x486FCa950d82e45e8e6863Fac4d22e0Db1359618'],
  ['Moonbase Alpha', '0xeE146d0808D6a874237701E06A118f444dB13D73'],
  ['CoinEx Testnet', '0x5B82588003Ac9db7510702171b94f4acAF87Ca72'],
  ['Syscoin Tenenbaum', '0x2FB7aB1E0357D595877209e74a715D0F5816cC29'],
];

const Selectors = {
  CHAIN_SELECT_BUTTON: '.chain-select__control',
  CHAIN_SELECT_OPTION: '.chain-select__option',
  ALLOWANCES_TABLE: '.allowances-table',
  ALLOWANCES_LOADER: '.allowances-loader',
  CONTROLS_SECTION: '.controls-section',
  ADDRESS_INPUT: '.address-input',
};

const URL = Cypress.env('url') ?? 'http://localhost:3000';

describe('Chain Support', () => {
  it('should have a test for every item in the chain selection dropdown menu', () => {
    cy.visit(`${URL}/address/0xe126b3E5d052f1F575828f61fEBA4f4f2603652a`, { timeout: 10_000 });
    cy.get(Selectors.CHAIN_SELECT_BUTTON).should('exist').click();

    const fixtureChainNames = fixtures.map(([chainName]) => chainName);
    const appChainNames = cy.get(Selectors.CHAIN_SELECT_OPTION).should('have.length', fixtureChainNames.length);
    appChainNames.each((chain) => cy.wrap(chain).invoke('text').should('be.oneOf', fixtureChainNames));
  });

  fixtures.forEach(([chainName, fixtureAddress]) => {
    it(`should support ${chainName}`, () => {
      cy.visit(`${URL}/address/${fixtureAddress}`, { timeout: 10_000 });

      cy.get(Selectors.CHAIN_SELECT_BUTTON).click();
      cy.get(Selectors.CHAIN_SELECT_OPTION).contains(chainName).click();

      cy.get(Selectors.ALLOWANCES_TABLE, { timeout: 4000 }).should('exist');
      cy.wait(100); // Wait for the loading spinner to appear
      cy.get(Selectors.ALLOWANCES_LOADER, { timeout: 60_000 }).should('not.exist'); // Check that the loading spinner is gone
      cy.get(Selectors.CONTROLS_SECTION, { timeout: 4000 }).should('exist');
    });
  });
});

export {};
