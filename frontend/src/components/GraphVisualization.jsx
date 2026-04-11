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
      bg: 'linear-gradient(135deg, #eef2ff, #ffffff)',
      border: '#c7d2fe',
      icon: '📋',
      textColor: '#312e81',
    },
    person: {
      bg: 'linear-gradient(135deg, #f0f9ff, #ffffff)',
      border: '#bae6fd',
      icon: '👤',
      textColor: '#0c4a6e',
    },
    topic: {
      bg: 'linear-gradient(135deg, #ecfdf5, #ffffff)',
      border: '#a7f3d0',
      icon: '🏷️',
      textColor: '#064e3b',
    },
    alternative: {
      bg: 'linear-gradient(135deg, #fffbeb, #ffffff)',
      border: '#fde68a',
      icon: '🔄',
      textColor: '#78350f',
    },
  };

  const style = typeStyles[data.nodeType] || typeStyles.topic;

  return (
    <div
      style={{
        background: style.bg,
        borderColor: style.border,
        color: style.textColor,
        boxShadow: `0 4px 12px -2px rgba(0,0,0,0.05), inset 0 0 0 1px ${style.border}`,
      }}
      className="px-4 py-3 rounded-2xl border text-xs font-bold max-w-64 text-center transition-transform hover:scale-105"
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-slate-300 !border-slate-400" />
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-xl bg-white/50 p-2 rounded-full leading-none shadow-sm border border-slate-200/50">
          {style.icon}
        </span>
        <span className="leading-snug tracking-wide">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-slate-300 !border-slate-400" />
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
      const coreRadius = decisions.length > 1 ? Math.max(300, decisions.length * 60) : 0;
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
          // Offset distance based on type to avoid overlaps
          const distBase = type === 'person' ? 180 : type === 'alternative' ? 240 : 300;
          const dist = distBase + (idx % 2 === 0 ? 0 : 50); // Staggering
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
          stroke: edge.type === 'participated_in' ? '#38bdf8' :
                  edge.type === 'about' ? '#34d399' :
                  edge.type === 'rejected_alternative' ? '#fbbf24' : '#a78bfa',
          strokeWidth: 2,
          opacity: 0.5,
        },
        labelStyle: { fill: '#64748b', fontSize: 10, fontWeight: '700' },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9, color: '#334155' },
        labelBgPadding: [8, 4],
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
    <div className="w-full h-full rounded-xl overflow-hidden bg-slate-50 border border-slate-200">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
      >
        <Background color="#cbd5e1" gap={20} size={1} />
        <Controls className="!bg-white !border-slate-200 !rounded-xl !shadow-sm [&>button]:!border-b-slate-100 [&>button:hover]:!bg-slate-50" />
      </ReactFlow>
    </div>
  );
}
