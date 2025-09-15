"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: 'first_event' | 'new_message' | 'location_based';
  title: string;
  message: string;
  buttonText: string;
  buttonAction: () => void;
  icon: string;
  timeAgo: string;
  isRead: boolean;
  showConfetti?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead'>) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize notifications only once
  useEffect(() => {
    if (isInitialized) return;

    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
        setIsInitialized(true);
        return;
      } catch (error) {
        console.error('Error parsing saved notifications:', error);
      }
    }

    // If no saved notifications, use mock data
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'first_event',
        title: 'Congratulations on your first event!',
        message: 'Congratulations posting your first event! Now invite talent to make it amazing.',
        buttonText: 'Invite Talent Now',
        buttonAction: () => {
          // This will be handled in the component
        },
        icon: '🚀',
        timeAgo: '6m',
        isRead: false,
        showConfetti: true
      },
      {
        id: '2',
        type: 'new_message',
        title: 'New Message',
        message: 'Talent Sarah Johnson has sent you a new message',
        buttonText: 'View Message',
        buttonAction: () => {
          // This will be handled in the component
        },
        icon: '💬',
        timeAgo: '1h',
        isRead: false
      },
      {
        id: '3',
        type: 'location_based',
        title: 'Good Morning!',
        message: 'Are you hungry? Try McDonald\'s for breakfast - it\'s just 0.3 miles away!',
        buttonText: 'View Map',
        buttonAction: () => {
          // This will be handled in the component
        },
        icon: '🌅',
        timeAgo: '2h',
        isRead: false
      },
      {
        id: '4',
        type: 'location_based',
        title: 'Evening Entertainment',
        message: 'Hey, are you free? Enjoy Club Paradise - it\'s 1.2 miles away with live music tonight!',
        buttonText: 'View Map',
        buttonAction: () => {
          // This will be handled in the component
        },
        icon: '🎵',
        timeAgo: '4h',
        isRead: false
      }
    ];

    setNotifications(mockNotifications);
    setIsInitialized(true);
  }, [isInitialized]);

  // Persist notification state to localStorage
  useEffect(() => {
    if (isInitialized && notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications, isInitialized]);

  const unreadCount = notifications.filter(notif => !notif.isRead).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  }, []);

  const addNotification = (notification: Omit<Notification, 'id' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      isRead: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };


  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      addNotification,
      removeNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
