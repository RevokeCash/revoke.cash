'use client';

import Modal from 'components/common/Modal';
import { formatEther } from 'viem';

interface TokenTransfer {
  token_address: string;
  from_address: string;
  to_address: string;
  amount: string;
  token_symbol: string;
  token_decimals: number;
}

interface TransactionData {
  from_address: string;
  to_address: string;
  value: string;
  tx_hash: string;
  gas_metadata: {
    contract_ticker_symbol: string;
    contract_name: string;
    logo_url: string;
  };
  block_signed_at: string;
  gas_offered: number;
  gas_spent: number;
  gas_price: number;
  fees_paid: string;
  tokenTransfers: TokenTransfer[];
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionData | null;
}

const TransactionModal = ({ isOpen, onClose, transaction }: TransactionModalProps) => {
  if (!transaction) return null;

  return (
    <Modal open={isOpen} setOpen={onClose} className="max-w-2xl">
      <div className="flex flex-col gap-4">
        <div className="text-xl font-bold">Transaction Details</div>
        
        <div className="flex flex-col gap-2">
          <div className="font-semibold">Basic Information</div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="font-medium">Transaction Hash:</div>
            <div className="col-span-2 font-mono break-all">{transaction.tx_hash}</div>
            
            <div className="font-medium">From:</div>
            <div className="col-span-2 font-mono break-all">{transaction.from_address}</div>
            
            <div className="font-medium">To:</div>
            <div className="col-span-2 font-mono break-all">{transaction.to_address}</div>
            
            <div className="font-medium">Value:</div>
            <div className="col-span-2">
              {formatEther(BigInt(transaction.value))} {transaction.gas_metadata.contract_ticker_symbol}
            </div>
            
            <div className="font-medium">Timestamp:</div>
            <div className="col-span-2">{new Date(transaction.block_signed_at).toLocaleString()}</div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="font-semibold">Gas Information</div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="font-medium">Gas Offered:</div>
            <div className="col-span-2">{transaction.gas_offered}</div>
            
            <div className="font-medium">Gas Spent:</div>
            <div className="col-span-2">{transaction.gas_spent}</div>
            
            <div className="font-medium">Gas Price:</div>
            <div className="col-span-2">{formatEther(BigInt(transaction.gas_price))} ETH</div>
            
            <div className="font-medium">Fees Paid:</div>
            <div className="col-span-2">{formatEther(BigInt(transaction.fees_paid))} ETH</div>
          </div>
        </div>

        {transaction.tokenTransfers && transaction.tokenTransfers.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="font-semibold">Token Transfers</div>
            <div className="flex flex-col gap-3">
              {transaction.tokenTransfers.map((transfer, index) => (
                <div key={index} className="grid grid-cols-3 gap-2 text-sm border-b pb-2 last:border-b-0">
                  <div className="font-medium">Token:</div>
                  <div className="col-span-2 font-mono break-all">
                    {transfer.token_symbol} ({transfer.token_address})
                  </div>
                  
                  <div className="font-medium">From:</div>
                  <div className="col-span-2 font-mono break-all">{transfer.from_address}</div>
                  
                  <div className="font-medium">To:</div>
                  <div className="col-span-2 font-mono break-all">{transfer.to_address}</div>
                  
                  <div className="font-medium">Amount:</div>
                  <div className="col-span-2">
                    {formatEther(BigInt(transfer.amount))} {transfer.token_symbol}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TransactionModal;