import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Calendar, Clock, MapPin, Users, User, ArrowLeft, CheckCircle, Radio, Navigation, X, MessageSquare, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

const MeetupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meetup, setMeetup] = useState(null);
  const [loading, setLoading] = useState(true);

  // Registration check state
  const [regStatus, setRegStatus] = useState({ isRegistered: false, status: null });
  const [submittingReg, setSubmittingReg] = useState(false);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  // Registrations modal
  const [isRegListOpen, setIsRegListOpen] = useState(false);
  const [regListTab, setRegListTab] = useState('registered'); // 'registered' | 'checkedIn'

  // Form responses
  const [responses, setResponses] = useState({
    whyAttend: '',
    whatLearn: '',
    whatContribute: ''
  });

  const [activeTab, setActiveTab] = useState('registered');

  const fetchMeetupDetails = async () => {
    try {
      const data = await api.meetups.getOne(id);
      setMeetup(data);
      const statusData = await api.registrations.getStatus(id);
      setRegStatus(statusData);
    } catch (err) {
      toast.error(err.message || 'Failed to load meetup details');
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchMeetupDetails();
      setLoading(false);
    };
    loadData();
  }, [id]);

  const handleResponseChange = (e) => {
    setResponses({ ...responses, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!responses.whyAttend || !responses.whatLearn || !responses.whatContribute) {
      toast.error('Please answer all questions');
      return;
    }
    setSubmittingReg(true);
    try {
      await api.registrations.register({ meetupId: id, ...responses });
      toast.success('Successfully registered for this meetup!');
      setIsRegModalOpen(false);
      setResponses({ whyAttend: '', whatLearn: '', whatContribute: '' });
      await fetchMeetupDetails();
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setSubmittingReg(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await api.registrations.checkIn(id);
      toast.success('Successfully checked in! Enjoy the event!');
      await fetchMeetupDetails();
    } catch (err) {
      toast.error(err.message || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!meetup) return null;

  const formattedDate = new Date(meetup.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const deadlinePassed = new Date() > new Date(meetup.registrationDeadline);
  const capacityReached = (meetup.registeredCount || 0) >= meetup.capacity;
  const eventStarted = new Date() >= new Date(new Date(meetup.date).setHours(0, 0, 0, 0));
  const isLive = meetup.status === 'ongoing';

  const capacityPercent = meetup.capacity > 0
    ? Math.min(100, Math.round((meetup.registeredCount || 0) / meetup.capacity * 100))
    : 0;

  const activeMembersList = activeTab === 'registered' ? meetup.registeredMembers : meetup.checkedInMembers;
  const modalList = regListTab === 'registered' ? meetup.registeredMembers : meetup.checkedInMembers;

  const mapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(meetup.venue)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
  const mapsLink = meetup.mapsLink || `https://www.google.com/maps/search/${encodeURIComponent(meetup.venue)}`;

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      {/* Back Button */}
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6 transition">
        <ArrowLeft size={16} />
        <span>Back to Meetups</span>
      </Link>

      {/* LIVE BANNER */}
      {isLive && (
        <div className="mb-6 flex items-center gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-emerald-500/20 border border-emerald-500/30 backdrop-blur-sm animate-pulse-subtle">
          <div className="relative shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <Radio size={22} className="text-emerald-400 relative z-10" />
          </div>
          <div>
            <p className="text-emerald-400 font-extrabold text-sm uppercase tracking-wider">🔴 Live Now — Event In Progress</p>
            <p className="text-gray-300 text-xs mt-0.5">This meetup is currently happening. Check in if you're attending!</p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Side: Banner, Info, Map, Attendees */}
        <div className="lg:col-span-2 space-y-6">

          {/* Banner */}
          <div className="w-full h-80 rounded-2xl overflow-hidden bg-slate-800 border border-white/5 relative">
            {meetup.banner ? (
              <img src={meetup.banner} alt={meetup.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-900/40 via-[#0f172a] to-slate-900 flex items-center justify-center text-center p-6">
                <h1 className="text-3xl font-extrabold text-indigo-400 tracking-wide uppercase">{meetup.title}</h1>
              </div>
            )}
            {isLive && (
              <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-emerald-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm shadow">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            )}
          </div>

          {/* Title & Description Card */}
          <Card hoverEffect={false} className="p-8">
            <h1 className="text-3xl font-extrabold text-white mb-4 leading-tight">{meetup.title}</h1>

            <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-white/5 border border-white/5 w-fit">
              {meetup.organizer?.profilePicture ? (
                <img src={meetup.organizer.profilePicture} alt={meetup.organizer.name} className="w-10 h-10 rounded-full object-cover border border-indigo-500/30" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 font-bold">
                  {meetup.organizer?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Organizer</p>
                <Link to={meetup.organizer?._id === user._id ? '/profile' : `/user/${meetup.organizer?._id}`} className="text-sm font-bold text-white hover:text-indigo-400 transition">
                  {meetup.organizer?.name}
                </Link>
                {meetup.organizer?.profession && (
                  <p className="text-xs text-gray-400">{meetup.organizer.profession} at {meetup.organizer.company}</p>
                )}
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-3 border-b border-white/10 pb-2">About Event</h3>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{meetup.description}</p>
          </Card>

          {/* Venue Map */}
          <Card hoverEffect={false} className="overflow-hidden p-0">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-indigo-400" />
                <h3 className="font-bold text-white text-sm">Venue Location</h3>
              </div>
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20"
              >
                <Navigation size={13} />
                Get Directions
              </a>
            </div>
            <div className="relative w-full h-56 bg-slate-800">
              <iframe
                title="Venue Map"
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.85) contrast(1.1)' }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={mapsEmbedUrl}
              />
            </div>
            <div className="px-4 py-3 bg-white/5 text-xs text-gray-400 flex items-center gap-2">
              <MapPin size={12} className="text-indigo-400 shrink-0" />
              <span>{meetup.venue}</span>
            </div>
          </Card>

          {/* Attendee Sections */}
          <Card hoverEffect={false} className="p-6">
            <div className="flex items-center justify-between border-b border-white/10 mb-6 pb-2">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('registered')}
                  className={`pb-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
                    activeTab === 'registered' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Registered ({meetup.registeredCount || 0})
                </button>
                <button
                  onClick={() => setActiveTab('checkedIn')}
                  className={`pb-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
                    activeTab === 'checkedIn' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Checked In ({meetup.checkedInCount || 0})
                </button>
              </div>
              <button
                onClick={() => setIsRegListOpen(true)}
                className="text-xs font-bold text-teal-400 hover:text-teal-300 transition px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20"
              >
                View All Profiles →
              </button>
            </div>

            {activeMembersList.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No users in this list yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeMembersList.map((member) => {
                  const targetUser = member.user;
                  return (
                    <div key={targetUser._id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition duration-200">
                      {targetUser.profilePicture ? (
                        <img src={targetUser.profilePicture} alt={targetUser.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0">
                          {targetUser.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link
                          to={targetUser._id === user._id ? '/profile' : `/user/${targetUser._id}`}
                          className="text-sm font-bold text-white hover:text-indigo-400 transition truncate block"
                        >
                          {targetUser.name}
                        </Link>
                        {targetUser.profession && (
                          <p className="text-xs text-gray-400 truncate">{targetUser.profession} at {targetUser.company}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: Sidebar */}
        <div className="space-y-6">
          <Card hoverEffect={false} className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Event Details</h3>

            <div className="space-y-4 text-sm text-gray-300">
              <div className="flex items-start gap-3">
                <Calendar className="text-indigo-400 mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="font-semibold text-white">Date</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formattedDate}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="text-indigo-400 mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="font-semibold text-white">Time</p>
                  <p className="text-xs text-gray-400 mt-0.5">{meetup.startTime} - {meetup.endTime}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="text-indigo-400 mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="font-semibold text-white">Venue</p>
                  <p className="text-xs text-gray-400 mt-0.5">{meetup.venue}</p>
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition inline-flex items-center gap-0.5 mt-1"
                  >
                    View on Google Maps →
                  </a>
                </div>
              </div>

              {/* Capacity Section with animated progress bar */}
              <div className="flex items-start gap-3">
                <Users className="text-indigo-400 mt-0.5 shrink-0" size={18} />
                <div className="flex-1">
                  <p className="font-semibold text-white">Capacity</p>
                  <div className="flex items-center justify-between mt-1 mb-2">
                    <p className="text-xs text-gray-400">{meetup.registeredCount || 0} of {meetup.capacity} registered</p>
                    <span className={`text-xs font-bold ${capacityPercent >= 90 ? 'text-rose-400' : capacityPercent >= 70 ? 'text-amber-400' : 'text-teal-400'}`}>
                      {capacityPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ease-out ${
                        capacityPercent >= 90 ? 'bg-rose-500' : capacityPercent >= 70 ? 'bg-amber-400' : 'bg-teal-500'
                      }`}
                      style={{ width: `${capacityPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {meetup.capacity - (meetup.registeredCount || 0)} spots remaining
                  </p>
                </div>
              </div>
            </div>

            {/* Registration Action Buttons */}
            <div className="mt-6 border-t border-white/5 pt-6 flex flex-col gap-3">
              {regStatus.isRegistered ? (
                <>
                  <div className="flex items-center justify-center gap-1.5 p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold text-sm">
                    <CheckCircle size={16} />
                    <span>You're Registered</span>
                  </div>

                  {regStatus.status === 'registered' && (
                    <Button
                      onClick={handleCheckIn}
                      className="w-full py-3"
                      loading={checkingIn}
                      disabled={!eventStarted}
                      title={!eventStarted ? 'Check-in opens on event day' : 'Confirm your attendance'}
                    >
                      {isLive ? '🔴 Check-In Now (Live!)' : 'Check-In'}
                    </Button>
                  )}

                  {regStatus.status === 'checked-in' && (
                    <div className="flex items-center justify-center gap-1.5 p-3 rounded-lg bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 font-bold text-sm">
                      <CheckCircle size={16} />
                      <span>Checked-In & Present</span>
                    </div>
                  )}
                </>
              ) : (
                <Button
                  onClick={() => setIsRegModalOpen(true)}
                  className="w-full py-3"
                  disabled={deadlinePassed || capacityReached}
                >
                  {deadlinePassed ? 'Registration Closed' : capacityReached ? 'Event Full' : 'Register for Event'}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Registration Form Modal */}
      <Modal isOpen={isRegModalOpen} onClose={() => setIsRegModalOpen(false)} title="Complete Registration">
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <p className="text-xs text-gray-400">
            Please answer these questions to register for the meetup. The organizer will review your profile.
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Why do you want to attend? *</label>
            <textarea
              name="whyAttend"
              value={responses.whyAttend}
              onChange={handleResponseChange}
              placeholder="E.g., Looking to meet like-minded founders..."
              rows={3}
              className="glass-input p-3 rounded-lg w-full text-sm resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">What do you want to learn? *</label>
            <textarea
              name="whatLearn"
              value={responses.whatLearn}
              onChange={handleResponseChange}
              placeholder="E.g., Best practices in UI/UX optimization..."
              rows={3}
              className="glass-input p-3 rounded-lg w-full text-sm resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">What can you contribute? *</label>
            <textarea
              name="whatContribute"
              value={responses.whatContribute}
              onChange={handleResponseChange}
              placeholder="E.g., I can share insights on launching Node.js backends..."
              rows={3}
              className="glass-input p-3 rounded-lg w-full text-sm resize-none"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" loading={submittingReg}>Submit & Register</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setIsRegModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Detailed Registrations Modal */}
      {isRegListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-extrabold text-white">Event Registrations</h3>
                <p className="text-xs text-gray-400 mt-0.5">{meetup.title}</p>
              </div>
              <button
                onClick={() => setIsRegListOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 shrink-0">
              <button
                onClick={() => setRegListTab('registered')}
                className={`flex-1 py-3 text-sm font-bold transition-all ${
                  regListTab === 'registered' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'
                }`}
              >
                Registered ({meetup.registeredCount || 0})
              </button>
              <button
                onClick={() => setRegListTab('checkedIn')}
                className={`flex-1 py-3 text-sm font-bold transition-all ${
                  regListTab === 'checkedIn' ? 'text-teal-400 border-b-2 border-teal-500' : 'text-gray-400 hover:text-white'
                }`}
              >
                Checked In ({meetup.checkedInCount || 0})
              </button>
            </div>

            {/* Members list */}
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {modalList.length === 0 ? (
                <div className="text-center py-16 text-gray-500 text-sm">No attendees in this category yet.</div>
              ) : (
                modalList.map((member) => {
                  const targetUser = member.user;
                  return (
                    <div key={targetUser._id} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/20 transition">
                      {/* Avatar */}
                      {targetUser.profilePicture ? (
                        <img src={targetUser.profilePicture} alt={targetUser.name} className="w-12 h-12 rounded-full object-cover shrink-0 border border-indigo-500/20" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-extrabold text-lg shrink-0">
                          {targetUser.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={targetUser._id === user._id ? '/profile' : `/user/${targetUser._id}`}
                          onClick={() => setIsRegListOpen(false)}
                          className="font-bold text-white hover:text-indigo-400 transition text-sm block"
                        >
                          {targetUser.name}
                          {targetUser._id === user._id && <span className="ml-2 text-xs text-indigo-400 font-normal">(You)</span>}
                        </Link>

                        {targetUser.profession && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Briefcase size={11} className="text-gray-500 shrink-0" />
                            <p className="text-xs text-gray-400 truncate">{targetUser.profession}{targetUser.company ? ` at ${targetUser.company}` : ''}</p>
                          </div>
                        )}

                        {/* Registration Q&A */}
                        {member.responses && (
                          <div className="mt-2 space-y-1">
                            {member.responses.whyAttend && (
                              <p className="text-[11px] text-gray-500 italic line-clamp-1">
                                <span className="text-gray-400 not-italic font-medium">Goal:</span> {member.responses.whyAttend}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Chat Button */}
                      {targetUser._id !== user._id && (
                        <Link
                          to={`/messages?userId=${targetUser._id}`}
                          onClick={() => setIsRegListOpen(false)}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:text-white transition text-xs font-bold"
                        >
                          <MessageSquare size={13} />
                          <span>Chat</span>
                        </Link>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetupDetail;
