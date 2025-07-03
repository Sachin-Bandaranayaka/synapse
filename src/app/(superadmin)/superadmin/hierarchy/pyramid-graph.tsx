// src/app/(superadmin)/superadmin/hierarchy/pyramid-graph.tsx

'use client';

import React from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css'; // Import required styles

// The component accepts the nodes and edges we prepared
export function PyramidGraph({ nodes, edges }: { nodes: any[]; edges: any[] }) {
  return (
    <div style={{ height: '70vh', width: '100%' }} className="bg-gray-800/50 rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView // Automatically zooms to fit the whole graph
        proOptions={{ hideAttribution: true }} // Hides the "React Flow" attribution
      >
        <Background color="#555" gap={16} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}