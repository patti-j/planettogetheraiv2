import { useRef, useCallback } from 'react';

// Global drag state management
let globalDragState = {
  isDragging: false,
  dragType: null as 'operation' | 'timeline' | null,
};

const listeners = new Set<() => void>();

export function useGlobalDragState() {
  const forceUpdateRef = useRef(0);
  
  const forceUpdate = useCallback(() => {
    forceUpdateRef.current += 1;
  }, []);
  
  const subscribe = useCallback((listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);
  
  const setDragState = useCallback((isDragging: boolean, dragType: 'operation' | 'timeline' | null = null) => {
    globalDragState.isDragging = isDragging;
    globalDragState.dragType = dragType;
    listeners.forEach(listener => listener());
  }, []);
  
  return {
    isDragging: globalDragState.isDragging,
    dragType: globalDragState.dragType,
    setDragState,
    subscribe,
  };
}