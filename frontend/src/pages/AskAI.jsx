import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Loader2, Brain, Trash2, Sparkles } from 'lucide-react';
import ChatMessage from '../components/ChatMessage';
import { queryAI } from '../services/api';

const SUGGESTED_QUERIES = [
  "Why did we choose AWS over Azure?",
  "What database migration decisions were made?",
  "Who was involved in the frontend framework decision?",
  "What alternatives were considered for the API gateway?",
  "What were the cost considerations for cloud vendor selection?",
  "What observability tools did the team decide on?",
];

export default function AskAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const location = useLocation();

  // Handle initial query from topbar search
  useEffect(() => {
    if (location.state?.initialQuery) {
      handleSendMessage(location.state.initialQuery);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (text) => {
    const queryText = text || input.trim();
    if (!queryText || loading) return;

    setInput('');
    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: queryText }]);
    setLoading(true);

    try {
      const result = await queryAI(queryText);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: result.answer,
          reasoning: result.reasoning,
          sources: result.sources,
          confidence: result.confidence,
          relatedDecisions: result.related_decisions,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: `Sorry, I encountered an error: ${err.response?.data?.error || err.message}. Please make sure the backend is running on port 5000.`,
          reasoning: ['⚠️ Connection to the reasoning engine failed'],
          sources: [],
          confidence: 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 fade-in-up">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center pulse-glow shadow-sm shadow-blue-500/10">
            <Brain className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Chief Memory Officer</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide">AI-Powered Organizational Query Engine</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full text-center px-4 fade-in-up">
            <div className="w-24 h-24 rounded-[2rem] bg-blue-50 border border-blue-200 flex items-center justify-center mb-8 shadow-xl shadow-blue-500/10 pulse-glow">
              <Sparkles className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 mb-3 tracking-tight">What would you like to uncover?</h2>
            <p className="text-sm text-slate-500 mb-10 max-w-lg font-medium leading-relaxed">
              Ask about strategic decisions, missing alternatives, or team dynamics from your organizational documents.
              I will extract the answers with full explainability.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl w-full">
              {SUGGESTED_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(q)}
                  className={`text-left px-5 py-4 rounded-2xl bg-white/70 backdrop-blur-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:text-blue-700 transition-all duration-300 flex items-center gap-3 fade-in-up hover:border-blue-300 hover:bg-blue-50/50 group shadow-sm`}
                  style={{ animationDelay: `${(i + 1) * 75}ms` }}
                >
                  <span className="p-1.5 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 group-hover:scale-110 transition-all">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages */
          messages.map((msg, i) => <ChatMessage key={i} message={msg} />)
        )}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3 fade-in-up">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            </div>
            <div className="px-5 py-4 rounded-2xl rounded-tl-md bg-white border border-slate-200 shadow-sm">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 typing-dot" />
                <span className="w-2 h-2 rounded-full bg-blue-500 typing-dot" />
                <span className="w-2 h-2 rounded-full bg-blue-500 typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Input Dock */}
      <div className="absolute bottom-0 left-0 right-0 pt-6 pb-2 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-lg p-1.5 flex gap-2 fade-in-up delay-300">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the Chief Memory Officer..."
              disabled={loading}
              className="w-full px-5 py-3.5 bg-transparent border-none text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 disabled:opacity-50 font-semibold"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3.5 bg-gradient-to-br from-blue-600 to-sky-500 rounded-xl text-white font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
