import { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
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
      }}
      className="px-4 py-2.5 rounded-xl border text-xs font-medium max-w-48 text-center shadow-lg"
    >
      <span className="mr-1">{style.icon}</span>
      {data.label}
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

    const flowNodes = [];
    let yOffset = 0;

    // Position decisions in center
    const decisions = nodesByType['decision'] || [];
    decisions.forEach((node, i) => {
      flowNodes.push({
        id: node.id,
        type: 'custom',
        position: {
          x: 400 + (i % 3) * 280,
          y: 60 + Math.floor(i / 3) * 200,
        },
        data: {
          label: (node.data.decision || node.data.name || node.id).substring(0, 60),
          nodeType: 'decision',
        },
      });
    });
    yOffset = Math.ceil(decisions.length / 3) * 200 + 60;

    // Position people on the left
    const people = nodesByType['person'] || [];
    people.forEach((node, i) => {
      flowNodes.push({
        id: node.id,
        type: 'custom',
        position: { x: 50, y: 40 + i * 90 },
        data: {
          label: node.data.name || node.id,
          nodeType: 'person',
        },
      });
    });

    // Position topics on the right
    const topics = nodesByType['topic'] || [];
    topics.forEach((node, i) => {
      flowNodes.push({
        id: node.id,
        type: 'custom',
        position: { x: 900, y: 40 + i * 90 },
        data: {
          label: node.data.name || node.id,
          nodeType: 'topic',
        },
      });
    });

    // Position alternatives below
    const alternatives = nodesByType['alternative'] || [];
    alternatives.forEach((node, i) => {
      flowNodes.push({
        id: node.id,
        type: 'custom',
        position: {
          x: 200 + (i % 4) * 220,
          y: yOffset + 40 + Math.floor(i / 4) * 90,
        },
        data: {
          label: (node.data.name || node.id).substring(0, 50),
          nodeType: 'alternative',
        },
      });
    });

    // Transform edges
    const nodeIdSet = new Set(flowNodes.map((n) => n.id));
    const flowEdges = (graphData.edges || [])
      .filter((e) => nodeIdSet.has(e.source) && nodeIdSet.has(e.target))
      .map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label || edge.type,
        type: 'default',
        animated: edge.type === 'participated_in',
        style: {
          stroke: edge.type === 'participated_in' ? '#06b6d4' :
                  edge.type === 'about' ? '#10b981' :
                  edge.type === 'rejected_alternative' ? '#f59e0b' : '#7c3aed',
          strokeWidth: 1.5,
        },
        labelStyle: { fill: '#9ca3af', fontSize: 10 },
        labelBgStyle: { fill: '#0f0f1a', fillOpacity: 0.8 },
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
