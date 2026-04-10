import { useState, useEffect } from 'react';
import { ClipboardList, RefreshCw, Loader2, Search, Filter } from 'lucide-react';
import DecisionCard from '../components/DecisionCard';
import { getDecisions } from '../services/api';

export default function DecisionHistory() {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('confidence');

  const fetchDecisions = async () => {
    setLoading(true);
    try {
      const data = await getDecisions();
      setDecisions(data.decisions || []);
    } catch (err) {
      console.error('Error fetching decisions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDecisions(); }, []);

  // Filter and sort
  const filteredDecisions = decisions
    .filter((d) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const text = `${d.decision} ${(d.reasoning || []).join(' ')} ${(d.alternatives || []).join(' ')} ${(d.participants || []).join(' ')}`.toLowerCase();
      return text.includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'confidence') return (b.confidence_score || 0) - (a.confidence_score || 0);
      if (sortBy === 'recent') return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-amber/15 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-accent-amber" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Decision History</h1>
            <p className="text-xs text-gray-500">{decisions.length} decision{decisions.length !== 1 ? 's' : ''} extracted</p>
          </div>
        </div>
        <button
          onClick={fetchDecisions}
          className="p-2.5 rounded-xl bg-dark-700/50 border border-white/5 text-gray-400 hover:text-white transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decisions..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-700/80 border border-white/5 rounded-xl text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent-purple/40 transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="pl-10 pr-8 py-2.5 bg-dark-700/80 border border-white/5 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-accent-purple/40 appearance-none cursor-pointer"
          >
            <option value="confidence">Sort by Confidence</option>
            <option value="recent">Sort by Recent</option>
          </select>
        </div>
      </div>

      {/* Decisions Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-accent-purple animate-spin" />
        </div>
      ) : filteredDecisions.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {searchQuery ? 'No decisions match your search' : 'No decisions extracted yet'}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {searchQuery ? 'Try a different search term' : 'Upload documents to extract decisions'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredDecisions.map((decision, i) => (
            <DecisionCard key={decision.id || i} decision={decision} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
