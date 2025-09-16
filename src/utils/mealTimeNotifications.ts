import { supabase } from '@/lib/supabaseClient';

// Get current meal time based on specific hours (handles all US timezones)
export const getCurrentMealTime = (): 'breakfast' | 'lunch' | 'dinner' | null => {
  const now = new Date();
  
  // Convert to US Eastern Time (EDT/EST)
  const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const hour = easternTime.getHours();
  const minute = easternTime.getMinutes();
  
  // Only trigger at specific times: 9am, 12pm, 5pm Eastern Time
  if (hour === 9 && minute === 0) {
    return 'breakfast';
  } else if (hour === 12 && minute === 0) {
    return 'lunch';
  } else if (hour === 17 && minute === 0) {
    return 'dinner';
  }
  
  return null;
};

// Create meal-time notification for a user
export const createMealTimeNotification = async (userId: string, mealTime: 'breakfast' | 'lunch' | 'dinner') => {
  try {
    const mealConfig = {
      breakfast: {
        title: 'Good Morning! Time for Breakfast',
        message: 'Start your day right! Find breakfast spots near you.',
        buttonText: 'Find Breakfast',
        icon: '🌅'
      },
      lunch: {
        title: 'Lunch Time!',
        message: 'Take a break and discover great lunch options nearby.',
        buttonText: 'Find Lunch',
        icon: '☀️'
      },
      dinner: {
        title: 'Dinner Time!',
        message: 'End your day with a delicious meal. Check out nearby dinner spots.',
        buttonText: 'Find Dinner',
        icon: '🌙'
      }
    };

    const config = mealConfig[mealTime];
    const notificationType = `${mealTime}_reminder` as const;

    await supabase.from('notifications').insert({
      user_id: userId,
      type: notificationType,
      title: config.title,
      message: config.message,
      button_text: config.buttonText,
      icon: config.icon,
      show_confetti: false,
      is_read: false
    });

    console.log(`Created ${mealTime} notification for user ${userId}`);
  } catch (error) {
    console.error(`Error creating ${mealTime} notification:`, error);
  }
};

// Check if user has already received a meal-time notification today
export const hasReceivedMealNotificationToday = async (userId: string, mealTime: 'breakfast' | 'lunch' | 'dinner'): Promise<boolean> => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const { data, error } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', `${mealTime}_reminder`)
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString())
      .limit(1);

    if (error) {
      console.error('Error checking meal notification:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking meal notification:', error);
    return false;
  }
};

// Create meal-time notifications for all users if it's meal time
export const createMealTimeNotificationsForAllUsers = async () => {
  try {
    const currentMealTime = getCurrentMealTime();
    
    if (!currentMealTime) {
      console.log('Not meal time, skipping meal notifications');
      return;
    }

    console.log(`Creating ${currentMealTime} notifications for all users`);

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id');

    if (usersError || !users) {
      console.error('Error fetching users:', usersError);
      return;
    }

    // Create notifications for each user who hasn't received one today
    for (const user of users) {
      const hasReceived = await hasReceivedMealNotificationToday(user.id, currentMealTime);
      
      if (!hasReceived) {
        await createMealTimeNotification(user.id, currentMealTime);
      }
    }

    console.log(`Completed creating ${currentMealTime} notifications`);
  } catch (error) {
    console.error('Error creating meal-time notifications:', error);
  }
};

// Check and create meal-time notification automatically when user lands on gigagent4u
export const checkAndCreateMealTimeNotification = async (userId: string) => {
  try {
    const currentMealTime = getCurrentMealTime();
    
    if (!currentMealTime) {
      console.log('ℹ️ Not meal time right now');
      return;
    }

    console.log(`🍽️ Checking ${currentMealTime} notification for user ${userId}`);
    
    // Check if user already received this meal-time notification today
    const hasReceived = await hasReceivedMealNotificationToday(userId, currentMealTime);
    
    if (hasReceived) {
      console.log(`ℹ️ User ${userId} already received ${currentMealTime} notification today`);
      return;
    }

    // Create notification automatically when user lands on gigagent4u during meal time
    console.log(`✅ User ${userId} landed on gigagent4u during ${currentMealTime} - creating notification`);
    await createMealTimeNotification(userId, currentMealTime);
    
    // Dispatch custom event to refresh notifications
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notificationCreated'));
    }
  } catch (error) {
    console.error('Error checking meal-time notification:', error);
  }
};

