import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Notification, NotificationContextType } from '../types';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * NotificationProvider - Manages user notifications with localStorage persistence
 * Listens to Socket.io events for real-time notifications
 */
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('collab-notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
        const unread = parsed.filter((n: Notification) => !n.read).length;
        setUnreadCount(unread);
      } catch (e) {
        console.error('Failed to parse stored notifications:', e);
      }
    }
  }, []);

  // Persist to localStorage whenever notifications change
  useEffect(() => {
    localStorage.setItem('collab-notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Update unread count
  useEffect(() => {
    const count = notifications.filter(n => !n.read && !n.archived).length;
    setUnreadCount(count);
  }, [notifications]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-clear notifications after 7 days
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    const timer = setTimeout(() => {
      removeNotification(newNotification.id);
    }, maxAge);

    return () => clearTimeout(timer);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  const markAsArchived = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, archived: true } : n))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem('collab-notifications');
  }, []);

  const clearArchived = useCallback(() => {
    setNotifications(prev => prev.filter(n => !n.archived));
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    markAsArchived,
    clearNotifications,
    clearArchived,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Hook to access notification context
 * Must be used within NotificationProvider
 */
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export default NotificationContext;
