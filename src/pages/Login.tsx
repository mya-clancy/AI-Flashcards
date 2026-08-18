import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpen } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created!');
      }
      navigate('/');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#162c4c] p-8 rounded-2xl shadow-2xl border border-white/10">
        <div className="flex justify-center mb-8">
          <div className="bg-blue-500 p-3 rounded-full bg-opacity-20">
            <BookOpen className="w-10 h-10 text-blue-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center text-white mb-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-center text-blue-200 mb-8">
          Your personal AI-powered study companion
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-blue-200 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full bg-[#0f2139] border border-blue-500/30 rounded-xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-200 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full bg-[#0f2139] border border-blue-500/30 rounded-xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-blue-200">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
