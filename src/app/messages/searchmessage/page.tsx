"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Contact {
  id: string;
  name: string;
  avatar: string;
  category: string;
  isOnline: boolean;
  isFrequentlyContacted?: boolean;
}

interface ContactGroup {
  letter: string;
  contacts: Contact[];
}

export default function SearchMessagePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Mock contacts data - in real app, this would come from an API
  useEffect(() => {
    const mockContacts: Contact[] = [
      // Frequently contacted (most messaged)
      {
        id: "1",
        name: "Alex Rodriguez",
        avatar: "AR",
        category: "Boxer",
        isOnline: true,
        isFrequentlyContacted: true
      },
      {
        id: "2",
        name: "Sarah Johnson",
        avatar: "SJ",
        category: "Comedian",
        isOnline: false,
        isFrequentlyContacted: true
      },
      {
        id: "3",
        name: "Mike Thompson",
        avatar: "MT",
        category: "Musician",
        isOnline: true,
        isFrequentlyContacted: true
      },
      // Regular contacts
      {
        id: "4",
        name: "Abigail Smith",
        avatar: "AS",
        category: "Comedian",
        isOnline: false,
        isFrequentlyContacted: false
      },
      {
        id: "5",
        name: "Brian Wilson",
        avatar: "BW",
        category: "Referee",
        isOnline: true,
        isFrequentlyContacted: false
      },
      {
        id: "6",
        name: "Emma Davis",
        avatar: "ED",
        category: "Wrestler",
        isOnline: false,
        isFrequentlyContacted: false
      },
      {
        id: "7",
        name: "James Brown",
        avatar: "JB",
        category: "Musician",
        isOnline: true,
        isFrequentlyContacted: false
      },
      {
        id: "8",
        name: "Lisa Chen",
        avatar: "LC",
        category: "Comedian",
        isOnline: false,
        isFrequentlyContacted: false
      },
      {
        id: "9",
        name: "Marcus Johnson",
        avatar: "MJ",
        category: "Boxer",
        isOnline: true,
        isFrequentlyContacted: false
      },
      {
        id: "10",
        name: "Olivia Taylor",
        avatar: "OT",
        category: "Dancer",
        isOnline: false,
        isFrequentlyContacted: false
      }
    ];
    setContacts(mockContacts);
    setFilteredContacts(mockContacts);
  }, []);

  // Filter contacts based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredContacts(filtered);
    }
  }, [searchQuery, contacts]);

  // Group filtered contacts alphabetically
  useEffect(() => {
    const groups: ContactGroup[] = [];
    const regularContacts = filteredContacts.filter(contact => !contact.isFrequentlyContacted);
    
    // Sort contacts alphabetically
    const sortedContacts = regularContacts.sort((a, b) => a.name.localeCompare(b.name));
    
    // Group by first letter
    const grouped = sortedContacts.reduce((acc, contact) => {
      const firstLetter = contact.name.charAt(0).toUpperCase();
      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter].push(contact);
      return acc;
    }, {} as Record<string, Contact[]>);

    // Convert to array and sort by letter
    Object.keys(grouped)
      .sort()
      .forEach(letter => {
        groups.push({ letter, contacts: grouped[letter] });
      });

    setContactGroups(groups);
  }, [filteredContacts]);

  const handleContactSelect = (contact: Contact) => {
    // Store contact info in sessionStorage for the chat page
    sessionStorage.setItem('selectedChatContact', JSON.stringify({
      id: contact.id,
      name: contact.name,
      avatar: contact.avatar,
      category: contact.category,
      isOnline: contact.isOnline
    }));
    
    // Navigate to the chat page
    router.push(`/messages/${contact.id}/openmessage`);
  };

  const handleClose = () => {
    router.back();
  };

  const scrollToSection = (letter: string) => {
    const element = document.getElementById(`section-${letter}`);
    if (element && scrollContainerRef.current) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderContactRow = (contact: Contact) => (
    <div
      key={contact.id}
      onClick={() => handleContactSelect(contact)}
      className="flex items-center space-x-3 p-4 hover:bg-input-background cursor-pointer transition-colors border-b border-text-secondary"
    >
      {/* Avatar */}
      <div className="relative">
        <div className="w-12 h-12 bg-button-red rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {contact.avatar}
        </div>
        {contact.isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
        )}
      </div>

      {/* Contact info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-text-primary font-semibold text-base truncate">
          {contact.name}
        </h3>
        <p className="text-text-secondary text-sm truncate">
          {contact.category}
        </p>
      </div>
    </div>
  );

  const renderFrequentlyContacted = () => {
    const frequentlyContacted = filteredContacts.filter(contact => contact.isFrequentlyContacted);
    
    if (frequentlyContacted.length === 0) return null;

    return (
      <div className="mb-6">
        <h2 className="text-text-secondary text-sm font-medium px-4 py-2 bg-input-background">
          Frequently contacted
        </h2>
        {frequentlyContacted.map(renderContactRow)}
      </div>
    );
  };

  const renderAlphabeticalSection = (group: ContactGroup) => (
    <div key={group.letter} id={`section-${group.letter}`} className="mb-6">
      <h2 className="text-text-secondary text-sm font-medium px-4 py-2 bg-input-background sticky top-0 z-10">
        {group.letter}
      </h2>
      {group.contacts.map(renderContactRow)}
    </div>
  );

  const renderQuickScrollBar = () => {
    const letters = contactGroups.map(group => group.letter);
    
    return (
      <div className="fixed right-2 top-1/2 transform -translate-y-1/2 z-20">
        <div className="flex flex-col space-y-1">
          {letters.map(letter => (
            <button
              key={letter}
              onClick={() => scrollToSection(letter)}
              className="w-6 h-6 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-input-background rounded-full transition-colors flex items-center justify-center"
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* App Bar */}
      <div className="bg-surface px-4 py-4 flex items-center justify-between border-b border-text-secondary">
        <h1 className="text-lg font-semibold text-text-primary">
          New Chat
        </h1>
        
        <button
          onClick={handleClose}
          className="p-1 hover:bg-input-background rounded-full transition-colors"
        >
          <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search Input */}
      <div className="px-4 py-4">
        <div className="bg-input-background rounded-lg px-4 py-3">
          <input
            type="text"
            placeholder="Search name or category"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-text-primary placeholder-text-secondary outline-none"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pb-20"
      >
        {filteredContacts.length > 0 ? (
          <>
            {/* Frequently Contacted Section */}
            {renderFrequentlyContacted()}
            
            {/* Alphabetical Sections */}
            {contactGroups.map(renderAlphabeticalSection)}
          </>
        ) : (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <svg className="w-16 h-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-text-primary font-bold text-lg mb-2">No contacts found</h3>
              <p className="text-text-secondary text-sm">Try searching with different keywords.</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Scroll Bar */}
      {contactGroups.length > 0 && renderQuickScrollBar()}
    </div>
  );
}
