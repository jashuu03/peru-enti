import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import {
  BarChart3,
  Users,
  Calendar,
  CheckSquare,
  Percent,
  Download,
  Award,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';

const Analytics = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [meetups, setMeetups] = useState([]);
  const [selectedMeetupId, setSelectedMeetupId] = useState('');
  const [meetupStats, setMeetupStats] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingMeetupStats, setLoadingMeetupStats] = useState(false);

  useEffect(() => {
    const fetchDashboardAndMeetups = async () => {
      try {
        setLoadingDashboard(true);
        const stats = await api.analytics.getDashboard();
        setDashboardStats(stats);

        // Fetch meetups for dropdown
        const meetupsData = await api.meetups.getAll();
        setMeetups(meetupsData);
        if (meetupsData.length > 0) {
          setSelectedMeetupId(meetupsData[0]._id);
        }
      } catch (err) {
        toast.error(err.message || 'Failed to fetch dashboard stats');
      } finally {
        setLoadingDashboard(false);
      }
    };

    fetchDashboardAndMeetups();
  }, []);

  useEffect(() => {
    if (!selectedMeetupId) return;

    const fetchMeetupStats = async () => {
      try {
        setLoadingMeetupStats(true);
        const stats = await api.analytics.getMeetup(selectedMeetupId);
        setMeetupStats(stats);
      } catch (err) {
        toast.error(err.message || 'Failed to fetch meetup analytics');
      } finally {
        setLoadingMeetupStats(false);
      }
    };

    fetchMeetupStats();
  }, [selectedMeetupId]);

  if (loadingDashboard) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-4 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight m-0 bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent">
          Admin Analytics Dashboard
        </h1>
        <p className="text-gray-400 mt-1">
          Monitor community activity, event registrations, and attendee metrics.
        </p>
      </div>

      {/* Aggregate Stats Row */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card hoverEffect={true} className="p-6 border border-white/5 bg-white/5 relative overflow-hidden">
            <div className="absolute right-4 top-4 bg-indigo-500/10 p-3 rounded-xl text-indigo-400">
              <Users size={24} />
            </div>
            <p className="text-sm font-semibold uppercase text-gray-400 tracking-wider">Total Members</p>
            <h3 className="text-3xl font-extrabold text-white mt-2">{dashboardStats.totalUsers}</h3>
            <p className="text-xs text-gray-500 mt-1">Registered non-admin users</p>
          </Card>

          <Card hoverEffect={true} className="p-6 border border-white/5 bg-white/5 relative overflow-hidden">
            <div className="absolute right-4 top-4 bg-teal-500/10 p-3 rounded-xl text-teal-400">
              <Calendar size={24} />
            </div>
            <p className="text-sm font-semibold uppercase text-gray-400 tracking-wider">Total Meetups</p>
            <h3 className="text-3xl font-extrabold text-white mt-2">{dashboardStats.totalMeetups}</h3>
            <p className="text-xs text-gray-500 mt-1">Events scheduled & completed</p>
          </Card>

          <Card hoverEffect={true} className="p-6 border border-white/5 bg-white/5 relative overflow-hidden">
            <div className="absolute right-4 top-4 bg-amber-500/10 p-3 rounded-xl text-amber-400">
              <CheckSquare size={24} />
            </div>
            <p className="text-sm font-semibold uppercase text-gray-400 tracking-wider">Registrations</p>
            <h3 className="text-3xl font-extrabold text-white mt-2">{dashboardStats.totalRegistrations}</h3>
            <p className="text-xs text-gray-500 mt-1">{dashboardStats.totalCheckIns} users checked-in</p>
          </Card>

          <Card hoverEffect={true} className="p-6 border border-white/5 bg-white/5 relative overflow-hidden">
            <div className="absolute right-4 top-4 bg-indigo-500/10 p-3 rounded-xl text-indigo-400">
              <Percent size={24} />
            </div>
            <p className="text-sm font-semibold uppercase text-gray-400 tracking-wider">Avg. Attendance</p>
            <h3 className="text-3xl font-extrabold text-white mt-2">{dashboardStats.attendancePercentage}%</h3>
            <p className="text-xs text-gray-500 mt-1">Ratio of check-ins to registrations</p>
          </Card>
        </div>
      )}

      {/* Meetup-Specific Analytics & Export Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Card: Selector and Stats */}
        <Card hoverEffect={false} className="p-6 lg:col-span-2 border border-white/5 bg-white/5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-teal-400" />
              <span>Meetup Analytics & Exports</span>
            </h3>

            {meetups.length > 0 && (
              <select
                value={selectedMeetupId}
                onChange={(e) => setSelectedMeetupId(e.target.value)}
                className="glass-input px-3 py-1.5 rounded-lg text-sm bg-[#090d16] border border-white/10 text-white min-w-[200px]"
              >
                {meetups.map((m) => (
                  <option key={m._id} value={m._id} className="bg-[#090d16] text-white">
                    {m.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {meetups.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Create meetups to view detailed metrics.
            </div>
          ) : loadingMeetupStats ? (
            <div className="flex justify-center items-center py-12">
              <Spinner size="md" />
            </div>
          ) : meetupStats ? (
            <div className="space-y-6">
              {/* Meetup Stats Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Capacity Limit</p>
                  <p className="text-lg font-bold text-white mt-1">{meetupStats.capacity}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Total Registered</p>
                  <p className="text-lg font-bold text-white mt-1">{meetupStats.totalRegistrations}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Checked In</p>
                  <p className="text-lg font-bold text-white mt-1">{meetupStats.totalCheckIns}</p>
                </div>
              </div>

              {/* Progress bar for capacity / registrations */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-400 mb-1.5">
                  <span>Registration Fill Rate</span>
                  <span>{meetupStats.capacity > 0 ? Math.round((meetupStats.totalRegistrations / meetupStats.capacity) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, meetupStats.capacity > 0 ? (meetupStats.totalRegistrations / meetupStats.capacity) * 100 : 0)}%` }}
                  />
                </div>
              </div>

              {/* Attendance Fill Rate */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-400 mb-1.5">
                  <span>Meetup Attendance Rate</span>
                  <span>{meetupStats.attendancePercentage}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div
                    className="bg-teal-500 h-2 rounded-full"
                    style={{ width: `${meetupStats.attendancePercentage}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons for CSV Downloads */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <a
                  href={api.analytics.exportAttendeesUrl(selectedMeetupId)}
                  download
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2 py-3 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10">
                    <Download size={16} />
                    <span>Export Attendees (CSV)</span>
                  </Button>
                </a>

                <a
                  href={api.analytics.exportResponsesUrl(selectedMeetupId)}
                  download
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2 py-3 border-teal-500/30 text-teal-400 hover:bg-teal-500/10">
                    <FileSpreadsheet size={16} />
                    <span>Export Responses (CSV)</span>
                  </Button>
                </a>
              </div>
            </div>
          ) : null}
        </Card>

        {/* Right Card: Most Active Users */}
        <Card hoverEffect={false} className="p-6 border border-white/5 bg-white/5 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Award size={20} className="text-amber-400" />
              <span>Most Active Attendees</span>
            </h3>

            {dashboardStats.mostActiveUsers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No check-ins recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {dashboardStats.mostActiveUsers.map((item, idx) => {
                  const u = item.user;
                  if (!u) return null;
                  return (
                    <div key={u._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {u.profilePicture ? (
                            <img
                              src={u.profilePicture}
                              alt={u.name}
                              className="w-10 h-10 rounded-full object-cover border border-indigo-500/30"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-secondary-950 font-extrabold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-secondary-950">
                            #{idx + 1}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-tight">{u.name}</p>
                          <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                            {u.profession} {u.company && `@ ${u.company}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-extrabold text-teal-400">{item.checkInCount} events</p>
                        <p className="text-[9px] text-gray-500 uppercase font-semibold">Attended</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
