import { Users, FileText, Calendar, ChevronRight, TrendingUp } from 'lucide-react';

export default function DecisionCard({ decision, index = 0 }) {
  const confidence = decision.confidence_score || 0;
  const confidenceLabel = confidence > 0.7 ? 'High' : confidence > 0.4 ? 'Medium' : 'Low';
  const confidenceColor = confidence > 0.7 ? 'text-accent-emerald' : confidence > 0.4 ? 'text-accent-amber' : 'text-accent-rose';
  const confidenceBg = confidence > 0.7 ? 'bg-accent-emerald' : confidence > 0.4 ? 'bg-accent-amber' : 'bg-accent-rose';

  return (
    <div
      className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-5 fade-in-up group"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
            {decision.decision}
          </h3>
        </div>
        <div className={`flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-full text-[11px] font-bold ${confidenceColor} bg-slate-50 border border-slate-100`}>
          <TrendingUp className="w-3 h-3" />
          {confidenceLabel} ({Math.round(confidence * 100)}%)
        </div>
      </div>

      {/* Reasoning */}
      {decision.reasoning && decision.reasoning.length > 0 && (
        <div className="mb-3 space-y-1.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reasoning</p>
          {decision.reasoning.slice(0, 3).map((r, i) => (
            <div key={i} className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-600 font-medium leading-relaxed">{r}</p>
            </div>
          ))}
        </div>
      )}

      {/* Alternatives */}
      {decision.alternatives && decision.alternatives.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Alternatives Considered</p>
          <div className="flex flex-wrap gap-1.5">
            {decision.alternatives.map((alt, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200 shadow-sm">
                {alt}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-3">
          {/* Participants */}
          {decision.participants && decision.participants.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-medium text-slate-500">
                {decision.participants.slice(0, 3).join(', ')}
                {decision.participants.length > 3 && ` +${decision.participants.length - 3}`}
              </span>
            </div>
          )}
        </div>

        {/* Source */}
        {decision.source_document && (
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-medium text-slate-500 max-w-[120px] truncate">{decision.source_document}</span>
          </div>
        )}
      </div>

      {/* Confidence bar */}
      <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${confidenceBg} transition-all duration-700`}
          style={{ width: `${confidence * 100}%` }}
        />
      </div>
    </div>
  );
}
