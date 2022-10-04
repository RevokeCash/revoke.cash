import { Filter, Log } from '@ethersproject/abstract-provider';
import axios from 'axios';

export class BackendProvider {
  constructor(public chainId: number) {}

  async getLogs(filter: Filter): Promise<Log[]> {
    try {
      const { data } = await axios.post(`/api/${this.chainId}/logs`, filter);
      return data;
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? error?.response?.data ?? error?.message);
    }
  }
}
