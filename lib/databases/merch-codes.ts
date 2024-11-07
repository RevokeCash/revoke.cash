import Dexie, { Table } from 'dexie';

interface MerchCode {
  address: string;
  code: string;
}

class MerchCodesDB extends Dexie {
  private codes!: Table<MerchCode>;

  constructor() {
    super('MerchCodes');
    this.version(2024_11_01).stores({
      codes: '[address+code], address, code',
    });
  }

  getAllCodes() {
    return this.codes.toArray();
  }

  getCode(address: string) {
    return this.codes.get({ address });
  }

  addCode(address: string, code: string) {
    return this.codes.add({ address, code });
  }
}

const merchCodesDB = new MerchCodesDB();

export default merchCodesDB;
