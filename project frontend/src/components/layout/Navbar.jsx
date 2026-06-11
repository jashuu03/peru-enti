import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar, 
  Users, 
  MessageSquare, 
  Video, 
  BarChart3, 
  LogOut, 
  User, 
  Menu, 
  X,
  History
} from 'lucide-react';

const Navbar = () => {
  const { user, signout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    signout();
    navigate('/signin');
  };

  const navLinks = [
    { name: 'Meetups', path: '/dashboard', icon: Calendar },
    { name: 'History', path: '/history', icon: History },
    { name: 'Networking', path: '/networking', icon: Users },
    { name: 'Messages', path: '/messages', icon: MessageSquare },
    { name: 'Latest Events', path: '/videos', icon: Video },
  ];

  // Add Analytics for Admin
  if (user.role === 'admin') {
    navLinks.push({ name: 'Analytics', path: '/analytics', icon: BarChart3 });
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass-panel sticky top-0 z-50 w-full px-6 py-4 mb-6 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 font-bold text-2xl">
          <img src="/logo.png" alt="Peru Enti Logo" className="w-9 h-9 object-contain" />
          <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">Peru Enti</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? 'text-indigo-400 bg-indigo-500/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>

        {/* User Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/profile"
            className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/5 transition"
            title="My Profile"
          >
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-indigo-500/50"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center border border-indigo-500/50 text-indigo-400 font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-medium text-gray-200">{user.name.split(' ')[0]}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-4">
          <Link to="/profile" className="w-8 h-8 rounded-full overflow-hidden border border-indigo-500/50">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-gray-400 hover:text-white transition"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden glass-panel mt-4 p-4 rounded-xl flex flex-col gap-2 animate-fadeIn">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition ${
                  isActive(link.path)
                    ? 'text-indigo-400 bg-indigo-500/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                <span>{link.name}</span>
              </Link>
            );
          })}
          <hr className="border-white/5 my-2" />
          <button
            onClick={() => {
              setIsOpen(false);
              handleLogout();
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-rose-400 hover:bg-rose-500/10 transition w-full text-left"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
