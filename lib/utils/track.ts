import axios, { AxiosInstance } from 'axios';
import { GOLD_RUSH_API_KEY } from 'lib/constants';

interface CovalentResponse<T> {
  data: {
    data: {
      items: T[];
    };
    error: boolean;
    error_message?: string;
  };
}

interface TransactionData {
  // Add specific transaction fields as needed
  [key: string]: any;
}

class CovalentAPI {
  private api: AxiosInstance;

  constructor(apiKey = GOLD_RUSH_API_KEY) {
    if (!apiKey) {
      throw new Error('Covalent API key is not configured');
    }
    this.api = axios.create({
      baseURL: 'https://api.covalenthq.com/v1',
      params: { key: apiKey },
      timeout: 30000, // 30 seconds timeout
    });
  }

  private async handleRequest<T>(request: Promise<CovalentResponse<T>>): Promise<T[]> {
    try {
      const response = await request;
      console.log('Covalent API Response:', JSON.stringify(response, null, 2));

      if (!response?.data) {
        throw new Error('Invalid response format from Covalent API');
      }

      if (response.data.error) {
        throw new Error(response.data.error_message || 'An error occurred while fetching data from Covalent');
      }

      if (!response.data.data?.items?.length) {
        throw new Error('No transaction data found. Please verify the transaction hash and try again.');
      }

      return response.data.data.items;
    } catch (error) {
      console.error('Covalent API Error:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timed out. Please try again later.');
        } else if (!error.response) {
          throw new Error('Network connection failed. Please check your internet connection and try again.');
        } else if (error.response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (error.response.status === 401 || error.response.status === 403) {
          throw new Error('API authentication failed. Please check your API key configuration.');
        } else {
          throw new Error(`Failed to fetch transaction data: ${error.message}`);
        }
      }
      throw new Error('Failed to fetch transaction data. Please try again.');
    }
  }

  async getTransactionData(txHash: string): Promise<TransactionData> {
    if (!txHash || typeof txHash !== 'string') {
      throw new Error('Invalid transaction hash provided');
    }

    const items = await this.handleRequest<TransactionData>(
      this.api.get(`/1/transaction_v2/${txHash}/`)
    );
    return items[0];
  }

  async getAddressTransactions(address: string, pageSize: number = 5): Promise<TransactionData[]> {
    if (!address || typeof address !== 'string') {
      throw new Error('Invalid address provided');
    }

    return this.handleRequest<TransactionData>(
      this.api.get(`/1/address/${address}/transactions_v2/`, {
        params: { 'page-size': pageSize },
      })
    );
  }
}

// Export a singleton instance
const covalentAPI = new CovalentAPI();

export const { getTransactionData, getAddressTransactions } = covalentAPI;
