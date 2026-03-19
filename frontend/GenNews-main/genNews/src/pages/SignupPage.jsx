import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      /**
       * BACKEND INTEGRATION:
       * The 'signup' function is defined in AuthContext.jsx. 
       * Connect it to your /auth/register endpoint.
       */
      await signup(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/[0.01] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-white/[0.01] rounded-full blur-[100px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-[440px] relative z-10">
        <div className="glass-panel py-10 px-8 sm:rounded-[2rem] border border-white/[0.1] shadow-2xl">
            
            <div className="text-center mb-8">
                <Link to="/" className="inline-block">
                    <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
                        <span className="text-white">Veri</span>Sight
                    </h2>
                </Link>
                <p className="text-xs font-medium tracking-[0.1em] text-gray-400 uppercase">Create your free account</p>
            </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 text-red-400 p-3 rounded-xl text-sm font-medium border border-red-500/20 flex items-start animate-in fade-in zoom-in duration-300">
                 <span className="mr-2">⚠️</span> {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-5 py-3.5 bg-white/[0.05] border border-white/[0.1] rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 sm:text-sm transition-all"
                  placeholder="FULL NAME"
                />
              </div>

              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-5 py-3.5 bg-white/[0.05] border border-white/[0.1] rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 sm:text-sm transition-all"
                  placeholder="EMAIL ADDRESS"
                />
              </div>

              <div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-5 py-3.5 bg-white/[0.05] border border-white/[0.1] rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 sm:text-sm transition-all"
                  placeholder="PASSWORD"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-full shadow-lg text-sm font-bold tracking-widest text-black uppercase bg-white hover:bg-gray-200 shadow-white/5 focus:outline-none disabled:opacity-70 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? 'Registering...' : 'Create Account'}
              </button>
            </div>

            <div className="text-center mt-6">
                <p className="text-[12px] text-gray-400">
                    Already have an account? {' '}
                    <Link to="/login" className="text-white font-bold hover:text-gray-300 transition-colors uppercase tracking-wider ml-1">Login</Link>
                </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
