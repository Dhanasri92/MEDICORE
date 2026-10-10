import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Calendar, Heart, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
    gender: 'MALE',
    bloodGroup: 'O+',
    address: '',
    allergies: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      await register(formData);
      navigate('/patient/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[#329BFA] flex items-center justify-center text-white shadow-lg shadow-[#329BFA]/30">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H7v-2h4V7h2v4h4v2h-4v4z" />
            </svg>
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-[#171B22]">
            MediCore
          </span>
        </div>
        <h2 className="text-center text-xl font-bold tracking-tight text-[#171B22]">
          Create a Patient Account
        </h2>
        <p className="mt-1 text-center text-xs text-[#9298A1]">
          Register for secure appointments, clinical records, and hospital billing
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="card-base p-8 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#171B22] mb-1">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#171B22] mb-1">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#171B22] mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#171B22] mb-1">Password * (min 8 chars)</label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#171B22] mb-1">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#171B22] mb-1">Date of Birth *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  required
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#171B22] mb-1">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#171B22] mb-1">Blood Group</label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#171B22] mb-1">Allergies (if any)</label>
                <input
                  type="text"
                  name="allergies"
                  placeholder="e.g. Penicillin, Latex"
                  value={formData.allergies}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">Residential Address</label>
              <input
                type="text"
                name="address"
                placeholder="Street address, City, Postal code"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#329BFA] hover:bg-[#2486E3] disabled:opacity-50 shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <span>{isLoading ? 'Creating Account...' : 'Register as Patient'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 text-xs text-[#9298A1]">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-[#329BFA] hover:underline">
              Sign in to MediCore
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
