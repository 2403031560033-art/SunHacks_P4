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
    <div className="flex flex-col h-[calc(100vh-6.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-purple to-accent-teal flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Ask AI</h1>
            <p className="text-xs text-gray-500">Query the organizational memory with natural language</p>
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
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent-purple/20 to-accent-teal/10 border border-white/5 flex items-center justify-center mb-6 pulse-glow">
              <Sparkles className="w-9 h-9 text-accent-purple-light" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">What would you like to know?</h2>
            <p className="text-sm text-gray-500 mb-8 max-w-md">
              Ask about decisions, reasoning, and context from your organizational documents.
              I'll provide answers with full explainability.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl w-full">
              {SUGGESTED_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(q)}
                  className="text-left px-4 py-3 rounded-xl bg-dark-700/40 border border-white/5 text-sm text-gray-400 hover:text-white hover:border-accent-purple/30 hover:bg-dark-700/70 transition-all duration-200"
                >
                  <span className="text-accent-purple-light mr-2">→</span>
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

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about decisions, reasoning, or context..."
              disabled={loading}
              className="w-full px-5 py-3.5 bg-dark-700/80 border border-white/10 rounded-2xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent-purple/40 focus:ring-2 focus:ring-accent-purple/10 transition-all disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3.5 bg-gradient-to-r from-accent-purple to-accent-purple-light rounded-2xl text-white font-medium hover:shadow-lg hover:shadow-accent-purple-glow transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
