import { Provider } from '@ethersproject/abstract-provider';
import Dexie, { Table } from 'dexie';

interface Block {
  chainId: number;
  blockNumber: number;
  timestamp: number;
}

class BlocksDB extends Dexie {
  private blocks!: Table<Block>;

  constructor() {
    super('Blocks');
    this.version(2023_03_14).stores({
      blocks: '[chainId+blockNumber], timestamp',
    });
  }

  async getBlockTimestamp(provider: Provider, blockNumber: number) {
    try {
      const { chainId } = await provider.getNetwork();
      const storedBlock = await this.blocks.get([chainId, blockNumber]);
      if (storedBlock) return storedBlock.timestamp;

      const block = await provider.getBlock(blockNumber);
      await this.blocks.put({ chainId, blockNumber, timestamp: block?.timestamp });
      return block.timestamp;
    } catch (e) {
      console.log(e);
      // If there is an error, we just return the block timestamp from the provider (may be the case if IndexedDB is not supported)
      if (e instanceof Dexie.DexieError) {
        const block = await provider.getBlock(blockNumber);
        return block?.timestamp;
      }

      throw e;
    }
  }
}

const blocksDB = new BlocksDB();

export default blocksDB;
