import { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom node component
function CustomNode({ data }) {
  const typeStyles = {
    decision: {
      bg: 'linear-gradient(135deg, #7c3aed22, #7c3aed11)',
      border: '#7c3aed55',
      icon: '📋',
      textColor: '#c4b5fd',
    },
    person: {
      bg: 'linear-gradient(135deg, #06b6d422, #06b6d411)',
      border: '#06b6d455',
      icon: '👤',
      textColor: '#67e8f9',
    },
    topic: {
      bg: 'linear-gradient(135deg, #10b98122, #10b98111)',
      border: '#10b98155',
      icon: '🏷️',
      textColor: '#6ee7b7',
    },
    alternative: {
      bg: 'linear-gradient(135deg, #f59e0b22, #f59e0b11)',
      border: '#f59e0b55',
      icon: '🔄',
      textColor: '#fcd34d',
    },
  };

  const style = typeStyles[data.nodeType] || typeStyles.topic;

  return (
    <div
      style={{
        background: style.bg,
        borderColor: style.border,
        color: style.textColor,
        boxShadow: `0 4px 20px -2px ${style.border}`,
      }}
      className="px-4 py-3 rounded-2xl border backdrop-blur-md text-xs font-bold max-w-56 text-center transition-transform hover:scale-110"
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-white/50 !border-none" />
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-xl bg-black/20 p-2 rounded-full leading-none shadow-inner border border-white/5">
          {style.icon}
        </span>
        <span className="leading-snug tracking-wide">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-white/50 !border-none" />
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

export default function GraphVisualization({ graphData }) {
  // Transform graph data to React Flow format
  const { flowNodes, flowEdges } = useMemo(() => {
    if (!graphData || !graphData.nodes) {
      return { flowNodes: [], flowEdges: [] };
    }

    // Group nodes by type
    const nodesByType = {};
    graphData.nodes.forEach((node) => {
      if (!nodesByType[node.type]) nodesByType[node.type] = [];
      nodesByType[node.type].push(node);
    });

    // Organic Radial Clustering Algorithm
    const flowNodes = [];
    const radiusBase = 180;
    
    // 1. Map connections to cluster things around decisions
    const childrenMap = {};
    if (graphData.edges) {
      graphData.edges.forEach(e => {
        if (!childrenMap[e.source]) childrenMap[e.source] = [];
        childrenMap[e.source].push(e.target);
      });
    }

    // 2. Position decisions in a central ring or grid
    const decisions = nodesByType['decision'] || [];
    const decisionPositions = {};
    
    decisions.forEach((node, i) => {
      // Hexagon/Circle layout for core decisions
      const angle = (i / decisions.length) * Math.PI * 2;
      const coreRadius = decisions.length > 1 ? 300 : 0;
      const dx = 600 + Math.cos(angle) * coreRadius;
      const dy = 400 + Math.sin(angle) * coreRadius;
      
      decisionPositions[node.id] = { x: dx, y: dy };
      
      flowNodes.push({
        id: node.id,
        type: 'custom',
        position: { x: dx, y: dy },
        data: { label: (node.data.decision || node.data.name || node.id).substring(0, 60), nodeType: 'decision' },
      });
    });

    // 3. Orbit other nodes around their connected decisions
    const placedNodes = new Set(decisions.map(d => d.id));
    
    // Function to place satellite nodes
    const placeSatellites = (nodesList, type) => {
      nodesList.forEach((node) => {
        if (placedNodes.has(node.id)) return;
        
        // Find which decision it connects to
        let parentId = null;
        if (graphData.edges) {
          const edge = graphData.edges.find(e => e.target === node.id || e.source === node.id);
          if (edge) parentId = edge.source === node.id ? edge.target : edge.source;
        }

        let px, py;
        if (parentId && decisionPositions[parentId]) {
          // Orbit parent
          const p = decisionPositions[parentId];
          const siblings = childrenMap[parentId] || [];
          const idx = siblings.indexOf(node.id);
          const localAngle = (idx / Math.max(siblings.length, 1)) * Math.PI * 2;
          // Offset distance based on type
          const dist = type === 'person' ? 140 : type === 'alternative' ? 200 : 250;
          px = p.x + Math.cos(localAngle) * dist;
          py = p.y + Math.sin(localAngle) * dist;
        } else {
          // Random floating node if disconnected
          px = Math.random() * 800;
          py = Math.random() * 800;
        }

        flowNodes.push({
          id: node.id,
          type: 'custom',
          position: { x: px, y: py },
          data: { label: (node.data.name || node.id).substring(0, 50), nodeType: type },
        });
        placedNodes.add(node.id);
      });
    };

    placeSatellites(nodesByType['person'] || [], 'person');
    placeSatellites(nodesByType['alternative'] || [], 'alternative');
    placeSatellites(nodesByType['topic'] || [], 'topic');

    // Transform edges
    const nodeIdSet = new Set(flowNodes.map((n) => n.id));
    const flowEdges = (graphData.edges || [])
      .filter((e) => nodeIdSet.has(e.source) && nodeIdSet.has(e.target))
      .map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label || edge.type.replace('_', ' '),
        type: 'bezier',
        animated: true,
        style: {
          stroke: edge.type === 'participated_in' ? '#06b6d4' :
                  edge.type === 'about' ? '#10b981' :
                  edge.type === 'rejected_alternative' ? '#f59e0b' : '#c4b5fd',
          strokeWidth: 2.5,
          opacity: 0.7,
        },
        labelStyle: { fill: '#e2e8f0', fontSize: 9, fontWeight: 'bold' },
        labelBgStyle: { fill: '#12121a', fillOpacity: 0.9, color: 'white' },
        labelBgPadding: [6, 4],
        labelBgBorderRadius: 8,
      }));

    return { flowNodes, flowEdges };
  }, [graphData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Update when data changes
  useMemo(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges]);

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">🔗</p>
          <p className="text-sm">No graph data yet.</p>
          <p className="text-xs text-gray-600 mt-1">Upload documents to build the knowledge graph.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-xl overflow-hidden" style={{ backgroundColor: '#0a0a14' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
      >
        <Background color="#1a1a2e" gap={20} size={1} />
        <Controls className="!bg-dark-700 !border-white/10 !rounded-xl !shadow-xl" />
      </ReactFlow>
    </div>
  );
}
