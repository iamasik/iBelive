import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User as UserIcon, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(identifier, password);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center px-4 py-12 w-full">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-900 border border-brand-800 mb-4 shadow-xl">
            <Lock className="w-8 h-8 text-brand-500" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Admin Login</h2>
          <p className="text-brand-400 mt-2">Sign in to manage your application</p>
        </div>

        <div className="bg-brand-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-brand-300 mb-1">Username or Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-brand-500" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-brand-700 rounded-xl bg-brand-950 text-white placeholder-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 sm:text-sm transition-all"
                  placeholder="admin or admin@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-300 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-brand-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-brand-700 rounded-xl bg-brand-950 text-white placeholder-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 sm:text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !identifier || !password}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-brand-950 bg-accent-500 hover:bg-accent-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-900 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Website
          </Link>
        </div>
      </div>
    </div>
  );
}
