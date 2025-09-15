"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

interface Message {
  id: string;
  text: string;
  timestamp: string;
  sender: 'promoter' | 'talent';
  isRead: boolean;
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  category: string;
  isOnline: boolean;
  messages: Message[];
}

export default function OpenMessagePage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Load conversation data - first try sessionStorage, then fallback to mock data
  useEffect(() => {
    // Try to get contact info from sessionStorage (from search message page)
    const storedContact = sessionStorage.getItem('selectedChatContact');
    let contactInfo = null;
    
    if (storedContact) {
      try {
        contactInfo = JSON.parse(storedContact);
      } catch (error) {
        console.error('Error parsing stored contact:', error);
      }
    }

    const mockConversations: Conversation[] = [
      {
        id: "1",
        name: contactInfo?.name || "Alex Rodriguez",
        avatar: contactInfo?.avatar || "AR",
        category: contactInfo?.category || "Boxer",
        isOnline: contactInfo?.isOnline ?? true,
        messages: [
          {
            id: "1",
            text: "Hi! Thanks for reaching out about the boxing event.",
            timestamp: "10:30 AM",
            sender: "talent",
            isRead: true
          },
          {
            id: "2",
            text: "I'm very interested in participating. Can you tell me more about the venue?",
            timestamp: "10:32 AM",
            sender: "talent",
            isRead: true
          },
          {
            id: "3",
            text: "Absolutely! It's at Madison Square Garden, capacity of 20,000. The event is scheduled for March 15th.",
            timestamp: "10:35 AM",
            sender: "promoter",
            isRead: true
          },
          {
            id: "4",
            text: "That sounds amazing! What's the payment structure?",
            timestamp: "10:37 AM",
            sender: "talent",
            isRead: true
          },
          {
            id: "5",
            text: "We're offering $5,000 base pay plus 10% of ticket sales. Does that work for you?",
            timestamp: "10:40 AM",
            sender: "promoter",
            isRead: true
          },
          {
            id: "6",
            text: "Thanks for the opportunity! I'm excited to perform at your venue.",
            timestamp: "2m",
            sender: "talent",
            isRead: false
          }
        ]
      },
      {
        id: "2",
        name: "Sarah Johnson",
        avatar: "SJ",
        category: "Comedian",
        isOnline: false,
        messages: [
          {
            id: "1",
            text: "Hey Sarah! I saw your latest comedy show and loved it.",
            timestamp: "9:15 AM",
            sender: "promoter",
            isRead: true
          },
          {
            id: "2",
            text: "Thank you! I'm glad you enjoyed it. Are you interested in booking me for an event?",
            timestamp: "9:20 AM",
            sender: "talent",
            isRead: true
          },
          {
            id: "3",
            text: "Yes! We have a corporate event coming up and think you'd be perfect.",
            timestamp: "9:25 AM",
            sender: "promoter",
            isRead: true
          },
          {
            id: "4",
            text: "What time should I arrive for sound check?",
            timestamp: "1h",
            sender: "talent",
            isRead: false
          }
        ]
      }
    ];

    const foundConversation = mockConversations.find(conv => conv.id === conversationId);
    setConversation(foundConversation || null);
  }, [conversationId]);

  const handleSendMessage = () => {
    if (messageText.trim() && conversation) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: messageText.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: 'promoter',
        isRead: false
      };

      setConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, newMessage]
        };
      });

      setMessageText("");
      
      // Simulate typing indicator
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    }
  };

  const handleVideoCall = () => {
    // In real app, this would initiate a video call
    console.log("Starting video call with", conversation?.name);
  };

  const renderMessage = (message: Message) => {
    const isPromoter = message.sender === 'promoter';
    
    return (
      <div
        key={message.id}
        className={`flex ${isPromoter ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isPromoter
            ? 'bg-button-red text-white'
            : 'bg-input-background text-text-primary'
        }`}>
          <p className="text-sm">{message.text}</p>
          <p className={`text-xs mt-1 ${
            isPromoter ? 'text-white opacity-70' : 'text-text-secondary'
          }`}>
            {message.timestamp}
          </p>
        </div>
      </div>
    );
  };

  if (!conversation) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-text-primary font-bold text-lg mb-2">Conversation not found</h2>
          <button
            onClick={() => router.back()}
            className="text-button-red hover:text-button-red-hover transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      {/* Header */}
      <div className="bg-surface px-4 py-4 flex items-center justify-between border-b border-text-secondary">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.back()}
            className="p-1 hover:bg-input-background rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="relative">
            <div className="w-10 h-10 bg-button-red rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {conversation.avatar}
            </div>
            {conversation.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
            )}
          </div>
          
          <div>
            <h1 className="text-text-primary font-semibold text-base">{conversation.name}</h1>
            <p className="text-text-secondary text-sm">{conversation.category}</p>
          </div>
        </div>

        <button
          onClick={handleVideoCall}
          className="p-2 hover:bg-input-background rounded-full transition-colors"
        >
          <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {conversation.messages.map(renderMessage)}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start mb-4">
            <div className="bg-input-background text-text-primary px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message Composer */}
      <div className="bg-surface border-t border-text-secondary p-4">
        <div className="flex items-end space-x-3">
          <button className="p-2 hover:bg-input-background rounded-full transition-colors">
            <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          
          <div className="flex-1">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-input-background text-text-primary placeholder-text-secondary rounded-lg px-4 py-3 resize-none outline-none"
              rows={1}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            className={`p-2 rounded-full transition-colors ${
              messageText.trim()
                ? "bg-button-red text-white hover:bg-button-red-hover"
                : "bg-input-background text-text-secondary cursor-not-allowed"
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
