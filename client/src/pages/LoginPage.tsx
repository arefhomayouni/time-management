import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../services/api';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await apiClient.post('/users/login', { email, password });
      const { token, data } = response.data;
      login(token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-luxury-black flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-luxury-darkGray p-10 rounded-3xl border border-white/10 shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2">Welcome <span className="text-luxury-gold">Back</span></h1>
          <p className="text-gray-400">Enter your credentials to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-luxury-black border border-white/10 rounded-xl text-white focus:border-luxury-gold outline-none transition-all"
              placeholder="email@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-luxury-black border border-white/10 rounded-xl text-white focus:border-luxury-gold outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full py-4 bg-luxury-gold text-luxury-black font-bold rounded-xl hover:bg-luxury-goldLight transition-all duration-300 transform hover:scale-[1.02]"
          >
            Sign In
          </button>
        </form>

        <p className="text-center mt-8 text-gray-400">
          Don't have an account? <Link to="/register" className="text-luxury-gold hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
