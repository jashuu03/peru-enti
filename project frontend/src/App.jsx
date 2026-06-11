import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Contexts
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Components & Layout
import ProtectedRoute from './components/layout/ProtectedRoute';
import Navbar from './components/layout/Navbar';

// Pages
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import Dashboard from './pages/Dashboard';
import MeetupCreate from './pages/MeetupCreate';
import MeetupDetail from './pages/MeetupDetail';
import MeetupHistory from './pages/MeetupHistory';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Networking from './pages/Networking';
import Messages from './pages/Messages';
import LatestEvents from './pages/LatestEvents';
import Analytics from './pages/Analytics';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen bg-[#090d16] text-gray-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
            {/* Toast Notifications */}
            <Toaster 
              position="top-right"
              toastOptions={{
                className: 'glass-panel text-white border border-white/10',
                style: {
                  background: 'rgba(21, 29, 48, 0.9)',
                  color: '#fff',
                  backdropFilter: 'blur(10px)',
                },
                success: {
                  iconTheme: {
                    primary: '#14b8a6',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />

            {/* Navigation Header */}
            <Navbar />

            {/* Main Content Area */}
            <main className="flex-grow pb-12">
              <Routes>
                {/* Public Routes */}
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />

                {/* Protected Routes - General User */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/meetup/:id" 
                  element={
                    <ProtectedRoute>
                      <MeetupDetail />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/history" 
                  element={
                    <ProtectedRoute>
                      <MeetupHistory />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/networking" 
                  element={
                    <ProtectedRoute>
                      <Networking />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/user/:id" 
                  element={
                    <ProtectedRoute>
                      <UserProfile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/messages" 
                  element={
                    <ProtectedRoute>
                      <Messages />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/videos" 
                  element={
                    <ProtectedRoute>
                      <LatestEvents />
                    </ProtectedRoute>
                  } 
                />

                {/* Protected Routes - Admin Only */}
                <Route 
                  path="/meetup/create" 
                  element={
                    <ProtectedRoute>
                      <MeetupCreate />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/analytics" 
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <Analytics />
                    </ProtectedRoute>
                  } 
                />

                {/* Catch-all Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
