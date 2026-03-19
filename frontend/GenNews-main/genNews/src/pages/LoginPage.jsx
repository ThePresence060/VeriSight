import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      /**
       * BACKEND INTEGRATION:
       * The 'login' function is defined in AuthContext.jsx.
       * Connect it to your /auth/login endpoint.
       */
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background glow effects for the login page */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/[0.01] rounded-full blur-[100px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-[440px] relative z-10">
        <div className="glass-panel py-12 px-8 sm:rounded-[2rem] border border-white/[0.08] shadow-2xl">
            
            <div className="text-center mb-10">
                <Link to="/" className="inline-block">
                    <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
                        <span className="text-white">Veri</span>Sight
                    </h2>
                </Link>
                <p className="text-xs font-medium tracking-[0.1em] text-gray-400 uppercase">Sign in to your account</p>
            </div>

          <form className="space-y-6 mt-2" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 text-red-400 p-3 rounded-xl text-sm font-medium border border-red-500/20 flex items-start">
                 <span className="mr-2">⚠️</span> {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-5 py-4 bg-white/[0.05] border border-white/[0.1] rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 sm:text-sm transition-all"
                  placeholder="EMAIL ADDRESS"
                />
              </div>

              <div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-5 py-4 bg-white/[0.05] border border-white/[0.1] rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 sm:text-sm transition-all"
                  placeholder="PASSWORD"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-full shadow-lg text-sm font-bold tracking-widest text-black uppercase bg-white hover:bg-gray-200 transition-all hover:scale-[1.02]"
              >
                {loading ? 'Processing...' : 'Login'}
              </button>
            </div>

            <div className="text-center mt-6 flex flex-col space-y-3">
                <a href="#" className="text-[11px] font-medium text-gray-400 hover:text-white uppercase tracking-wider transition-colors">Forgot Password?</a>
                <p className="text-[12px] text-gray-400">
                    Don't have an account? {' '}
                    <Link to="/signup" className="text-white font-bold hover:text-gray-300 transition-colors uppercase tracking-wider ml-1">Sign Up</Link>
                </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
