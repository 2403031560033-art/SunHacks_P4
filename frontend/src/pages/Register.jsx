import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Brain, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function PasswordStrength({ password }) {
  const checks = [
    { label: '6+ characters', pass: password.length >= 6 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
  ];
  if (!password) return null;
  return (
    <div className="flex gap-3 mt-2">
      {checks.map((c) => (
        <span key={c.label} className={`flex items-center gap-1 text-[10px] ${c.pass ? 'text-accent-emerald' : 'text-gray-600'}`}>
          <CheckCircle2 className="w-3 h-3" />
          {c.label}
        </span>
      ))}
    </div>
  );
}

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      {/* Ambient gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-teal/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-teal mb-4 pulse-glow">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">OrgMemory</h1>
          <p className="text-gray-500 mt-1 text-sm">Your AI-powered organizational memory</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Create your account</h2>
            <p className="text-gray-500 text-sm mt-1">Start capturing your organization's decisions</p>
          </div>

          {error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-accent-rose/10 border border-accent-rose/20 mb-5 fade-in-up">
              <AlertCircle className="w-4 h-4 text-accent-rose shrink-0 mt-0.5" />
              <p className="text-sm text-accent-rose">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Full name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                  autoComplete="name"
                  className="w-full pl-10 pr-4 py-3 bg-dark-700/80 border border-white/8 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent-purple/50 focus:ring-2 focus:ring-accent-purple/10 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Work email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 bg-dark-700/80 border border-white/8 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent-purple/50 focus:ring-2 focus:ring-accent-purple/10 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  autoComplete="new-password"
                  className="w-full pl-10 pr-11 py-3 bg-dark-700/80 border border-white/8 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent-purple/50 focus:ring-2 focus:ring-accent-purple/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-accent-purple to-accent-teal text-white font-semibold text-sm hover:shadow-lg hover:shadow-accent-purple-glow transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create account
                </>
              )}
            </button>
          </form>

          {/* Features teaser */}
          <div className="mt-5 pt-5 border-t border-white/5">
            <p className="text-[11px] text-gray-600 text-center mb-3">What you get with OrgMemory</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { icon: '🧠', label: 'AI Memory' },
                { icon: '🔍', label: 'Smart Search' },
                { icon: '🔒', label: 'Private Data' },
              ].map((f) => (
                <div key={f.label} className="px-2 py-2 rounded-lg bg-dark-700/40">
                  <p className="text-lg mb-0.5">{f.icon}</p>
                  <p className="text-[10px] text-gray-500">{f.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-purple-light font-medium hover:text-accent-purple transition-colors">
              Sign in
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">
          🔒 Your data is encrypted and private
        </p>
      </div>
    </div>
  );
}
