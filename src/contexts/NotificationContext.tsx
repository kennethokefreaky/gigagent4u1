"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Notification {
  id: string;
  user_id: string;
  type: 'first_event' | 'new_message' | 'location_based' | 'event_posted' | 'talent_accepted' | 'verification_required' | 'breakfast_reminder' | 'lunch_reminder' | 'dinner_reminder';
  title: string;
  message: string;
  buttonText: string;
  icon: string;
  timeAgo: string;
  isRead: boolean;
  showConfetti?: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'created_at' | 'timeAgo' | 'user_id'>) => void;
  removeNotification: (id: string) => void;
  loadNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Helper function to calculate time ago
  const getTimeAgo = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Load notifications from Supabase
  const loadNotifications = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("No authenticated user for notifications:", authError);
        setIsInitialized(true);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // If the notifications table doesn't exist yet, just log and continue
        if (error.code === 'PGRST116' || error.message?.includes('relation "notifications" does not exist')) {
          console.log('Notifications table not found - skipping notification loading');
          setNotifications([]);
          setIsInitialized(true);
          return;
        }
        console.error('Error loading notifications:', error);
        setNotifications([]);
        setIsInitialized(true);
        return;
      }

      // Convert Supabase data to Notification format
      const formattedNotifications: Notification[] = (data || []).map(notif => ({
        id: notif.id,
        user_id: notif.user_id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        buttonText: notif.button_text,
        icon: notif.icon,
        timeAgo: getTimeAgo(notif.created_at),
        isRead: notif.is_read,
        showConfetti: notif.show_confetti,
        created_at: notif.created_at
      }));

      setNotifications(formattedNotifications);
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setIsInitialized(true);
    }
  }, []);

  // Initialize notifications
  useEffect(() => {
    if (!isInitialized) {
      loadNotifications();
    }
  }, [isInitialized, loadNotifications]);

  // Listen for custom events to refresh notifications
  useEffect(() => {
    const handleNotificationCreated = () => {
      console.log('🔄 Notification created event received, refreshing notifications...');
      loadNotifications();
    };

    window.addEventListener('notificationCreated', handleNotificationCreated);
    
    return () => {
      window.removeEventListener('notificationCreated', handleNotificationCreated);
    };
  }, [loadNotifications]);

  const unreadCount = notifications.filter(notif => !notif.isRead).length;

  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("No authenticated user for markAllAsRead:", authError);
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'isRead' | 'created_at' | 'timeAgo' | 'user_id'>) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("No authenticated user for addNotification:", authError);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          button_text: notification.buttonText,
          icon: notification.icon,
          show_confetti: notification.showConfetti || false,
          is_read: false
        })
        .select()
        .single();

      if (error) {
        // If the notifications table doesn't exist yet, just log and continue
        if (error.code === 'PGRST116' || error.message?.includes('relation "notifications" does not exist')) {
          console.log('Notifications table not found - skipping notification creation');
          return;
        }
        console.error('Error adding notification:', error);
        return;
      }

      // Add to local state
      const newNotification: Notification = {
        id: data.id,
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        buttonText: data.button_text,
        icon: data.icon,
        timeAgo: getTimeAgo(data.created_at),
        isRead: data.is_read,
        showConfetti: data.show_confetti,
        created_at: data.created_at
      };

      setNotifications(prev => [newNotification, ...prev]);
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  }, []);

  const removeNotification = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error removing notification:', error);
        return;
      }

      setNotifications(prev => prev.filter(notif => notif.id !== id));
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  }, []);


  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      addNotification,
      removeNotification,
      loadNotifications
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
