import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { User, Mail, Lock, Briefcase, Building2, Tag, Upload, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

const SignUp = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    profession: '',
    company: '',
    lookingFor: ''
  });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('Profile picture must be less than 5MB');
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Name, email and password are required');
      return;
    }

    setLoading(true);
    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('password', formData.password);
    data.append('profession', formData.profession);
    data.append('company', formData.company);
    data.append('lookingFor', formData.lookingFor);
    if (file) {
      data.append('profilePicture', file);
    }

    try {
      await signup(data);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-xl p-8 shadow-2xl relative overflow-hidden" hoverEffect={false}>
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/logo.png" alt="Peru Enti Logo" className="w-16 h-16 object-contain mb-3" />
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Create your account</h2>
          <p className="text-gray-400 mt-2 text-sm">Join Peru Enti to connect, learn and grow with your local community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="relative group cursor-pointer">
              <input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <label htmlFor="avatar-upload" className="cursor-pointer block">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500/50 group-hover:border-indigo-400 transition"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex flex-col items-center justify-center text-gray-400 group-hover:bg-white/10 group-hover:text-white transition">
                    <Camera size={24} className="mb-1" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Upload</span>
                  </div>
                )}
                <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full shadow border border-dark-bg">
                  <Upload size={12} />
                </div>
              </label>
            </div>
            <span className="text-xs text-gray-500 mt-2">Max size 5MB (JPG, PNG)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="glass-input pl-10 pr-4 py-2.5 rounded-lg w-full text-sm"
                  required
                />
              </div>
            </div>

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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Password</label>
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

            {/* Profession */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Profession</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <Briefcase size={16} />
                </span>
                <input
                  type="text"
                  name="profession"
                  value={formData.profession}
                  onChange={handleChange}
                  placeholder="Software Engineer"
                  className="glass-input pl-10 pr-4 py-2.5 rounded-lg w-full text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Company</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <Building2 size={16} />
                </span>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Google"
                  className="glass-input pl-10 pr-4 py-2.5 rounded-lg w-full text-sm"
                />
              </div>
            </div>

            {/* Looking For (interests) */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Looking For (Interests)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <Tag size={16} />
                </span>
                <input
                  type="text"
                  name="lookingFor"
                  value={formData.lookingFor}
                  onChange={handleChange}
                  placeholder="React, Networking, Startups"
                  className="glass-input pl-10 pr-4 py-2.5 rounded-lg w-full text-sm"
                />
              </div>
              <span className="text-[10px] text-gray-500 mt-1 block">Comma separated list</span>
            </div>
          </div>

          <Button type="submit" className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 border-none" loading={loading}>
            Sign Up
          </Button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/signin" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default SignUp;
