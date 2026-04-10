import { useState, useEffect } from 'react';
import { GitFork, RefreshCw, Loader2 } from 'lucide-react';
import GraphVisualization from '../components/GraphVisualization';
import { getGraphData } from '../services/api';

export default function KnowledgeGraph() {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGraph = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGraphData();
      setGraphData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGraph(); }, []);

  const nodeCount = graphData?.nodes?.length || 0;
  const edgeCount = graphData?.edges?.length || 0;
  const decisionCount = graphData?.nodes?.filter(n => n.type === 'decision').length || 0;
  const personCount = graphData?.nodes?.filter(n => n.type === 'person').length || 0;

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-teal/15 flex items-center justify-center">
            <GitFork className="w-5 h-5 text-accent-teal" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Knowledge Graph</h1>
            <p className="text-xs text-gray-500">
              Interactive visualization of decisions, people, and topics
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden md:flex items-center gap-4 px-4 py-2 rounded-xl bg-dark-700/50 border border-white/5">
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-purple" /> Decisions
            </span>
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-teal" /> People
            </span>
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-emerald" /> Topics
            </span>
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-amber" /> Alternatives
            </span>
          </div>
          <button
            onClick={fetchGraph}
            className="p-2.5 rounded-xl bg-dark-700/50 border border-white/5 text-gray-400 hover:text-white hover:border-white/10 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Nodes', value: nodeCount, color: 'text-accent-purple-light' },
          { label: 'Edges', value: edgeCount, color: 'text-accent-teal' },
          { label: 'Decisions', value: decisionCount, color: 'text-accent-emerald' },
          { label: 'People', value: personCount, color: 'text-accent-amber' },
        ].map((s) => (
          <div key={s.label} className="px-4 py-2.5 rounded-xl bg-dark-700/40 border border-white/5 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Graph */}
      <div className="flex-1 glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-accent-purple animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-accent-rose text-sm">
            Error loading graph: {error}
          </div>
        ) : (
          <GraphVisualization graphData={graphData} />
        )}
      </div>
    </div>
  );
}
