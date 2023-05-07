import axios from 'axios';
import { RequestQueue } from './api/logs/RequestQueue';
import type { Filter, Log } from './interfaces';

export class BackendProvider {
  queue: RequestQueue;

  constructor(public chainId: number) {
    // Limit the number of requests to the backend to 5 per second (spread out), to reduce the load on the backend
    this.queue = new RequestQueue(String(chainId), { interval: 200, intervalCap: 1 }, 'p-queue');
  }

  async getLogs(filter: Filter): Promise<Log[]> {
    try {
      const { data } = await this.queue.add(() => axios.post(`/api/${this.chainId}/logs`, filter));
      return data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message ?? error?.response?.data ?? error?.message);
    }
  }
}
