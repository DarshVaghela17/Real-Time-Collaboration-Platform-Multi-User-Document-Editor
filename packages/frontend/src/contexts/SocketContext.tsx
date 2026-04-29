import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { ActiveUser } from '../types';

export const SOCKET_URL = "http://localhost:5000";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  activeUsers: ActiveUser[];
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  activeUsers: [],
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
  token: string | null;
}

export const SocketProvider = ({ children, token }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);

  useEffect(() => {
    if (!token) {
      // No token, disconnect if connected
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      setActiveUsers([]);
      return;
    }

    // Initialize socket connection
    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
      },
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
      setActiveUsers([]);
    });

    newSocket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    // Presence event handlers
    newSocket.on('presence:joined', (user: ActiveUser) => {
      console.log('User joined:', user.name);
      setActiveUsers(prev => {
        const filtered = prev.filter(u => u.id !== user.id);
        return [...filtered, user];
      });
    });

    newSocket.on('presence:left', (userId: string) => {
      console.log('User left:', userId);
      setActiveUsers(prev => prev.filter(u => u.id !== userId));
    });

    newSocket.on('presence:update', (user: ActiveUser) => {
      console.log('Presence updated:', user.name);
      setActiveUsers(prev => {
        const filtered = prev.filter(u => u.id !== user.id);
        return [...filtered, user];
      });
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.disconnect();
      setActiveUsers([]);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, activeUsers }}>
      {children}
    </SocketContext.Provider>
  );
};