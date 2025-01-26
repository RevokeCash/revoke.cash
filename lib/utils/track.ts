import axios from 'axios';
import { GOLD_RUSH_API_KEY } from 'lib/constants';

const GOLD_RUSH_BASE_URL = 'https://api.covalenthq.com/v1';

// Create an axios instance with default configurations
const covalentApi = axios.create({
  baseURL: GOLD_RUSH_BASE_URL,
  params: { key: GOLD_RUSH_API_KEY },
});

export async function fetchTransactionData(txHash: string) {
  try {
    const response = await covalentApi.get(`/1/transaction_v2/${txHash}/`);

    if (response.data.error) {
      throw new Error(response.data.error_message || 'An error occurred while fetching transaction data');
    }

    if (!response.data.data || !response.data.data.items || response.data.data.items.length === 0) {
      throw new Error('No transaction data found');
    }

    return response.data.data.items[0];
  } catch (error) {
    console.error('Error fetching transaction data:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(`Network error: ${error.message}`);
    }
    throw error;
  }
}

export async function fetchAddressTransactions(address: string, pageSize = 5) {
  try {
    const response = await covalentApi.get(`/1/address/${address}/transactions_v2/`, {
      params: { 'page-size': pageSize },
    });

    if (response.data.error) {
      throw new Error(response.data.error_message || 'An error occurred while fetching address transactions');
    }

    if (!response.data.data || !response.data.data.items) {
      throw new Error('No transaction data found for the address');
    }

    return response.data.data.items;
  } catch (error) {
    console.error('Error fetching address transactions:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(`Network error: ${error.message}`);
    }
    throw error;
  }
}
