import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import { Video, Upload, Trash2, RotateCcw, FileVideo, Calendar, Link2, ChevronDown } from 'lucide-react';
import { FaYoutube as Youtube } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const LatestEvents = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload States
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadData, setUploadData] = useState({ title: '', description: '', meetupId: '', youtubeUrl: '' });
  const [file, setFile] = useState(null);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'youtube'
  
  // Progress tracker states
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState(false);

  // Past meetups for linking
  const [pastMeetups, setPastMeetups] = useState([]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const activeVideos = await api.videos.getAll();
      setVideos(activeVideos);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  };

  const fetchPastMeetups = async () => {
    try {
      const history = await api.meetups.getHistory();
      setPastMeetups(history);
    } catch (err) {
      // Silently fail — dropdown just stays empty
      console.error('Failed to load past meetups:', err.message);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    if (showUploadForm && user?.role === 'admin') {
      fetchPastMeetups();
    }
  }, [showUploadForm]);

  const handleChange = (e) => {
    setUploadData({ ...uploadData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast.error('Video size exceeds 100MB limit!');
        return;
      }
      if (selectedFile.type !== 'video/mp4') {
        toast.error('Only MP4 videos are allowed!');
        return;
      }
      setFile(selectedFile);
      setUploadError(false);
    }
  };

  const performUpload = async () => {
    if (!uploadData.title) {
      toast.error('Please specify a title');
      return;
    }

    if (uploadMode === 'file' && !file) {
      toast.error('Please select a video file');
      return;
    }

    if (uploadMode === 'youtube' && !uploadData.youtubeUrl) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    setUploading(true);
    setProgress(0);
    setUploadError(false);

    try {
      if (uploadMode === 'youtube') {
        // Send as JSON for YouTube URL
        await api.videos.uploadYoutubeUrl({
          title: uploadData.title,
          description: uploadData.description,
          meetupId: uploadData.meetupId || undefined,
          youtubeUrl: uploadData.youtubeUrl
        });
      } else {
        // Send as FormData for file upload
        const formData = new FormData();
        formData.append('title', uploadData.title);
        formData.append('description', uploadData.description);
        if (uploadData.meetupId) {
          formData.append('meetupId', uploadData.meetupId);
        }
        formData.append('video', file);

        await api.videos.upload(formData, (percent) => {
          setProgress(percent);
        });
      }

      toast.success('Video added successfully!');
      
      // Reset form
      setFile(null);
      setUploadData({ title: '', description: '', meetupId: '', youtubeUrl: '' });
      setShowUploadForm(false);
      setUploadMode('file');
      
      // Refresh videos
      await fetchVideos();
    } catch (err) {
      setUploadError(true);
      toast.error(err.message || 'Video upload failed. You can retry.');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    performUpload();
  };

  const handleDeleteVideo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;

    try {
      await api.videos.delete(id);
      toast.success('Video deleted successfully');
      await fetchVideos();
    } catch (err) {
      toast.error(err.message || 'Failed to delete video');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight m-0 bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent">
            Latest Event Videos
          </h1>
          <p className="text-gray-400 mt-1">
            Watch highlights and recordings. All uploaded videos expire after 28 days.
          </p>
        </div>

        {user?.role === 'admin' && !showUploadForm && (
          <Button onClick={() => setShowUploadForm(true)} className="flex items-center gap-1.5 py-2.5">
            <Upload size={16} />
            <span>Upload Video</span>
          </Button>
        )}
      </div>

      {/* Upload Form (conditional — admin only) */}
      {user?.role === 'admin' && showUploadForm && (
        <Card hoverEffect={false} className="mb-8 p-6 max-w-2xl mx-auto relative border border-indigo-500/20">
          <h3 className="text-lg font-bold text-white mb-4">Upload Event Recording</h3>
          
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Video Title *</label>
              <input
                type="text"
                name="title"
                value={uploadData.title}
                onChange={handleChange}
                placeholder="E.g., Networking Session Highlight"
                className="glass-input px-4 py-2.5 rounded-lg w-full text-sm"
                required
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Description</label>
              <textarea
                name="description"
                value={uploadData.description}
                onChange={handleChange}
                placeholder="Summary or highlights of the video..."
                rows={3}
                className="glass-input p-3 rounded-lg w-full text-sm resize-none"
                disabled={uploading}
              />
            </div>

            {/* Link to Past Meetup Dropdown */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">
                <span className="flex items-center gap-1">
                  <Link2 size={12} />
                  Link to Past Meetup (Optional)
                </span>
              </label>
              <div className="relative">
                <select
                  name="meetupId"
                  value={uploadData.meetupId}
                  onChange={handleChange}
                  className="glass-input px-4 py-2.5 rounded-lg w-full text-sm appearance-none pr-10"
                  disabled={uploading}
                >
                  <option value="">— No linked meetup —</option>
                  {pastMeetups.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.title} — {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Upload Mode Toggle */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Video Source</label>
              <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setUploadMode('file'); setUploadData(d => ({ ...d, youtubeUrl: '' })); }}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 ${
                    uploadMode === 'file' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                  }`}
                  disabled={uploading}
                >
                  <Upload size={13} />
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => { setUploadMode('youtube'); setFile(null); }}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 ${
                    uploadMode === 'youtube' ? 'bg-rose-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                  }`}
                  disabled={uploading}
                >
                  <Youtube size={13} />
                  YouTube URL
                </button>
              </div>
            </div>

            {uploadMode === 'file' ? (
              /* Video file input */
              <div className="flex flex-col items-center justify-center">
                <input
                  type="file"
                  id="event-video-upload"
                  className="hidden"
                  accept="video/mp4"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
                <label htmlFor="event-video-upload" className="w-full cursor-pointer block">
                  {file ? (
                    <div className="p-4 rounded-xl bg-white/5 border border-indigo-500/20 text-center flex flex-col items-center">
                      <FileVideo className="text-indigo-400 mb-1" size={28} />
                      <span className="text-sm font-semibold text-gray-200">{file.name}</span>
                      <span className="text-xs text-gray-500 mt-1">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl bg-white/5 border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-white/10 flex flex-col items-center justify-center text-gray-400 transition">
                      <Upload className="mb-2 text-gray-500" size={32} />
                      <span className="text-xs font-semibold text-gray-300">Click to Select Event Video</span>
                      <span className="text-[10px] text-gray-500 mt-1">Only MP4 format allowed (Max 100MB)</span>
                    </div>
                  )}
                </label>
              </div>
            ) : (
              /* YouTube URL input */
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">YouTube Video URL *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                    <Youtube size={16} />
                  </span>
                  <input
                    type="url"
                    name="youtubeUrl"
                    value={uploadData.youtubeUrl}
                    onChange={handleChange}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="glass-input pl-10 pr-4 py-2.5 rounded-lg w-full text-sm"
                    disabled={uploading}
                    required={uploadMode === 'youtube'}
                  />
                </div>
                <span className="text-[10px] text-gray-500 mt-1 block">Paste a YouTube video link (regular, shorts, or embed URL)</span>
              </div>
            )}

            {/* Progress Bar or Retry Button */}
            {uploading && uploadMode === 'file' && (
              <ProgressBar progress={progress} />
            )}

            {uploading && uploadMode === 'youtube' && (
              <div className="flex items-center justify-center py-3">
                <Spinner size="sm" />
                <span className="text-xs text-gray-400 ml-2">Saving video link...</span>
              </div>
            )}

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex flex-col items-center gap-2">
                <p className="text-xs text-rose-400 font-semibold">Upload failed. Click retry to attempt again.</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={performUpload}
                  className="py-1 px-3 text-xs flex items-center gap-1 hover:bg-rose-500/10 text-rose-400 border-rose-500/30"
                >
                  <RotateCcw size={12} />
                  <span>Retry Upload</span>
                </Button>
              </div>
            )}

            {/* Actions */}
            {!uploading && (
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 py-2.5">
                  {uploadMode === 'youtube' ? 'Add YouTube Video' : 'Start Upload'}
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 py-2.5"
                  onClick={() => {
                    setShowUploadForm(false);
                    setFile(null);
                    setUploadError(false);
                    setUploadMode('file');
                    setUploadData({ title: '', description: '', meetupId: '', youtubeUrl: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </Card>
      )}

      {/* Videos List Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-2xl p-8 border border-white/5">
          <Video className="w-16 h-16 text-indigo-500/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Videos Listed</h3>
          <p className="text-gray-400 max-w-sm mx-auto mb-6">
            There are currently no recordings. Be the first to upload one!
          </p>
          {user?.role === 'admin' && (
            <Button onClick={() => setShowUploadForm(true)} variant="outline">Upload Video</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {videos.map((vid) => {
            const formattedDate = new Date(vid.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
            const isYouTube = vid.filePath && (vid.filePath.includes('youtube.com') || vid.filePath.includes('youtu.be'));

            return (
              <Card key={vid._id} hoverEffect={false} className="p-0 overflow-hidden flex flex-col justify-between">
                {/* Video player — supports YouTube embeds and local files */}
                <div className="relative aspect-video bg-black">
                  {isYouTube ? (
                    <iframe
                      src={vid.filePath.replace('youtube.com/shorts/', 'youtube.com/embed/').replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      title={vid.title}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={vid.filePath}
                      controls
                      className="w-full h-full"
                      poster=""
                    />
                  )}
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{vid.title}</h3>

                    {/* Linked meetup badge */}
                    {vid.meetup && (
                      <div className="flex items-center gap-1 mb-2">
                        <Link2 size={11} className="text-teal-400" />
                        <span className="text-[11px] text-teal-400 font-semibold truncate">
                          Linked to: {vid.meetup.title}
                        </span>
                      </div>
                    )}

                    {vid.description && (
                      <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed">{vid.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-gray-500">
                    <div className="flex items-center gap-1 font-medium">
                      <Calendar size={13} className="text-indigo-400" />
                      <span>Uploaded {formattedDate}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isYouTube ? (
                        <span className="flex items-center gap-0.5 text-rose-400">
                          <Youtube size={12} />
                          <span>YouTube</span>
                        </span>
                      ) : (
                        <span>{(vid.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                      )}
                      {(vid.uploadedBy?._id === user?._id || user?.role === 'admin') && (
                        <button
                          onClick={() => handleDeleteVideo(vid._id)}
                          className="p-1 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Delete Video"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LatestEvents;
