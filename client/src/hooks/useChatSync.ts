import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  source?: 'header' | 'panel' | 'floating'; // Track where the message came from
  agentId?: string; // Which agent sent this message (e.g., 'max', 'production_scheduling', 'quality_analysis')
  agentName?: string; // Display name of the agent (e.g., 'Max', 'Production Scheduling Agent')
  markedForPlaybook?: boolean; // Flag indicating if the message should be added to agent playbook
}

// Current user ID - will be loaded from auth
let currentUserId: number | null = null;

// Global chat messages state
let globalChatMessages: ChatMessage[] = [];

// Track if messages are loaded from database
let messagesLoaded = false;

// Subscribers to chat message changes
const subscribers = new Set<(messages: ChatMessage[]) => void>();

// Load chat history from database
const loadChatHistory = async () => {
  if (!currentUserId || messagesLoaded) return;

  try {
    console.log('[Chat Sync] Loading chat history for user:', currentUserId);
    const response = await apiRequest('GET', `/api/max-chat-messages/${currentUserId}`);
    
    // Check if response indicates database not initialized (500 error or similar)
    if (!response.ok) {
      if (response.status === 500) {
        // Database likely not initialized yet, silently use fallback
        console.log('[Chat Sync] Database not initialized, using fallback');
      } else {
        console.warn('[Chat Sync] Unexpected response status:', response.status);
      }
      throw new Error('Database not ready');
    }
    
    const data = await response.json();
    const loadedMessages = data.map((msg: any) => ({
      ...msg,
      createdAt: msg.createdAt || new Date().toISOString()
    }));
    
    // If no messages from database, check localStorage
    if (loadedMessages.length === 0) {
      const storedMessages = localStorage.getItem('max_chat_messages');
      if (storedMessages) {
        try {
          const parsedMessages = JSON.parse(storedMessages);
          if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
            console.log('[Chat Sync] Loaded messages from localStorage backup');
            globalChatMessages = parsedMessages;
            messagesLoaded = true;
            subscribers.forEach(callback => callback(globalChatMessages));
            return;
          }
        } catch (e) {
          console.warn('[Chat Sync] Could not parse localStorage messages:', e);
        }
      }
    }
    
    globalChatMessages = loadedMessages.length > 0 ? loadedMessages : [
      {
        id: -1, // Temporary ID for welcome message
        role: 'assistant',
        content: 'Hello! I\'m Max, your AI assistant. I can help you optimize production schedules, analyze performance metrics, and provide insights about your manufacturing operations. How can I assist you today?',
        createdAt: new Date().toISOString(),
        source: 'panel',
        agentId: 'max',
        agentName: 'Max'
      }
    ];
    
    messagesLoaded = true;
    console.log('[Chat Sync] Loaded', globalChatMessages.length, 'messages');
    
    // Notify all subscribers
    subscribers.forEach(callback => callback(globalChatMessages));
  } catch (error) {
    // Don't log as error if database is not initialized
    if (error instanceof Error && error.message === 'Database not ready') {
      console.log('[Chat Sync] Using localStorage backup after database check');
    } else {
      console.error('[Chat Sync] Failed to load chat history:', error instanceof Error ? error.message : error);
    }
    
    // Try localStorage as fallback
    const storedMessages = localStorage.getItem('max_chat_messages');
    if (storedMessages) {
      try {
        const parsedMessages = JSON.parse(storedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          console.log('[Chat Sync] Using localStorage backup after database error');
          globalChatMessages = parsedMessages;
          messagesLoaded = true;
          subscribers.forEach(callback => callback(globalChatMessages));
          return;
        }
      } catch (e) {
        console.warn('[Chat Sync] Could not parse localStorage messages:', e);
      }
    }
    
    // Fallback to default welcome message
    globalChatMessages = [
      {
        id: -1,
        role: 'assistant',
        content: 'Hello! I\'m Max, your AI assistant. I can help you optimize production schedules, analyze performance metrics, and provide insights about your manufacturing operations. How can I assist you today?',
        createdAt: new Date().toISOString(),
        source: 'panel',
        agentId: 'max',
        agentName: 'Max'
      }
    ];
    messagesLoaded = true;
    subscribers.forEach(callback => callback(globalChatMessages));
  }
};

