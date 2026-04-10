import { Bot, User, ChevronDown, ChevronUp, FileText, Lightbulb } from 'lucide-react';
import { useState } from 'react';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const [showSources, setShowSources] = useState(false);
  const [showReasoning, setShowReasoning] = useState(true);

  if (isUser) {
    return (
      <div className="flex gap-3 justify-end fade-in-up">
        <div className="max-w-[75%] px-5 py-3 rounded-2xl rounded-tr-md bg-accent-purple/20 border border-accent-purple/20 text-gray-200 text-sm">
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
      <div className="w-9 h-9 rounded-xl bg-dark-600 border border-white/10 flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4 text-accent-teal" />
      </div>
      <div className="flex-1 max-w-[85%] space-y-3">
        {/* Main answer */}
        <div className="px-5 py-4 rounded-2xl rounded-tl-md bg-dark-700/80 border border-white/5 text-gray-300 text-sm leading-relaxed">
          {message.content?.split('\n').map((line, i) => (
            <p key={i} className={line.startsWith('>') ? 'pl-3 border-l-2 border-accent-purple/40 text-gray-400 italic my-2' : 'my-1'}>
              {line.startsWith('**') ? <strong className="text-white">{line.replace(/\*\*/g, '')}</strong> : line}
            </p>
          ))}
        </div>

        {/* Confidence */}
        {message.confidence !== undefined && (
          <div className="flex items-center gap-2 px-1">
            <div className="flex-1 max-w-32 h-1.5 bg-dark-600 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  message.confidence > 0.7 ? 'bg-accent-emerald' : message.confidence > 0.4 ? 'bg-accent-amber' : 'bg-accent-rose'
                }`}
                style={{ width: `${message.confidence * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-gray-500">
              {Math.round(message.confidence * 100)}% confidence
            </span>
          </div>
        )}

        {/* Reasoning bullets */}
        {message.reasoning && message.reasoning.length > 0 && (
          <div className="px-4 py-3 rounded-xl bg-accent-purple/5 border border-accent-purple/10">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center gap-2 text-xs font-semibold text-accent-purple-light w-full"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              Reasoning ({message.reasoning.length})
              {showReasoning ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
            </button>
            {showReasoning && (
              <ul className="mt-2 space-y-1.5">
                {message.reasoning.map((r, i) => (
                  <li key={i} className="text-xs text-gray-400 leading-relaxed">{r}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="px-4 py-3 rounded-xl bg-dark-600/50 border border-white/5">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-2 text-xs font-semibold text-gray-400 w-full"
            >
              <FileText className="w-3.5 h-3.5" />
              Sources ({message.sources.length})
              {showSources ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
            </button>
            {showSources && (
              <div className="mt-2 space-y-2">
                {message.sources.map((src, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-dark-700/60 border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-accent-teal">{src.document}</span>
                      <span className="text-[10px] text-gray-500 bg-dark-600 px-2 py-0.5 rounded-full">
                        {Math.round(src.relevance * 100)}% match
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3">
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
