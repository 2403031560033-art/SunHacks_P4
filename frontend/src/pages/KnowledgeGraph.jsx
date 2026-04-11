import { useState, useEffect } from 'react';
import { GitFork, RefreshCw, Loader2 } from 'lucide-react';
import GraphVisualization from '../components/GraphVisualization';
import { getGraphData } from '../services/api';

export default function KnowledgeGraph() {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState('All Documents');

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

  // Extract unique documents
  const allDocuments = ['All Documents'];
  if (graphData?.nodes) {
    const docs = new Set();
    graphData.nodes.forEach(n => {
      if (n.data?.source_document) docs.add(n.data.source_document);
    });
    allDocuments.push(...Array.from(docs).sort());
  }

  // Filter graphData
  let filteredGraphData = graphData;
  if (graphData && selectedDocument !== 'All Documents') {
    const matchingNodeIds = new Set(
      graphData.nodes
        .filter(n => n.data?.source_document === selectedDocument)
        .map(n => n.id)
    );

    // Add 1st degree connections
    graphData.edges.forEach(e => {
      if (matchingNodeIds.has(e.source)) matchingNodeIds.add(e.target);
      if (matchingNodeIds.has(e.target)) matchingNodeIds.add(e.source);
    });

    filteredGraphData = {
      nodes: graphData.nodes.filter(n => matchingNodeIds.has(n.id)),
      edges: graphData.edges.filter(e => matchingNodeIds.has(e.source) && matchingNodeIds.has(e.target))
    };
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shadow-sm">
            <GitFork className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Knowledge Graph</h1>
            <p className="text-xs text-slate-500 font-medium">
              Interactive visualization of decisions, people, and topics
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden md:flex items-center gap-4 px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Decisions
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> People
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Topics
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Alternatives
            </span>
          </div>

          <div className="relative">
            <select
              value={selectedDocument}
              onChange={(e) => setSelectedDocument(e.target.value)}
              className="pl-4 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 appearance-none cursor-pointer shadow-sm max-w-[200px] truncate"
            >
              {allDocuments.map(doc => (
                <option key={doc} value={doc}>{doc}</option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchGraph}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Nodes', value: nodeCount, color: 'text-indigo-600' },
          { label: 'Edges', value: edgeCount, color: 'text-sky-600' },
          { label: 'Decisions', value: decisionCount, color: 'text-emerald-600' },
          { label: 'People', value: personCount, color: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{s.label}</p>
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
          <div className="flex items-center justify-center h-full text-red-500 text-sm font-semibold">
            Error loading graph: {error}
          </div>
        ) : (
          <GraphVisualization graphData={filteredGraphData} />
        )}
      </div>
    </div>
  );
}