// Get current user ID
const getCurrentUser = async () => {
  if (currentUserId) return;
  
  try {
    // Try different token sources
    const authToken = localStorage.getItem('auth_token') || 
                     sessionStorage.getItem('auth_token');
    
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    
    const response = await fetch('/api/auth/me', {
      headers,
      credentials: 'include' // Include cookies for session-based auth
    });
    
    if (!response.ok) {
      // In development mode, try to get the default user
      if (window.location.hostname === 'localhost' || window.location.hostname.includes('replit')) {
        // Set default user ID for development
        currentUserId = 1; // Admin user in development
        console.log('[Chat Sync] Using default user ID for development:', currentUserId);
        await loadChatHistory();
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    // Handle both direct user object and nested user property
    const user = data.user || data;
    currentUserId = user.id;
    console.log('[Chat Sync] User authenticated, ID:', currentUserId);
    await loadChatHistory();
  } catch (error) {
    console.error('Failed to get current user:', error instanceof Error ? error.message : error);
    // In development, use default user
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('replit')) {
      currentUserId = 1;
      console.log('[Chat Sync] Fallback to default user ID for development:', currentUserId);
      await loadChatHistory();
    } else {
      // Set a fallback welcome message even if auth fails
      globalChatMessages = [
        {
          id: -1,
          role: 'assistant',
          content: 'Hello! I\'m Max, your AI assistant. I can help you optimize production schedules, analyze performance metrics, and provide insights about your manufacturing operations. How can I assist you today?',
          createdAt: new Date().toISOString(),
          source: 'panel',
          agentId: 'max',
          agentName: 'Max'
        }
      ];
      messagesLoaded = true;
      subscribers.forEach(callback => callback(globalChatMessages));
    }
  }
};

// Initialize user and load history
getCurrentUser();

// Subscribe to chat message updates
export const useChatSync = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(globalChatMessages);
  const [isInitialized, setIsInitialized] = useState(messagesLoaded);

  useEffect(() => {
    const updateMessages = (messages: ChatMessage[]) => {
      setChatMessages([...messages]);
      if (messages.length > 0) {
        setIsInitialized(true);
      }
    };
    
    subscribers.add(updateMessages);
    
    // Try to load chat history if not already loaded
    const initializeChat = async () => {
      if (!messagesLoaded) {
        await getCurrentUser();
        
        // If still not loaded after getCurrentUser, set a welcome message
        if (globalChatMessages.length === 0 && !messagesLoaded) {
          globalChatMessages = [{
            id: -1,
            role: 'assistant',
            content: 'Hello! I\'m Max, your AI assistant. I can help you optimize production schedules, analyze performance metrics, and provide insights about your manufacturing operations. How can I assist you today?',
            createdAt: new Date().toISOString(),
            source: 'panel',
            agentId: 'max',
            agentName: 'Max'
          }];
          messagesLoaded = true;
          subscribers.forEach(callback => callback(globalChatMessages));
        }
      } else if (chatMessages.length === 0) {
        // If messages were loaded but are empty, show the initial message
        updateMessages(globalChatMessages);
      }
    };
    
    initializeChat();
    
    return () => {
      subscribers.delete(updateMessages);
    };
  }, []);

  const addMessage = async (message: Omit<ChatMessage, 'id' | 'createdAt'>) => {
    // Ensure we have a user ID first
    if (!currentUserId) {
      await getCurrentUser();
    }
    
    if (!currentUserId) {
      console.warn('[Chat Sync] No user ID available, saving message locally only');
      const localMessage: ChatMessage = {
        ...message,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      globalChatMessages = [...globalChatMessages, localMessage];
      subscribers.forEach(callback => callback(globalChatMessages));
      return;
    }

    console.log('[Chat Sync] Saving message for user:', currentUserId, 'Role:', message.role);
    
    try {
      // Save to database
      const response = await apiRequest('POST', '/api/max-chat-messages', {
        userId: currentUserId,
        role: message.role,
        content: message.content,
        agentId: message.agentId || null,
        agentName: message.agentName || null,
        source: message.source || 'panel'
      });

      const savedMessage = await response.json();
      console.log('[Chat Sync] Message saved successfully:', savedMessage);
      
      const newMessage: ChatMessage = {
        ...savedMessage,
        createdAt: savedMessage.createdAt || new Date().toISOString()
      };

      globalChatMessages = [...globalChatMessages, newMessage];
      
      // Save messages to localStorage as backup
      try {
        localStorage.setItem('max_chat_messages', JSON.stringify(globalChatMessages));
      } catch (e) {
        console.warn('[Chat Sync] Could not save to localStorage:', e);
      }
    } catch (error) {
      console.error('[Chat Sync] Failed to save message to database:', error instanceof Error ? error.message : error);
      // Fallback to local state
      const fallbackMessage: ChatMessage = {
        ...message,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      globalChatMessages = [...globalChatMessages, fallbackMessage];
      
      // Save to localStorage as backup
      try {
        localStorage.setItem('max_chat_messages', JSON.stringify(globalChatMessages));
      } catch (e) {
        console.warn('[Chat Sync] Could not save to localStorage:', e);
      }
    }
    
    // Notify all subscribers
    subscribers.forEach(callback => callback(globalChatMessages));
  };

  const setMessages = (messages: ChatMessage[]) => {
    globalChatMessages = messages;
    
    // Notify all subscribers
    subscribers.forEach(callback => callback(globalChatMessages));
  };

  const clearMessages = async () => {
    if (!currentUserId) {
      globalChatMessages = [];
      subscribers.forEach(callback => callback(globalChatMessages));
      return;
    }

    try {
      await apiRequest('DELETE', `/api/max-chat-messages/${currentUserId}`);
      globalChatMessages = [];
      messagesLoaded = false; // Allow reloading
    } catch (error) {
      console.error('Failed to clear chat history:', error instanceof Error ? error.message : error);
      // Still clear local state
      globalChatMessages = [];
    }
    
    // Notify all subscribers
    subscribers.forEach(callback => callback(globalChatMessages));
  };

  return {
    chatMessages,
    addMessage,
    setMessages,
    clearMessages
  };
};