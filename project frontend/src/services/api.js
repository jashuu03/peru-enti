const getAuthToken = () => localStorage.getItem('token');

// Simple fetch wrapper to handle API requests without heavy dependencies
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    ...options.headers,
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is FormData (e.g. file upload), don't set Content-Type so the browser sets it automatically
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    data = { message: text };
  }

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

const api = {
  auth: {
    signup: (formData) => apiRequest('/api/auth/signup', { method: 'POST', body: formData }),
    signin: (credentials) => apiRequest('/api/auth/signin', { method: 'POST', body: credentials }),
    getMe: () => apiRequest('/api/auth/me'),
  },
  users: {
    getAll: (search = '', page = 1) => apiRequest(`/api/users?search=${search}&page=${page}`),
    getProfile: (id) => apiRequest(`/api/users/${id}`),
    updateProfile: (formData) => apiRequest('/api/users/profile', { method: 'PUT', body: formData }),
    block: (id) => apiRequest(`/api/users/${id}/block`, { method: 'POST' }),
    unblock: (id) => apiRequest(`/api/users/${id}/block`, { method: 'DELETE' }),
  },
  meetups: {
    getAll: (status = '', page = 1) => apiRequest(`/api/meetups?status=${status}&page=${page}`),
    getHistory: () => apiRequest('/api/meetups/history'),
    getOne: (id) => apiRequest(`/api/meetups/${id}`),
    create: (formData) => apiRequest('/api/meetups', { method: 'POST', body: formData }),
    update: (id, formData) => apiRequest(`/api/meetups/${id}`, { method: 'PUT', body: formData }),
    delete: (id) => apiRequest(`/api/meetups/${id}`, { method: 'DELETE' }),
  },
  registrations: {
    register: (details) => apiRequest('/api/registrations', { method: 'POST', body: details }),
    checkIn: (meetupId) => apiRequest(`/api/registrations/${meetupId}/checkin`, { method: 'POST' }),
    getAttendees: (meetupId, status = '') => apiRequest(`/api/registrations/${meetupId}/attendees?status=${status}`),
    getStatus: (meetupId) => apiRequest(`/api/registrations/${meetupId}/status`),
  },
  messages: {
    getConversations: () => apiRequest('/api/messages/conversations'),
    getHistory: (userId, page = 1) => apiRequest(`/api/messages/${userId}?page=${page}`),
    send: (msg) => apiRequest('/api/messages', { method: 'POST', body: msg }),
    report: (reportDetails) => apiRequest('/api/messages/report', { method: 'POST', body: reportDetails }),
  },
  connections: {
    sendRequest: (userId) => apiRequest(`/api/connections/request/${userId}`, { method: 'POST' }),
    accept: (id) => apiRequest(`/api/connections/${id}/accept`, { method: 'PUT' }),
    reject: (id) => apiRequest(`/api/connections/${id}/reject`, { method: 'PUT' }),
    getAll: () => apiRequest('/api/connections'),
    getPending: () => apiRequest('/api/connections/pending'),
    getStatus: (userId) => apiRequest(`/api/connections/status/${userId}`),
  },
  videos: {
    getAll: () => apiRequest('/api/videos'),
    upload: (formData, onProgress) => {
      // For uploads with progress tracking, we use XMLHttpRequest directly
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/videos');
        
        const token = getAuthToken();
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          let resData;
          try {
            resData = JSON.parse(xhr.responseText);
          } catch (e) {
            resData = { message: xhr.responseText };
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(resData);
          } else {
            reject(new Error(resData.message || 'Upload failed'));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
      });
    },
    delete: (id) => apiRequest(`/api/videos/${id}`, { method: 'DELETE' }),
    uploadYoutubeUrl: (data) => apiRequest('/api/videos', { method: 'POST', body: data }),
  },
  analytics: {
    getDashboard: () => apiRequest('/api/analytics/dashboard'),
    getMeetup: (id) => apiRequest(`/api/analytics/meetup/${id}`),
    // Export urls are triggered via standard links, but we declare the endpoints
    exportAttendeesUrl: (meetupId) => `/api/analytics/export/attendees/${meetupId}?token=${getAuthToken()}`,
    exportResponsesUrl: (meetupId) => `/api/analytics/export/responses/${meetupId}?token=${getAuthToken()}`,
  }
};

export default api;
export { getAuthToken };
