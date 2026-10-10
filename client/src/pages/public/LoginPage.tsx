import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'DOCTOR') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/patient/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-[#329BFA] flex items-center justify-center text-white shadow-lg shadow-[#329BFA]/30">
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H7v-2h4V7h2v4h4v2h-4v4z" />
            </svg>
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-[#171B22]">
            MediCore
          </span>
        </div>
        <h2 className="text-center text-xl font-bold tracking-tight text-[#171B22]">
          Sign in to your hospital account
        </h2>
        <p className="mt-1 text-center text-xs text-[#9298A1]">
          Access the digital healthcare management system
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card-base p-8 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9298A1]" />
                <input
                  type="email"
                  required
                  placeholder="name@medicore.hospital"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2] text-[#171B22] focus:outline-none focus:ring-2 focus:ring-[#329BFA]/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9298A1]" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2] text-[#171B22] focus:outline-none focus:ring-2 focus:ring-[#329BFA]/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#329BFA] hover:bg-[#2486E3] disabled:opacity-50 shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Chips */}
          <div className="pt-4 border-t border-[#F0F3F7]">
            <p className="text-[11px] font-bold text-[#9298A1] uppercase tracking-wider mb-2.5 text-center">
              Quick One-Click Demo Accounts
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@medicore.hospital', 'Admin@123')}
                className="w-full p-2 rounded-xl bg-[#F8FAFC] hover:bg-[#EBF5FE] border border-[#E9EDF2] text-left text-xs flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-bold text-[#171B22]">Dr. Robert Fox (Admin)</div>
                  <div className="text-[10px] text-[#9298A1]">admin@medicore.hospital</div>
                </div>
                <span className="text-[10px] font-bold text-[#329BFA] bg-blue-50 px-2 py-0.5 rounded-full">
                  Admin
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('dr.gregory@medicore.hospital', 'Doctor@123')}
                className="w-full p-2 rounded-xl bg-[#F8FAFC] hover:bg-[#EBF5FE] border border-[#E9EDF2] text-left text-xs flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-bold text-[#171B22]">Dr. Gregory House (Doctor)</div>
                  <div className="text-[10px] text-[#9298A1]">dr.gregory@medicore.hospital</div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Doctor
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('patient@medicore.hospital', 'Patient@123')}
                className="w-full p-2 rounded-xl bg-[#F8FAFC] hover:bg-[#EBF5FE] border border-[#E9EDF2] text-left text-xs flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-bold text-[#171B22]">Alex Morgan (Patient)</div>
                  <div className="text-[10px] text-[#9298A1]">patient@medicore.hospital</div>
                </div>
                <span className="text-[10px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-full">
                  Patient
                </span>
              </button>
            </div>
          </div>

          <div className="text-center pt-2 text-xs text-[#9298A1]">
            New patient?{' '}
            <Link to="/register" className="font-bold text-[#329BFA] hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
