import type { Table } from 'dexie';
import AbstractDexieCache from './AbstractDexieCache';
import type { Block } from './BlocksDexie';

export default class BlocksDexieCache extends AbstractDexieCache<Block, [number, number]> {
  async initializeDatabaseTable(): Promise<Table<Block>> {
    const { default: BlocksDexie } = await import('./BlocksDexie');
    return new BlocksDexie().blocks;
  }
}
