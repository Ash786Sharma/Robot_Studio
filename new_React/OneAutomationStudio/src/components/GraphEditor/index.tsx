import React, { useCallback } from 'react';
import { Box } from '@mui/material';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes: Node[] = [
  {
    id: '1',
    data: { label: 'Input' },
    position: { x: 0, y: 50 },
    style: {
      background: '#4a90e2',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      padding: '8px 12px',
    },
  },
  {
    id: '2',
    data: { label: 'Process' },
    position: { x: 200, y: 50 },
    style: {
      background: '#e2a04a',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      padding: '8px 12px',
    },
  },
  {
    id: '3',
    data: { label: 'Output' },
    position: { x: 400, y: 50 },
    style: {
      background: '#4ae290',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      padding: '8px 12px',
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
];

export const GraphEditor: React.FC = () => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap
          style={{
            backgroundColor: '#252526',
            border: '1px solid #3e3e42',
          }}
        />
      </ReactFlow>
    </Box>
  );
};
