import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    let socketInstance = null;

    if (user) {
      const token = localStorage.getItem('token');
      
      // Initialize Socket connection
      const serverUrl = import.meta.env.VITE_API_URL || window.location.origin;
      socketInstance = io(serverUrl, {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      socketInstance.on('connect', () => {
        console.log('[Socket] Connected to server');
      });

      socketInstance.on('connect_error', (err) => {
        console.error('[Socket] Connection error:', err.message);
      });

      setSocket(socketInstance);
    } else {
      // Disconnect socket if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }

    // Cleanup on unmount or user change
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
