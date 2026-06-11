import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { User, Briefcase, Building2, Tag, Mail, MessageSquare, ArrowLeft, UserPlus, UserCheck, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [connStatus, setConnStatus] = useState({ status: 'none', connectionId: null, isRequester: false });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const uData = await api.users.getProfile(id);
        setProfile(uData);
        
        const cStatus = await api.connections.getStatus(id);
        setConnStatus(cStatus);
      } catch (err) {
        toast.error(err.message || 'Failed to load user profile');
        navigate('/networking');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const handleConnect = async () => {
    setActionLoading(true);
    try {
      const res = await api.connections.sendRequest(id);
      toast.success('Connection request sent!');
      setConnStatus({ status: 'pending', connectionId: res._id, isRequester: true });
    } catch (err) {
      toast.error(err.message || 'Failed to send connection request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await api.connections.accept(connStatus.connectionId);
      toast.success('Connection accepted!');
      setConnStatus(prev => ({ ...prev, status: 'accepted' }));
    } catch (err) {
      toast.error(err.message || 'Failed to accept connection');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-4">
      {/* Back Button */}
      <Link to="/networking" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6 transition">
        <ArrowLeft size={16} />
        <span>Back to Directory</span>
      </Link>

      <Card hoverEffect={false} className="p-8 shadow-2xl relative overflow-hidden text-center">
        {/* Glow backdrop */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

        {/* Profile Pic */}
        <div className="relative mx-auto w-32 h-32 mb-6">
          {profile.profilePicture ? (
            <img
              src={profile.profilePicture}
              alt={profile.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-indigo-500/20 shadow-xl"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-indigo-600/20 border-4 border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-4xl shadow-xl">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
          
          {/* Status Indicator */}
          {profile.isOnline && (
            <span className="absolute bottom-2 right-2 w-5 h-5 bg-teal-500 border-4 border-dark-bg rounded-full" title="Online" />
          )}
        </div>

        {/* User Details */}
        <h2 className="text-3xl font-extrabold text-white">{profile.name}</h2>
        
        {profile.profession && (
          <p className="text-indigo-400 font-semibold mt-1.5 flex items-center justify-center gap-1">
            <Briefcase size={16} />
            <span>{profile.profession}</span>
          </p>
        )}

        {profile.company && (
          <p className="text-gray-400 text-sm mt-1 flex items-center justify-center gap-1">
            <Building2 size={14} />
            <span>{profile.company}</span>
          </p>
        )}

        {/* Social Actions */}
        <div className="flex justify-center gap-3 mt-8 border-t border-white/5 pt-6">
          {connStatus.status === 'accepted' ? (
            <>
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-bold">
                <UserCheck size={16} />
                <span>Connected</span>
              </div>
              <Link to={`/messages?userId=${profile._id}`}>
                <Button className="flex items-center gap-1.5">
                  <MessageSquare size={16} />
                  <span>Send Message</span>
                </Button>
              </Link>
            </>
          ) : connStatus.status === 'pending' ? (
            connStatus.isRequester ? (
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-gray-400 text-sm font-semibold">
                <Clock size={16} />
                <span>Request Pending</span>
              </div>
            ) : (
              <Button onClick={handleAccept} loading={actionLoading} className="flex items-center gap-1.5">
                <UserCheck size={16} />
                <span>Accept Invitation</span>
              </Button>
            )
          ) : (
            <Button onClick={handleConnect} loading={actionLoading} className="flex items-center gap-1.5">
              <UserPlus size={16} />
              <span>Connect</span>
            </Button>
          )}
        </div>

        {/* Interests Section */}
        {profile.lookingFor && profile.lookingFor.length > 0 && (
          <div className="mt-8 border-t border-white/5 pt-6 text-left">
            <h3 className="text-xs font-semibold uppercase text-gray-400 mb-3 tracking-wider flex items-center gap-1">
              <Tag size={12} className="text-indigo-400" />
              <span>Interests & Looking For</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.lookingFor.map((interest, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-white/5 border border-white/5 text-gray-300 rounded-lg text-xs font-semibold hover:border-indigo-500/30 transition duration-150"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UserProfile;
