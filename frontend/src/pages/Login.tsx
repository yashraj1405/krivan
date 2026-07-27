import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Sprout, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@fertilizer.com',
      password: 'adminpassword',
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data: LoginFormValues) => {
    setApiError(null);
    try {
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      if (response.data?.access_token) {
        await login(response.data.access_token);
        navigate('/');
      } else {
        setApiError('Authentication succeeded but token was missing.');
      }
    } catch (err: any) {
      console.error('Login error', err);
      const detail = err.response?.data?.detail;
      setApiError(typeof detail === 'string' ? detail : 'Invalid email or password. Please check backend connection.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dark mode toggle absolute button */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-xl transition-colors border border-slate-700/50"
        title="Toggle Theme"
      >
        {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
      </button>

      {/* Decorative Blob Effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/60 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="p-3.5 bg-brand-500/10 text-brand-400 rounded-2xl mb-4 border border-brand-500/20 shadow-inner">
            <Sprout className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Enterprise Login</h1>
          <p className="text-slate-400 text-xs mt-1.5 max-w-xs">
            Fertilizer Product Traceability & Verification Portal
          </p>
        </div>

        {/* Global Error Banner */}
        {apiError && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs flex items-start space-x-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Admin Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail size={18} />
              </span>
              <input
                type="email"
                {...register('email')}
                placeholder="admin@fertilizer.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-xs rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-400 mt-1 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock size={18} />
              </span>
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-xs rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-rose-400 mt-1 font-medium">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-semibold text-xs rounded-xl transition-all duration-200 shadow-lg shadow-brand-600/25 flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 text-white" />
                <span>Authenticating JWT...</span>
              </>
            ) : (
              <span>Sign In to Admin Console</span>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-700/50 text-center">
          <p className="text-[11px] text-slate-500">
            Default Admin: <code className="text-brand-400">admin@fertilizer.com</code> / <code className="text-brand-400">adminpassword</code>
          </p>
        </div>
      </div>
    </div>
  );
};
