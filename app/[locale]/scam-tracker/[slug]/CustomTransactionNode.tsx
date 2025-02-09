// import React from 'react';
// import { Handle, Position, type NodeProps } from '@xyflow/react';
// import { formatEther } from 'viem';
// import Card from 'components/common/Card';

// interface TransactionData {
//   address: string;
//   amount?: string;
//   token?: string;
//   type: 'sender' | 'receiver';
//   timestamp?: number;
// }

// const CustomTransactionNode = ({ data }: NodeProps<TransactionData>) => {
//   return (
//     <Card className="p-4 min-w-[200px]">
//       <Handle type="target" position={Position.Top} />
//       <div className="flex flex-col gap-2">
//         <div className="flex items-center justify-between">
//           <span className={`text-sm font-medium ${data.type === 'sender' ? 'text-red-500' : 'text-green-500'}`}>
//             {data.type === 'sender' ? 'From' : 'To'}
//           </span>
//           <span className="text-xs opacity-50">
//             {data.timestamp ? new Date(data.timestamp * 1000).toLocaleString() : ''}
//           </span>
//         </div>
//         <div className="text-sm font-mono break-all">{data.address}</div>
//         {data.amount && (
//           <div className="text-sm">
//             {formatEther(BigInt(data.amount))} {data.token}
//           </div>
//         )}
//       </div>
//       <Handle type="source" position={Position.Bottom} />
//     </Card>
//   );
// };

// export default CustomTransactionNode;
