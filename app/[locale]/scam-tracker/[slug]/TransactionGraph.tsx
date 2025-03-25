'use client';

import {
  Background,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import { useCallback, useEffect, useState } from 'react';
import '@xyflow/react/dist/style.css';
import TransactionModal from 'components/scam_tracker/TransactionModal';
import type { TransactionData, TransactionInfo } from 'lib/utils/token-tracking';
import TransactionNode from './TransactionNode';

interface TransactionGraphProps {
  data: {
    edges: Edge[];
    nodes: Node<TransactionInfo>[];
  };
}

export default function TransactionGraph({ data }: TransactionGraphProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState(data.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(data.edges);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionInfo | null>(null);

  useEffect(() => {
    console.log('Graph nodes:', nodes);
    console.log('Graph edges:', edges);
  }, [nodes, edges]);

  useEffect(() => {
    setNodes(data.nodes);
    setEdges(data.edges);

    console.log('Updated graph data from buildGraphData:', data);
  }, [data, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges],
  );

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    console.log('Edge clicked:', edge);
    console.log(edge.data);
    // setSelectedTransaction(edge.data);
    setIsModalOpen(true);
    console.log('ghjdk');
  }, []);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node);
    if (node.data && (node.data as TransactionData)) {
      setSelectedTransaction(node.data as TransactionInfo);
      setIsModalOpen(true);
      console.log('ghjk');
    } else {
      console.warn('Clicked node does not have associated transaction data.');
    }
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  const nodeTypes = { transaction: TransactionNode };

  return (
    <>
      <div style={{ width: '100%', height: '600px' }}>
        <ReactFlow
          fitView={false}
          nodes={nodes}
          edges={edges}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onEdgeClick={onEdgeClick}
          onNodeClick={onNodeClick}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
        >
          <Controls />
          <Background className="w-full" />
          <MiniMap />
        </ReactFlow>
      </div>

      <TransactionModal isOpen={isModalOpen} onClose={closeModal} transaction={selectedTransaction} />
    </>
  );
}
