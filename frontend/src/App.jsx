import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import AskAI from './pages/AskAI';
import KnowledgeGraph from './pages/KnowledgeGraph';
import DataSources from './pages/DataSources';
import DecisionHistory from './pages/DecisionHistory';
import Login from './pages/Login';
import Register from './pages/Register';

// ── Protected route wrapper ────────────────────────────────────
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-teal mx-auto mb-4 flex items-center justify-center pulse-glow">
            <span className="text-2xl">🧠</span>
          </div>
          <p className="text-sm text-gray-500 animate-pulse">Loading OrgMemory…</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// ── Public route — redirect if already logged in ───────────────
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

// ── App shell for authenticated users ─────────────────────────
function AppShell() {
  return (
    <div className="flex h-screen bg-dark-900 text-gray-200 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ask" element={<AskAI />} />
            <Route path="/graph" element={<KnowledgeGraph />} />
            <Route path="/sources" element={<DataSources />} />
            <Route path="/decisions" element={<DecisionHistory />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// ── Root app with auth wrapper ─────────────────────────────────
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public auth routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected app routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
