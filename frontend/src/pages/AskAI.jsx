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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple/20 to-accent-teal/20 border border-accent-purple/20 flex items-center justify-center pulse-glow">
            <Brain className="w-5 h-5 text-accent-purple-light" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Chief Memory Officer</h1>
            <p className="text-xs text-gray-400 font-medium tracking-wide">AI-Powered Organizational Query Engine</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-gray-200 hover:bg-dark-700/50 border border-white/5 transition-all"
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
            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-accent-purple/20 via-accent-teal/10 to-transparent border border-white/10 flex items-center justify-center mb-8 shadow-2xl shadow-accent-purple-glow pulse-glow">
              <Sparkles className="w-10 h-10 text-accent-teal-light" />
            </div>
            <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 mb-3 tracking-tight">What would you like to uncover?</h2>
            <p className="text-sm text-gray-400 mb-10 max-w-lg font-medium leading-relaxed">
              Ask about strategic decisions, missing alternatives, or team dynamics from your organizational documents.
              I will extract the answers with full explainability.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl w-full">
              {SUGGESTED_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(q)}
                  className={`text-left px-5 py-4 rounded-2xl glass-card backdrop-blur-xl text-sm font-medium text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-3 fade-in-up hover:border-accent-teal/30 group`}
                  style={{ animationDelay: `${(i + 1) * 75}ms` }}
                >
                  <span className="p-1.5 rounded-lg bg-dark-600/50 text-accent-teal group-hover:bg-accent-teal/20 group-hover:scale-110 transition-all">
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
            <div className="w-9 h-9 rounded-xl bg-dark-600 border border-white/10 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 text-accent-teal animate-spin" />
            </div>
            <div className="px-5 py-4 rounded-2xl rounded-tl-md bg-dark-700/80 border border-white/5">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent-purple typing-dot" />
                <span className="w-2 h-2 rounded-full bg-accent-purple typing-dot" />
                <span className="w-2 h-2 rounded-full bg-accent-purple typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Input Dock */}
      <div className="absolute bottom-0 left-0 right-0 pt-6 pb-2 bg-gradient-to-t from-dark-900 via-dark-900/90 to-transparent">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto backdrop-blur-3xl glass-card rounded-2xl border border-white/10 shadow-2xl p-1.5 flex gap-2 fade-in-up delay-300">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the Chief Memory Officer..."
              disabled={loading}
              className="w-full px-5 py-3.5 bg-transparent border-none text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-0 disabled:opacity-50 font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3.5 bg-gradient-to-br from-accent-purple to-accent-teal rounded-xl text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
