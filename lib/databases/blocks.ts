import Dexie, { Table } from 'dexie';
import { Log, TimeLog } from 'lib/utils/events';
import { PublicClient } from 'viem';

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

  async getBlockTimestamp(publicClient: PublicClient, blockNumber: number): Promise<number> {
    try {
      const chainId = publicClient.chain!.id;
      const storedBlock = await this.blocks.get([chainId, blockNumber]);
      if (storedBlock) return storedBlock.timestamp;

      const block = await publicClient.getBlock({ blockNumber: BigInt(blockNumber) });
      const timestamp = Number(block?.timestamp);
      await this.blocks.put({ chainId, blockNumber, timestamp });
      return timestamp;
    } catch (e) {
      // If there is an error, we just return the block timestamp from the public client (may be the case if IndexedDB is not supported)
      if (e instanceof Dexie.DexieError) {
        const block = await publicClient.getBlock({ blockNumber: BigInt(blockNumber) });
        return Number(block?.timestamp);
      }

      throw e;
    }
  }

  async getLogTimestamp(publicClient: PublicClient, log: Pick<Log, 'timestamp' | 'blockNumber'>) {
    return log.timestamp ?? this.getBlockTimestamp(publicClient, log.blockNumber);
  }

  async getTimeLog(publicClient: PublicClient, log: TimeLog) {
    const timestamp = await this.getLogTimestamp(publicClient, log);
    return { ...log, timestamp };
  }
}

const blocksDB = new BlocksDB();

export default blocksDB;
