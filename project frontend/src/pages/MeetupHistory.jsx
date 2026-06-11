import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import { Calendar, Users, Percent, CheckSquare, ArrowRight, Hourglass, Video, Play } from 'lucide-react';
import toast from 'react-hot-toast';

// Fallback curated YouTube tech event videos for past meetups with no uploaded recording
const FALLBACK_VIDEOS = [
  {
    id: 'fv',
    title: 'React 19 Full Keynote — React Conf',
    url: 'https://www.youtube.com/embed/T8TZQ6k4SLE',
    thumbnail: 'https://img.youtube.com/vi/T8TZQ6k4SLE/hqdefault.jpg'
  },
  {
    id: 'fv2',
    title: 'Building Scalable Backends with Node.js',
    url: 'https://www.youtube.com/embed/ENrzD9HAZK4',
    thumbnail: 'https://img.youtube.com/vi/ENrzD9HAZK4/hqdefault.jpg'
  },
  {
    id: 'fv3',
    title: 'Modern UI Design Systems — Google I/O',
    url: 'https://www.youtube.com/embed/Xynt3C2zCBA',
    thumbnail: 'https://img.youtube.com/vi/Xynt3C2zCBA/hqdefault.jpg'
  },
  {
    id: 'fv4',
    title: 'Full Stack Dev Meetup Highlight Reel',
    url: 'https://www.youtube.com/embed/7CqJlxBYj-M',
    thumbnail: 'https://img.youtube.com/vi/7CqJlxBYj-M/hqdefault.jpg'
  }
];

const MeetupHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiVideos, setApiVideos] = useState([]);
  const [playingVideo, setPlayingVideo] = useState(null); // { url, title }

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [histData, vidData] = await Promise.all([
          api.meetups.getHistory(),
          api.videos.getAll().catch(() => []) // graceful fail
        ]);
        setHistory(histData);
        setApiVideos(vidData);
      } catch (err) {
        toast.error(err.message || 'Failed to load meetup history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Match a video to a meetup by its meetup field, or return a cycling fallback
  const getVideoForMeetup = (meetupId, index) => {
    const linked = apiVideos.find(v => v.meetup?._id === meetupId || v.meetup === meetupId);
    if (linked) {
      const isYt = linked.filePath.includes('youtube.com') || linked.filePath.includes('youtu.be');
      return {
        url: isYt
          ? linked.filePath.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/').replace('youtube.com/shorts/', 'youtube.com/embed/')
          : linked.filePath,
        title: linked.title,
        isYoutube: isYt,
        isUploaded: true
      };
    }
    // Fallback — cycle through curated list
    const fb = FALLBACK_VIDEOS[index % FALLBACK_VIDEOS.length];
    return { url: fb.url, title: fb.title, isYoutube: true, isUploaded: false };
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight m-0 bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent">
          Meetup History
        </h1>
        <p className="text-gray-400 mt-1">Review past events, engagement, attendance metrics, and watch event recordings.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-2xl p-8 border border-white/5">
          <Hourglass className="w-16 h-16 text-indigo-500/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Past Meetups</h3>
          <p className="text-gray-400 max-w-sm mx-auto">There are no past events recorded in the history log yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {history.map((meetup, index) => {
            const formattedDate = new Date(meetup.date).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric'
            });
            const videoInfo = getVideoForMeetup(meetup._id, index);

            return (
              <Card key={meetup._id} hoverEffect={false} className="overflow-hidden p-0">
                <div className="grid grid-cols-1 lg:grid-cols-5">

                  {/* Video thumbnail side */}
                  <div className="lg:col-span-2 relative bg-black aspect-video lg:aspect-auto min-h-[200px] group cursor-pointer"
                    onClick={() => setPlayingVideo({ url: videoInfo.url, title: videoInfo.title, isYoutube: videoInfo.isYoutube })}>
                    {/* Thumbnail */}
                    <img
                      src={`https://img.youtube.com/vi/${videoInfo.url.split('/embed/')[1]?.split('?')[0]}/hqdefault.jpg`}
                      alt={videoInfo.title}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play size={22} className="text-white ml-1" fill="white" />
                      </div>
                      <span className="text-xs text-white/80 font-semibold text-center px-4 line-clamp-2">{videoInfo.title}</span>
                    </div>
                    {!videoInfo.isUploaded && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-[10px] text-gray-300 px-2 py-1 rounded-full backdrop-blur-sm">
                        <Video size={10} />
                        <span>Event Highlight</span>
                      </div>
                    )}
                    {videoInfo.isUploaded && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-teal-500/80 text-[10px] text-white px-2 py-1 rounded-full backdrop-blur-sm font-bold">
                        <Video size={10} />
                        <span>Official Recording</span>
                      </div>
                    )}
                  </div>

                  {/* Info side */}
                  <div className="lg:col-span-3 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs text-gray-500 font-semibold uppercase bg-white/5 border border-white/5 px-2.5 py-1 rounded-full">
                          {formattedDate}
                        </span>
                        <span className="text-xs text-gray-400">Hosted by {meetup.organizer?.name}</span>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{meetup.title}</h3>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-5">{meetup.description}</p>
                    </div>

                    {/* Stats */}
                    <div>
                      <div className="grid grid-cols-3 gap-2 p-3 bg-white/5 border border-white/5 rounded-xl text-center mb-4">
                        <div>
                          <div className="flex items-center justify-center text-indigo-400 mb-1"><Users size={16} /></div>
                          <p className="text-xs text-gray-400">Registrations</p>
                          <p className="text-base font-bold text-white mt-0.5">{meetup.registeredCount || 0}</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-center text-teal-400 mb-1"><CheckSquare size={16} /></div>
                          <p className="text-xs text-gray-400">Checked-In</p>
                          <p className="text-base font-bold text-white mt-0.5">{meetup.checkedInCount || 0}</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-center text-amber-400 mb-1"><Percent size={16} /></div>
                          <p className="text-xs text-gray-400">Attendance</p>
                          <p className="text-base font-bold text-white mt-0.5">{meetup.attendanceRate || 0}%</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <Link
                          to={`/meetup/${meetup._id}`}
                          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
                        >
                          View Registrants
                          <ArrowRight size={12} />
                        </Link>
                        <button
                          onClick={() => setPlayingVideo({ url: videoInfo.url, title: videoInfo.title, isYoutube: videoInfo.isYoutube })}
                          className="text-xs font-bold text-teal-400 hover:text-teal-300 transition flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20"
                        >
                          <Play size={12} fill="currentColor" />
                          Watch Recording
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full-screen Video Player Modal */}
      {playingVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setPlayingVideo(null)}
        >
          <div
            className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-[#111827] border-b border-white/10">
              <h3 className="text-sm font-bold text-white truncate">{playingVideo.title}</h3>
              <button
                onClick={() => setPlayingVideo(null)}
                className="text-gray-400 hover:text-white transition p-1.5 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              {playingVideo.isYoutube ? (
                <iframe
                  src={`${playingVideo.url}?autoplay=1`}
                  title={playingVideo.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={playingVideo.url} controls autoPlay className="w-full h-full" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetupHistory;
