// 'use client';
// import { useCallback, useState, useEffect } from 'react';
// import ReactFlow, {
//   type Node,
//   type Edge,
//   Controls,
//   Background,
//   useNodesState,
//   useEdgesState,
//   addEdge,
//   MiniMap,
// } from '@xyflow/react';
// import '@xyflow/react/dist/style.css';
// // import TransactionModal from 'components/scam_tracker/TransactionModal';
// import CustomTransactionNode from './CustomTransactionNode';

// interface TokenTransfer {
//   token_address: string;
//   from_address: string;
//   to_address: string;
//   amount: string;
//   token_symbol: string;
//   token_decimals: number;
// }

// interface TransactionData {
//   from_address: string;
//   to_address: string;
//   value: string;
//   tx_hash: string;
//   gas_metadata: {
//     contract_ticker_symbol: string;
//     contract_name: string;
//     logo_url: string;
//   };
//   block_signed_at: string;
//   gas_offered: number;
//   gas_spent: number;
//   gas_price: number;
//   fees_paid: string;
//   tokenTransfers: TokenTransfer[];
// }

// interface TransactionGraphProps {
//   data: {
//     nodes: Node[];
//     edges: Edge[];
//   };
// }

// export default function TransactionGraph({ data }: TransactionGraphProps) {
//   const [nodes, setNodes, onNodesChange] = useNodesState(data.nodes);
//   const [edges, setEdges, onEdgesChange] = useEdgesState(data.edges);
//   const [selectedTransaction, setSelectedTransaction] = useState<TransactionData | null>(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   useEffect(() => {
//     setNodes(data.nodes);
//     setEdges(data.edges);
//   }, [data, setNodes, setEdges]);

//   const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

//   const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
//     setSelectedTransaction(edge.data as TransactionData);
//     setIsModalOpen(true);
//   }, []);

//   const closeModal = () => {
//     setIsModalOpen(false);
//     setSelectedTransaction(null);
//   };

//   const nodeTypes = { customTransaction: CustomTransactionNode };

//   return (
//     <>
//       <div style={{ width: '100%', height: '600px' }}>
//         <ReactFlow
//           nodes={nodes}
//           edges={edges}
//           onNodesChange={onNodesChange}
//           onEdgesChange={onEdgesChange}
//           onConnect={onConnect}
//           onEdgeClick={onEdgeClick}
//           nodeTypes={nodeTypes}
//           fitView
//         >
//           <Controls />
//           <Background />
//           <MiniMap />
//         </ReactFlow>
//       </div>
//       <TransactionModal isOpen={isModalOpen} onClose={closeModal} transaction={selectedTransaction} />
//     </>
//   );
// }
