export const TEST_URL = Cypress.env('url') ?? 'http://localhost:3000';

export const Selectors = {
  CHAIN_SELECT_BUTTON: '.control-button-wrapper',
  CHAIN_SELECT_OPTION: '.chain-select__option',
  ALLOWANCES_TABLE: '.allowances-table',
  ALLOWANCES_LOADER: '.allowances-loader',
  CONTROLS_SECTION: '.controls-section',
  LAST_UPDATED_LINK: '.tx-link',
  SEARCH_WALLET_INPUT: '[aria-label="Search Accounts by Address or Domain"]',
  SEARCH_WALLET_BUTTON: '[aria-label="Check Address"]',
};
