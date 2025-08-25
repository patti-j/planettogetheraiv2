import { useState, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: 'header' | 'panel'; // Track where the message came from
}

// Global chat messages state
let globalChatMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Hello! I\'m Max, your AI assistant. I can help you optimize production schedules, analyze performance metrics, and provide insights about your manufacturing operations. How can I assist you today?',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    source: 'panel'
  }
];

// Subscribers to chat message changes
const subscribers = new Set<(messages: ChatMessage[]) => void>();

// Subscribe to chat message updates
export const useChatSync = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(globalChatMessages);

  useEffect(() => {
    const updateMessages = (messages: ChatMessage[]) => {
      setChatMessages([...messages]);
    };
    
    subscribers.add(updateMessages);
    
    return () => {
      subscribers.delete(updateMessages);
    };
  }, []);

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    globalChatMessages = [...globalChatMessages, newMessage];
    
    // Notify all subscribers
    subscribers.forEach(callback => callback(globalChatMessages));
  };

  const setMessages = (messages: ChatMessage[]) => {
    globalChatMessages = messages;
    
    // Notify all subscribers
    subscribers.forEach(callback => callback(globalChatMessages));
  };

  return {
    chatMessages,
    addMessage,
    setMessages
  };
};