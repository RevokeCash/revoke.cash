import Dexie, { type Table } from 'dexie';

export interface Block {
  chainId: number;
  blockNumber: number;
  timestamp: number;
}

export default class BlocksDexie extends Dexie {
  public blocks!: Table<Block>;

  constructor() {
    super('Blocks');
    this.version(2023_03_14).stores({
      blocks: '[chainId+blockNumber], timestamp',
    });
  }
}
