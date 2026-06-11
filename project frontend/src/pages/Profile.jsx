import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import { User, Briefcase, Building2, Tag, Upload, Camera, Users, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfileState } = useAuth();
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(true);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    profession: user?.profession || '',
    company: user?.company || '',
    lookingFor: user?.lookingFor?.join(', ') || ''
  });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profilePicture || '');

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const data = await api.connections.getAll();
        setConnections(data);
      } catch (err) {
        console.error('Failed to load connections:', err.message);
      } finally {
        setLoadingConnections(false);
      }
    };
    fetchConnections();
  }, []);

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
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }

    setLoading(true);
    const data = new FormData();
    data.append('name', formData.name);
    data.append('profession', formData.profession);
    data.append('company', formData.company);
    data.append('lookingFor', formData.lookingFor);
    if (file) {
      data.append('profilePicture', file);
    }

    try {
      const updatedUser = await api.users.updateProfile(data);
      updateProfileState(updatedUser);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight m-0 bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent">
          My Profile
        </h1>
        <p className="text-gray-400 mt-1">Manage your professional bio, interests, and active connections.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Edit Profile Form */}
        <div className="lg:col-span-2">
          <Card hoverEffect={false} className="p-8 shadow-2xl relative overflow-hidden">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Avatar Upload */}
              <div className="flex flex-col items-center justify-center mb-4">
                <div className="relative group cursor-pointer">
                  <input
                    type="file"
                    id="profile-avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="profile-avatar-upload" className="cursor-pointer block">
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
                    className="glass-input pl-10 pr-4 py-2.5 rounded-lg w-full text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      placeholder="Company Name"
                      className="glass-input pl-10 pr-4 py-2.5 rounded-lg w-full text-sm"
                    />
                  </div>
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
                    placeholder="React, Startups, Web3"
                    className="glass-input pl-10 pr-4 py-2.5 rounded-lg w-full text-sm"
                  />
                </div>
                <span className="text-[10px] text-gray-500 mt-1 block">Comma separated list</span>
              </div>

              <Button type="submit" className="w-full py-3" loading={loading}>
                Save Changes
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Side: Connections List */}
        <div>
          <Card hoverEffect={false} className="p-6 h-full flex flex-col">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2 flex items-center gap-1.5">
              <Users size={18} className="text-indigo-400" />
              <span>Connections ({connections.length})</span>
            </h3>

            {loadingConnections ? (
              <div className="flex justify-center items-center py-10 flex-1">
                <Spinner size="md" />
              </div>
            ) : connections.length === 0 ? (
              <div className="text-center py-10 flex-1 flex flex-col justify-center items-center text-gray-500 text-sm">
                <p>No connections yet.</p>
                <Link to="/networking" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 mt-2 block transition">
                  Explore directory &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[400px] pr-1 flex-1">
                {connections.map((conn) => (
                  <div key={conn._id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {conn.user.profilePicture ? (
                        <img
                          src={conn.user.profilePicture}
                          alt={conn.user.name}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                          {conn.user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link to={`/user/${conn.user._id}`} className="text-sm font-bold text-white hover:text-indigo-400 transition truncate block">
                          {conn.user.name}
                        </Link>
                        {conn.user.profession && (
                          <p className="text-xs text-gray-400 truncate">{conn.user.profession}</p>
                        )}
                      </div>
                    </div>
                    
                    <Link to={`/messages?userId=${conn.user._id}`} title="Chat">
                      <button className="p-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 rounded-lg text-indigo-400 hover:text-white transition">
                        <MessageSquare size={14} />
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
