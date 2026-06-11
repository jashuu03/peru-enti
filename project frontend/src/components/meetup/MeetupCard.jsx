import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

const MeetupCard = ({ meetup }) => {
  const formattedDate = new Date(meetup.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const isExpired = new Date() > new Date(meetup.registrationDeadline);
  const capacityReached = meetup.registeredCount >= meetup.capacity;

  return (
    <Card className="h-full overflow-hidden flex flex-col p-0">
      {/* Banner */}
      <div className="relative h-48 w-full bg-slate-800">
        {meetup.banner ? (
          <img
            src={meetup.banner}
            alt={meetup.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900/60 to-slate-900 flex items-center justify-center text-indigo-400 font-bold uppercase tracking-wider text-sm p-4 text-center">
            {meetup.title}
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-md ${
            meetup.status === 'completed'
              ? 'bg-slate-900/80 border-slate-700 text-gray-400'
              : meetup.status === 'ongoing'
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 animate-pulse'
              : isExpired
              ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
              : capacityReached
              ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
              : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
          }`}>
            {meetup.status === 'completed'
              ? 'Completed'
              : meetup.status === 'ongoing'
              ? 'Ongoing Live'
              : isExpired
              ? 'Deadline Passed'
              : capacityReached
              ? 'Full Capacity'
              : 'Open'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Organizer */}
          <div className="flex items-center gap-2 mb-3">
            {meetup.organizer?.profilePicture ? (
              <img
                src={meetup.organizer.profilePicture}
                alt={meetup.organizer.name}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                {meetup.organizer?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs text-gray-400 font-medium">
              Hosted by {meetup.organizer?.name}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-3 hover:text-indigo-400 transition line-clamp-1">
            <Link to={`/meetup/${meetup._id}`}>{meetup.title}</Link>
          </h3>

          {/* Details */}
          <div className="space-y-2.5 mb-6 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-indigo-400 shrink-0" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-indigo-400 shrink-0" />
              <span>{meetup.startTime} - {meetup.endTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-indigo-400 shrink-0" />
              <span className="line-clamp-1">{meetup.venue}</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            <Users size={14} className="text-indigo-400" />
            <span>{meetup.registeredCount || 0} / {meetup.capacity} registered</span>
          </div>
          
          <Link
            to={`/meetup/${meetup._id}`}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
          >
            View Details &rarr;
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default MeetupCard;
