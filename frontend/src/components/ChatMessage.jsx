import { Bot, User, ChevronDown, ChevronUp, FileText, Lightbulb } from 'lucide-react';
import { useState } from 'react';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const [showSources, setShowSources] = useState(false);
  const [showReasoning, setShowReasoning] = useState(true);

  if (isUser) {
    return (
      <div className="flex gap-3 justify-end fade-in-up">
        <div className="max-w-[75%] px-5 py-3 rounded-2xl rounded-tr-md bg-blue-50 border border-blue-200 text-slate-800 text-sm font-medium shadow-sm">
          {message.content}
        </div>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-purple to-accent-teal flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
    );
  }

  // AI message
  return (
    <div className="flex gap-3 fade-in-up">
      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
        <Bot className="w-4 h-4 text-blue-500" />
      </div>
      <div className="flex-1 max-w-[85%] space-y-3">
        {/* Main answer */}
        <div className="px-5 py-4 rounded-2xl rounded-tl-md bg-white border border-slate-200 text-slate-700 text-sm leading-relaxed shadow-sm">
          {message.content?.split('\n').map((line, i) => (
            <p key={i} className={line.startsWith('>') ? 'pl-3 border-l-2 border-blue-300 text-slate-500 italic my-2' : 'my-1'}>
              {line.startsWith('**') ? <strong className="text-slate-900">{line.replace(/\*\*/g, '')}</strong> : line}
            </p>
          ))}
        </div>

        {/* Confidence */}
        {message.confidence !== undefined && (
          <div className="flex items-center gap-2 px-1">
            <div className="flex-1 max-w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  message.confidence > 0.7 ? 'bg-emerald-500' : message.confidence > 0.4 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${message.confidence * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {Math.round(message.confidence * 100)}% confidence
            </span>
          </div>
        )}

        {/* Reasoning bullets */}
        {message.reasoning && message.reasoning.length > 0 && (
          <div className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-100">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center gap-2 text-xs font-semibold text-blue-600 w-full"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              Reasoning ({message.reasoning.length})
              {showReasoning ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
            </button>
            {showReasoning && (
              <ul className="mt-2 space-y-1.5">
                {message.reasoning.map((r, i) => (
                  <li key={i} className="text-xs text-slate-600 font-medium leading-relaxed">{r}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 w-full"
            >
              <FileText className="w-3.5 h-3.5" />
              Sources ({message.sources.length})
              {showSources ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
            </button>
            {showSources && (
              <div className="mt-2 space-y-2">
                {message.sources.map((src, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-sky-600">{src.document}</span>
                      <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        {Math.round(src.relevance * 100)}% match
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-3">
                      {src.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
