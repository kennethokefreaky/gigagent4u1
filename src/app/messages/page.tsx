"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface MessagePreview {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  isOnline: boolean;
}

export default function MessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<MessagePreview[]>([]);

  // Mock data - in real app, this would come from an API
  useEffect(() => {
    const mockMessages: MessagePreview[] = [
      {
        id: "1",
        name: "Alex Rodriguez",
        avatar: "AR",
        lastMessage: "Thanks for the opportunity! I'm excited to perform at your venue.",
        timestamp: "2m",
        unread: true,
        isOnline: true
      },
      {
        id: "2",
        name: "Sarah Johnson",
        avatar: "SJ",
        lastMessage: "What time should I arrive for sound check?",
        timestamp: "1h",
        unread: true,
        isOnline: false
      },
      {
        id: "3",
        name: "Mike Thompson",
        avatar: "MT",
        lastMessage: "The contract looks good. I'll sign it tomorrow.",
        timestamp: "3h",
        unread: false,
        isOnline: true
      },
      {
        id: "4",
        name: "Emma Davis",
        avatar: "ED",
        lastMessage: "Can we discuss the payment terms?",
        timestamp: "1d",
        unread: false,
        isOnline: false
      },
      {
        id: "5",
        name: "James Wilson",
        avatar: "JW",
        lastMessage: "Looking forward to working with you again!",
        timestamp: "2d",
        unread: false,
        isOnline: true
      }
    ];
    setMessages(mockMessages);
  }, []);

  const handleMessageClick = (messageId: string) => {
    router.push(`/messages/${messageId}/openmessage`);
  };

  const handleNewMessage = () => {
    router.push("/messages/searchmessage");
  };

  const handleBack = () => {
    router.push("/gigagent4u");
  };

  const renderMessageRow = (message: MessagePreview) => (
    <div
      key={message.id}
      onClick={() => handleMessageClick(message.id)}
      className="flex items-center space-x-3 p-4 hover:bg-input-background cursor-pointer transition-colors border-b border-text-secondary"
    >
      {/* Avatar */}
      <div className="relative">
        <div className="w-12 h-12 bg-button-red rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {message.avatar}
        </div>
        {/* Online indicator */}
        {message.isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-text-primary font-semibold text-base truncate">
            {message.name}
          </h3>
          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
            {/* Unread indicator next to timestamp */}
            {message.unread && (
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            )}
            <span className="text-text-secondary text-sm">
              {message.timestamp}
            </span>
          </div>
        </div>
        <p className={`text-sm truncate ${message.unread ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
          {message.lastMessage}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* App Bar */}
      <div className="bg-surface px-4 py-4 flex items-center justify-between border-b border-text-secondary">
        <button
          onClick={handleBack}
          className="flex items-center text-text-primary hover:text-text-secondary transition-colors"
        >
          <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        
        <h1 className="text-lg font-semibold text-text-primary">
          Messages
        </h1>
        
        <button
          onClick={handleNewMessage}
          className="p-1 hover:bg-input-background rounded-full transition-colors"
        >
          <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Messages List */}
      {messages.length > 0 ? (
        <div className="flex-1">
          {messages.map(renderMessageRow)}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <svg className="w-16 h-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h2 className="text-text-primary font-bold text-lg mb-2">No messages yet</h2>
            <p className="text-text-secondary text-sm">Start a conversation with talent or promoters.</p>
          </div>
        </div>
      )}
    </div>
  );
}
