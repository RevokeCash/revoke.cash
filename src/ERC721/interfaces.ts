import { BigNumber } from 'ethers';

export interface Allowance {
  spender: string
  ensSpender?: string
  spenderAppName?: string
  index?: BigNumber
}
