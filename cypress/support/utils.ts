export const TEST_URL = Cypress.env('url') ?? 'http://localhost:3000';

export const Selectors = {
  CHAIN_SELECT_BUTTON: '.chain-select__control',
  CHAIN_SELECT_OPTION: '.chain-select__option',
  ALLOWANCES_TABLE: '.allowances-table',
  ALLOWANCES_LOADER: '.allowances-loader',
  CONTROLS_SECTION: '.controls-section',
  ADDRESS_INPUT: '.address-input',
  LAST_UPDATED_LINK: '.tx-link',
};
