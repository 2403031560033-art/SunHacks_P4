import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, ClipboardList, Users, Layers, GitFork,
  ArrowRight, Upload, MessageSquare, Sparkles, Zap, AlertTriangle
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import FileUpload from '../components/FileUpload';
import { getStats, getDecisions } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    documents: 0, decisions: 0, participants: 0,
    topics: 0, chunks: 0, graph_nodes: 0, graph_edges: 0, blind_spots: []
  });
  const [recentDecisions, setRecentDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [statsData, decisionsData] = await Promise.all([
        getStats().catch(() => ({})),
        getDecisions().catch(() => ({ decisions: [] })),
      ]);
      setStats(statsData);
      setRecentDecisions((decisionsData.decisions || []).slice(-3).reverse());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Organizational Memory & Reasoning Engine Overview</p>
        </div>
        <button
          onClick={() => navigate('/ask')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-purple to-accent-purple-light text-white text-sm font-medium hover:shadow-lg hover:shadow-accent-purple-glow transition-all duration-300 hover:scale-105"
        >
          <MessageSquare className="w-4 h-4" />
          Ask AI
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={FileText} label="Documents" value={stats.documents || 0} color="purple" trend={stats.documents > 0 ? 'Active' : null} />
        <StatsCard icon={ClipboardList} label="Decisions" value={stats.decisions || 0} color="teal" trend={stats.decisions > 0 ? `${stats.graph_edges || 0} relationships` : null} />
        <StatsCard icon={Users} label="Participants" value={stats.participants || 0} color="emerald" />
        <StatsCard icon={Layers} label="Knowledge Chunks" value={stats.chunks || 0} color="amber" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-accent-purple/15 flex items-center justify-center">
              <Upload className="w-4 h-4 text-accent-purple-light" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Ingest Data</h2>
              <p className="text-xs text-gray-500">Upload Slack conversations, emails, or meeting notes</p>
            </div>
          </div>
          <FileUpload onUploadComplete={fetchData} />
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent-amber" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Query Knowledge Base', icon: MessageSquare, path: '/ask', color: 'text-accent-purple-light' },
                { label: 'View Knowledge Graph', icon: GitFork, path: '/graph', color: 'text-accent-teal' },
                { label: 'Browse Decisions', icon: ClipboardList, path: '/decisions', color: 'text-accent-emerald' },
              ].map((action) => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-700/50 border border-white/5 hover:border-white/10 hover:bg-dark-600/50 transition-all group"
                >
                  <action.icon className={`w-4 h-4 ${action.color}`} />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{action.label}</span>
                  <ArrowRight className="w-3 h-3 text-gray-600 ml-auto group-hover:text-gray-400 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-purple-light" />
              How It Works
            </h3>
            <div className="space-y-3">
              {[
                { step: '1', text: 'Upload conversations, emails, or documents' },
                { step: '2', text: 'AI extracts decisions & reasoning' },
                { step: '3', text: 'Query in natural language with full explainability' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-accent-purple/15 text-accent-purple-light text-xs font-bold flex items-center justify-center shrink-0">
                    {item.step}
                  </span>
                  <p className="text-xs text-gray-400 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Blind Spot Risk Analysis Widget */}
          <div className="glass-card p-5 border border-accent-amber/20 bg-accent-amber/5">
            <h3 className="text-sm font-semibold text-accent-amber mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Decision Blind Spots
            </h3>
            {stats.blind_spots && stats.blind_spots.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 mb-2">
                  <span className="text-white font-medium">{stats.blind_spots.length} decisions</span> flagged for high risk:
                </p>
                {stats.blind_spots.slice(0, 3).map((bs, i) => (
                  <div key={i} className="p-3 rounded-lg bg-dark-700/80 border border-accent-amber/20">
                    <p className="text-xs font-medium text-gray-200 line-clamp-2">{bs.decision}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {bs.risk_factors.map((rf, idx) => (
                         <span key={idx} className="px-1.5 py-0.5 rounded bg-accent-amber/10 text-accent-amber text-[10px] font-medium border border-accent-amber/20">
                           ⚠️ {rf}
                         </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
               <p className="text-xs text-gray-400 italic">No blind spots detected in recent decisions. Great documentation!</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Decisions */}
      {recentDecisions.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-accent-teal" />
              Recent Decisions
            </h2>
            <button
              onClick={() => navigate('/decisions')}
              className="text-xs text-accent-purple-light hover:text-accent-purple font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {recentDecisions.map((d, i) => (
              <div key={i} className="p-4 rounded-xl bg-dark-700/40 border border-white/5 hover:border-accent-purple/20 transition-all">
                <p className="text-sm font-medium text-gray-200">{d.decision}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[11px] text-gray-500">
                    📎 {d.source_document || 'Unknown source'}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    🎯 {Math.round((d.confidence_score || 0) * 100)}% confidence
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
