import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Calendar, Clock, MapPin, AlignLeft, Users, Link as LinkIcon, ArrowLeft, Camera, Image } from 'lucide-react';
import toast from 'react-hot-toast';

const MeetupCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    mapsLink: '',
    capacity: '',
    registrationDeadline: ''
  });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('Banner picture must be less than 10MB');
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, description, date, startTime, endTime, venue, capacity, registrationDeadline } = formData;

    if (!title || !description || !date || !startTime || !endTime || !venue || !capacity || !registrationDeadline) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    if (file) {
      data.append('banner', file);
    }

    try {
      await api.meetups.create(data);
      toast.success('Meetup created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Failed to create meetup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-4">
      {/* Back Button */}
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6 transition">
        <ArrowLeft size={16} />
        <span>Back to Dashboard</span>
      </Link>

      <Card hoverEffect={false} className="p-8 shadow-2xl relative overflow-hidden">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-white bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent">
            Create Meetup
          </h2>
          <p className="text-gray-400 mt-1">Design and schedule a new community event.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Banner Upload */}
          <div className="flex flex-col items-center justify-center">
            <input
              type="file"
              id="banner-upload"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <label htmlFor="banner-upload" className="w-full cursor-pointer group block">
              {previewUrl ? (
                <div className="relative h-56 w-full rounded-xl overflow-hidden border border-indigo-500/30">
                  <img src={previewUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                    <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1.5">
                      <Camera size={16} />
                      <span>Change Banner</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-56 w-full rounded-xl bg-white/5 border-2 border-dashed border-white/10 hover:border-indigo-500/50 flex flex-col items-center justify-center text-gray-400 hover:bg-white/10 transition duration-200">
                  <Image size={40} className="mb-2 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-300">Upload Banner Image</span>
                  <span className="text-xs text-gray-500 mt-1">Recommended: 1200x630 (Max 10MB)</span>
                </div>
              )}
            </label>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Event Title *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                <Calendar size={16} />
              </span>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Tech Talk: Building Scalable Web Apps"
                className="glass-input pl-10 pr-4 py-2.5 rounded-lg w-full text-sm"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Event Description *</label>
            <div className="relative">
              <span className="absolute top-3 left-3.5 text-gray-500">
                <AlignLeft size={16} />
              </span>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detail what this meetup is about, who it's for, and the agenda..."
                rows={5}
                className="glass-input pl-10 pr-4 py-2.5 rounded-lg w-full text-sm resize-none"
                required
              />
            </div>
          </div>

          {/* Date, Start Time, End Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Event Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="glass-input px-4 py-2.5 rounded-lg w-full text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Start Time *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <Clock size={16} />
                </span>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="glass-input pl-10 pr-4 py-2.5 rounded-lg w-full text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">End Time *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <Clock size={16} />
                </span>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="glass-input pl-10 pr-4 py-2.5 rounded-lg w-full text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Venue & Maps Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Venue Name *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <MapPin size={16} />
                </span>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  placeholder="Co-working Space, 4th Floor"
                  className="glass-input pl-10 pr-4 py-2.5 rounded-lg w-full text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Google Maps Link</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <LinkIcon size={16} />
                </span>
                <input
                  type="url"
                  name="mapsLink"
                  value={formData.mapsLink}
                  onChange={handleChange}
                  placeholder="https://maps.google.com/..."
                  className="glass-input pl-10 pr-4 py-2.5 rounded-lg w-full text-sm"
                />
              </div>
            </div>
          </div>

          {/* Capacity & Registration Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Capacity Limit *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <Users size={16} />
                </span>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="50"
                  min="1"
                  className="glass-input pl-10 pr-4 py-2.5 rounded-lg w-full text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Registration Deadline *</label>
              <input
                type="datetime-local"
                name="registrationDeadline"
                value={formData.registrationDeadline}
                onChange={handleChange}
                className="glass-input px-4 py-2.5 rounded-lg w-full text-sm"
                required
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              className="flex-1 py-3"
              loading={loading}
            >
              Create Event
            </Button>
            <Link to="/dashboard" className="flex-1">
              <Button
                variant="secondary"
                className="w-full py-3"
              >
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default MeetupCreate;
