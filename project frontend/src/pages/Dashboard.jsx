import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import MeetupCard from '../components/meetup/MeetupCard';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import { Calendar, Plus, MessageSquareCode } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [meetups, setMeetups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMeetups = async () => {
    setLoading(true);
    try {
      // Mapping tabs to appropriate queries or fetching all
      const statusFilter = activeTab === 'upcoming' ? 'upcoming' : '';
      const response = await api.meetups.getAll(statusFilter, page);
      setMeetups(response.meetups);
      setTotalPages(response.pages);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch meetups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetups();
  }, [activeTab, page]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      {/* Welcome & Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight m-0 bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent">
            Welcome, {user?.name}!
          </h1>
          <p className="text-gray-400 mt-1">Discover, attend and register for exciting meetups around you.</p>
        </div>
        
        <Link to="/meetup/create">
          <Button className="flex items-center gap-1.5 py-2.5">
            <Plus size={16} />
            <span>Create Meetup</span>
          </Button>
        </Link>
      </div>

      {/* Tabs / Filters */}
      <div className="flex border-b border-white/10 mb-6">
        <button
          onClick={() => { setActiveTab('upcoming'); setPage(1); }}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'upcoming'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Upcoming Meetups
        </button>
        <button
          onClick={() => { setActiveTab('all'); setPage(1); }}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'all'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          All Meetups
        </button>
      </div>

      {/* Meetups Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      ) : meetups.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-2xl p-8 border border-white/5">
          <Calendar className="w-16 h-16 text-indigo-500/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Meetups Found</h3>
          <p className="text-gray-400 max-w-sm mx-auto mb-6">
            There are currently no meetups listed. Check back later or create a community meetup yourself!
          </p>
          <Link to="/meetup/create">
            <Button variant="outline">Create a Meetup Now</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {meetups.map((meetup) => (
              <MeetupCard key={meetup._id} meetup={meetup} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="secondary"
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm font-semibold text-gray-300">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
