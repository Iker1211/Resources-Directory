import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import curriculumData from '../../curriculum.json';
import { CourseNode } from '../components/CourseNode';
import { getLayoutedElements } from '../utils/layoutUtils';
import dragon from '../assets/dragon.gif';
import logo from '../assets/logo (2).svg';

const nodeTypes = {
  courseNode: CourseNode,
};

// --- Initialize Data ---
const initializeFlowData = () => {
  const initialNodes = curriculumData.nodes.map((node) => ({
    id: node.id,
    type: 'courseNode',
    data: { ...node },
    position: { x: 0, y: 0 },
  }));

  const initialEdges = curriculumData.edges.map((edge) => ({
    id: `e-${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#475569', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#475569',
    },
  }));

  return getLayoutedElements(initialNodes, initialEdges);
};

export default function CurriculumFlow() {
  const { nodes: initialNodes, edges: initialEdges } = initializeFlowData();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const onNodeClick = useCallback((event, node) => {
    setSelectedCourse(node.data);
  }, []);

  const closeSidebar = () => {
    setSelectedCourse(null);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <img 
        src={logo} 
        alt="Logo" 
        style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, width: '400px', height: 'auto' }} 
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
      >
        <Background color="#1e293b" gap={16} />
        <Controls />
        <MiniMap nodeColor={(n) => {
          if (n.data.status === 'locked') return '#475569';
          if (n.data.status === 'completed') return '#10b981';
          return '#3b82f6';
        }} />
      </ReactFlow>

      {/* Sidebar Panel */}
      <div className={`sidebar-panel ${selectedCourse ? 'open' : ''}`}>
        <button className="close-btn" onClick={closeSidebar}>×</button>
        {selectedCourse && (
          <div className="sidebar-content">
            <span className="course-category" style={{color: '#94a3b8'}}>
              {selectedCourse.category.replace('_', ' ')}
            </span>
            <h2>{selectedCourse.title}</h2>
            <p><strong>Status:</strong> {selectedCourse.status.toUpperCase()}</p>
            {selectedCourse.description && (
              <p>{selectedCourse.description}</p>
            )}
            {selectedCourse.url && (
              <a href={selectedCourse.url} target="_blank" rel="noopener noreferrer" className="btn-open-link">
                Open Resource
              </a>
            )}
          </div>
        )}
      </div>

      <img 
        src={dragon} 
        alt="Dragon" 
        style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, width: '150px', height: 'auto', pointerEvents: 'none' }} 
      />
    </div>
  );
}
