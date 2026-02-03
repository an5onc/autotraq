import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Gauge, ChevronRight, ScanBarcode, Mail } from 'lucide-react';

type LoginMode = 'email' | 'barcode';

export function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>('viewer');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, barcodeLogin, register } = useAuth();
  const navigate = useNavigate();
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Auto-focus barcode input when in barcode mode
  useEffect(() => {
    if (loginMode === 'barcode' && barcodeRef.current) {
      barcodeRef.current.focus();
    }
  }, [loginMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, name, role);
      } else if (loginMode === 'barcode') {
        await barcodeLogin(barcodeInput.trim());
      } else {
        await login(email, password);
      }
      navigate('/parts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      if (loginMode === 'barcode') {
        setBarcodeInput('');
        barcodeRef.current?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle barcode scanner input (USB scanners typically send chars + Enter)
  const handleBarcodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950">
      {/* Background pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(245,158,11,0.15),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(245,158,11,0.08),_transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 80px),
                              repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 80px)`,
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 opacity-5">
          <div className="absolute top-20 right-10 w-72 h-px bg-amber-500 rotate-45" />
          <div className="absolute top-32 right-5 w-56 h-px bg-amber-500 rotate-45" />
          <div className="absolute top-44 right-0 w-40 h-px bg-amber-500 rotate-45" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl mb-5 shadow-lg shadow-amber-500/20">
            <Gauge className="w-9 h-9 text-slate-900" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-widest mb-2">AUTOTRAQ</h1>
          <p className="text-sm text-slate-500 tracking-[0.25em] uppercase">Precision Parts · Total Control</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {/* Login mode toggle (only when not registering) */}
          {!isRegister && (
            <div className="flex mb-6 bg-slate-800 rounded-xl p-1">
              <button
                type="button"
                onClick={() => { setLoginMode('email'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  loginMode === 'email' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="w-4 h-4" />
                Email Login
              </button>
              <button
                type="button"
                onClick={() => { setLoginMode('barcode'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  loginMode === 'barcode' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ScanBarcode className="w-4 h-4" />
                Barcode Login
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* BARCODE LOGIN MODE */}
            {!isRegister && loginMode === 'barcode' && (
              <div>
                <div className="text-center mb-4">
                  <ScanBarcode className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Scan your barcode or enter the code below</p>
                  <p className="text-slate-500 text-xs mt-1">For Admin & Manager accounts</p>
                </div>
                <input
                  ref={barcodeRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeKeyDown}
                  required
                  placeholder="Scan barcode..."
                  autoFocus
                  className="w-full px-5 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-center text-lg tracking-widest"
                />
              </div>
            )}

            {/* EMAIL LOGIN / REGISTER MODE */}
            {(isRegister || loginMode === 'email') && (
              <>
                {isRegister && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Your name"
                      className="w-full px-5 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full px-5 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    className="w-full px-5 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>

                {isRegister && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-5 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="fulfillment">Fulfillment</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-2">Need manager access? You can request a promotion after registering.</p>
                  </div>
                )}

                {!isRegister && (
                  <p className="text-xs text-slate-500">For Fulfillment & Viewer accounts. Admins & Managers use barcode login.</p>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold rounded-xl whitespace-nowrap transition-colors mt-6 cursor-pointer"
            >
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : loginMode === 'barcode' ? 'Authenticate' : 'Sign In'}
              {!loading && <ChevronRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(''); setLoginMode('email'); }}
              className="text-sm text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
            >
              {isRegister ? 'Already have an account? Sign in' : 'Need an account? Register'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-8">© {new Date().getFullYear()} AutoTraq Systems</p>
      </div>
    </div>
  );
}
