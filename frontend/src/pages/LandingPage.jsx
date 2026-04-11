import { useNavigate } from 'react-router-dom';
import { Brain, ArrowRight, Sparkles, Shield, GitFork, Cpu } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-900 overflow-hidden relative selection:bg-accent-purple/30">
      {/* ── CSS "Video" Background: Neural Orb ── */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        {/* Deep background ambient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent-purple/10 via-dark-900 to-dark-900" />
        
        {/* Core AI Orb Engine (Animated) */}
        <div className="relative w-[600px] h-[600px] animate-[spin_60s_linear_infinite] opacity-60">
          <div className="absolute inset-0 rounded-full border border-white/5 bg-gradient-to-tr from-accent-teal/5 to-transparent blur-sm" />
          <div className="absolute inset-8 rounded-full border border-accent-purple/10 bg-gradient-to-bl from-accent-purple/10 to-transparent animate-pulse" />
          <div className="absolute inset-16 rounded-full border-t border-accent-teal/20 animate-[spin_10s_linear_infinite_reverse]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-accent-purple to-accent-teal rounded-full blur-3xl opacity-40 pulse-glow" />
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="relative z-20 flex justify-between items-center px-8 py-6 fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-teal flex flex-col items-center justify-center pulse-glow">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">OrgMemory</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Log In
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-all backdrop-blur-md border border-white/5"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-teal/10 border border-accent-teal/20 text-accent-teal text-xs font-bold tracking-wide uppercase mb-8 fade-in-up delay-100">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen Agentic Platform</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 tracking-tight max-w-4xl mb-6 fade-in-up delay-200">
          The memory engine for <br/> agentic enterprises.
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 font-medium leading-relaxed fade-in-up delay-300">
          Transform scattered Slack threads, meeting notes, and architecture docs into an intelligent, queryable graph. Never lose a strategic decision again.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 fade-in-up delay-400">
          <button 
            onClick={() => navigate('/register')}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-accent-purple to-accent-teal text-white font-bold text-lg hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            Deploy Reasoning Engine
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => navigate('/login')}
            className="px-8 py-4 rounded-xl bg-dark-700/50 backdrop-blur-md border border-white/10 text-white font-bold text-lg hover:bg-white/5 transition-all"
          >
            Watch Demo
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl w-full fade-in-up delay-400">
          {[
            { icon: GitFork, title: "Knowledge Graphs", desc: "Decisions mapped organically" },
            { icon: Cpu, title: "Agentic AI", desc: "LLM-driven proactive insights" },
            { icon: Shield, title: "Blind Spot Detection", desc: "Automated contradiction scanning" }
          ].map((f, i) => (
            <div key={i} className="p-6 rounded-2xl glass-card backdrop-blur-xl border border-white/5 text-left interactive-element">
              <f.icon className="w-8 h-8 text-accent-purple-light mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
