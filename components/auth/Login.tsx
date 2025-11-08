

import React, { useState } from 'react';
import Logo from '../common/Logo';
import { supabase } from '../../lib/supabaseClient';

interface LoginProps {
  switchToSignUp: () => void;
}

const Login: React.FC<LoginProps> = ({ switchToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } 
    // On success, the onAuthStateChange listener in App.tsx will handle the redirect.
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[--color-bg-secondary] p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-[--color-bg-primary] rounded-2xl shadow-lg">
        <Logo />
        <p className="text-center text-[--color-text-secondary]">Welcome back! Log in to see your vibes.</p>
        <form className="space-y-6" onSubmit={handleLogin}>
          {error && <p className="text-[--color-error] text-sm text-center">{error}</p>}
          <div>
            <label htmlFor="email" className="text-sm font-medium text-[--color-text-secondary]">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-[--color-bg-tertiary] border border-[--color-border] rounded-lg shadow-sm text-[--color-text-primary] placeholder-[--color-text-secondary]/70 focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary] focus:border-[--color-accent-primary]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-[--color-text-secondary]">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-[--color-bg-tertiary] border border-[--color-border] rounded-lg shadow-sm text-[--color-text-primary] placeholder-[--color-text-secondary]/70 focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary] focus:border-[--color-accent-primary]"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-[--color-text-on-accent] bg-[--color-accent-primary] hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--color-accent-primary] transition-colors duration-200 disabled:bg-gray-400 dark:disabled:bg-gray-600"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <p className="text-sm text-center text-[--color-text-secondary]">
          Don't have an account?{' '}
          <button onClick={switchToSignUp} className="font-medium text-[--color-accent-primary] hover:text-green-500 dark:hover:text-green-400">
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;