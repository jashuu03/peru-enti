import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Mail, Lock, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

const SignIn = () => {
  const { signin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [portalRole, setPortalRole] = useState('user'); // 'user' or 'admin'
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const loggedInUser = await signin(formData);
      
      // Role validation for separate portal experience
      if (portalRole === 'admin' && loggedInUser.role !== 'admin') {
        toast.error('Access Denied: This account does not have Admin privileges.');
        return;
      }
      if (portalRole === 'user' && loggedInUser.role === 'admin') {
        toast.success('Admin detected. Accessing Admin dashboard...');
      } else {
        toast.success(`Welcome back to the ${portalRole === 'admin' ? 'Admin' : 'User'} Portal!`);
      }
      
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const isAdminPortal = portalRole === 'admin';

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className={`w-full max-w-md p-8 shadow-2xl relative overflow-hidden transition-all duration-300 border ${
        isAdminPortal ? 'border-teal-500/30 ring-1 ring-teal-500/20' : 'border-indigo-500/30'
      }`} hoverEffect={false}>
        {/* Glow effects */}
        {isAdminPortal ? (
          <>
            <div className="absolute -top-12 -right-12 w-44 h-44 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          </>
        ) : (
          <>
            <div className="absolute -top-12 -right-12 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
          </>
        )}

        <div className="text-center mb-6 flex flex-col items-center">
          <img src="/logo.png" alt="Peru Enti Logo" className="w-16 h-16 object-contain mb-3" />
          <h2 className="text-3xl font-extrabold text-white tracking-tight font-sans">
            {isAdminPortal ? 'Admin Portal' : 'User Portal'}
          </h2>
          <p className="text-gray-400 mt-2 text-sm">
            {isAdminPortal ? 'Manage meetups, upload event videos, and review analytics' : 'Sign in to connect, network, and attend local meetups'}
          </p>
        </div>

        {/* Portal Selector Tabs */}
        <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setPortalRole('user')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              !isAdminPortal ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            User Login
          </button>
          <button
            type="button"
            onClick={() => setPortalRole('admin')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              isAdminPortal ? 'bg-teal-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Admin Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                <Mail size={16} />
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="glass-input pl-10 pr-4 py-2.5 rounded-lg w-full text-sm"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold uppercase text-gray-400">Password</label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                <Lock size={16} />
              </span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="glass-input pl-10 pr-4 py-2.5 rounded-lg w-full text-sm"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className={`w-full py-3 mt-4 border-none font-bold ${
              isAdminPortal 
                ? 'bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500' 
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
            }`} 
            loading={loading}
          >
            {isAdminPortal ? 'Enter Admin Console' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">
            Sign Up
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default SignIn;
