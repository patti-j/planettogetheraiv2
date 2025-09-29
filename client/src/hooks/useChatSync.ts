import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  source?: 'header' | 'panel' | 'floating'; // Track where the message came from
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
    const response = await apiRequest('GET', `/api/max-chat-messages/${currentUserId}`);
    const data = await response.json();
    const loadedMessages = data.map((msg: any) => ({
      ...msg,
      createdAt: msg.createdAt || new Date().toISOString()
    }));
    
    globalChatMessages = loadedMessages.length > 0 ? loadedMessages : [
      {
        id: -1, // Temporary ID for welcome message
        role: 'assistant',
        content: 'Hello! I\'m Max, your AI assistant. I can help you optimize production schedules, analyze performance metrics, and provide insights about your manufacturing operations. How can I assist you today?',
        createdAt: new Date().toISOString(),
        source: 'panel'
      }
    ];
    
    messagesLoaded = true;
    
    // Notify all subscribers
    subscribers.forEach(callback => callback(globalChatMessages));
  } catch (error) {
    console.error('Failed to load chat history:', error instanceof Error ? error.message : error);
    // Fallback to default welcome message
    globalChatMessages = [
      {
        id: -1,
        role: 'assistant',
        content: 'Hello! I\'m Max, your AI assistant. I can help you optimize production schedules, analyze performance metrics, and provide insights about your manufacturing operations. How can I assist you today?',
        createdAt: new Date().toISOString(),
        source: 'panel'
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
                     localStorage.getItem('auth_token') || 
                     sessionStorage.getItem('auth_token') ||
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const user = await response.json();
    currentUserId = user.id;
    await loadChatHistory();
  } catch (error) {
    console.error('Failed to get current user:', error instanceof Error ? error.message : error);
    // Set a fallback welcome message even if auth fails
    globalChatMessages = [
      {
        id: -1,
        role: 'assistant',
        content: 'Hello! I\'m Max, your AI assistant. I can help you optimize production schedules, analyze performance metrics, and provide insights about your manufacturing operations. How can I assist you today?',
        createdAt: new Date().toISOString(),
        source: 'panel'
      }
    ];
    messagesLoaded = true;
    subscribers.forEach(callback => callback(globalChatMessages));
  }
};

// Initialize user and load history
getCurrentUser();

// Subscribe to chat message updates
export const useChatSync = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(globalChatMessages);

  useEffect(() => {
    const updateMessages = (messages: ChatMessage[]) => {
      setChatMessages([...messages]);
    };
    
    subscribers.add(updateMessages);
    
    // Try to load chat history if not already loaded
    if (!messagesLoaded) {
      getCurrentUser();
    }
    
    return () => {
      subscribers.delete(updateMessages);
    };
  }, []);

  const addMessage = async (message: Omit<ChatMessage, 'id' | 'createdAt'>) => {
    if (!currentUserId) {
      console.warn('No user ID available, saving message locally only');
      const localMessage: ChatMessage = {
        ...message,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      globalChatMessages = [...globalChatMessages, localMessage];
      subscribers.forEach(callback => callback(globalChatMessages));
      return;
    }

    try {
      // Save to database
      const response = await apiRequest('POST', '/api/max-chat-messages', {
        userId: currentUserId,
        role: message.role,
        content: message.content,
        source: message.source || 'panel'
      });

      const savedMessage = await response.json();
      const newMessage: ChatMessage = {
        ...savedMessage,
        createdAt: savedMessage.createdAt || new Date().toISOString()
      };

      globalChatMessages = [...globalChatMessages, newMessage];
    } catch (error) {
      console.error('Failed to save message to database:', error instanceof Error ? error.message : error);
      // Fallback to local state
      const fallbackMessage: ChatMessage = {
        ...message,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      globalChatMessages = [...globalChatMessages, fallbackMessage];
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