import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { NavigationMenuContent } from './navigation-menu-content';
import { cn } from '@/lib/utils';

interface SlideOutMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SlideOutMenu({ isOpen, onClose }: SlideOutMenuProps) {
  const [isPinned, setIsPinned] = useState(() => {
    try {
      return localStorage.getItem('navigationMenuPinned') === 'true';
    } catch {
      return false;
    }
  });
  const menuRef = useRef<HTMLDivElement>(null);

  const handleTogglePin = () => {
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    try {
      localStorage.setItem('navigationMenuPinned', newPinned.toString());
    } catch {
      // Ignore localStorage errors
    }
  };

  // Close menu when clicking outside (only if not pinned)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !isPinned && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // Check if click is on the hamburger button
        const target = event.target as HTMLElement;
        if (!target.closest('button[aria-label*="menu"]')) {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, isPinned]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          if (!isPinned) {
            onClose();
          }
          break;
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isOpen, onClose, isPinned]);

  return (
    <>
      {/* Backdrop - only show when not pinned */}
      {!isPinned && (
        <div
          className={cn(
            "fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity z-40",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={onClose}
        />
      )}

      {/* Slide-out Menu */}
      <div
        ref={menuRef}
        className={cn(
          "fixed right-0 top-[72px] bg-background border-l shadow-xl z-50",
          "w-80",
          isPinned 
            ? "translate-x-0 h-[calc(100vh-72px)]" // Always visible when pinned, height adjusted for header
            : cn(
                "transition-transform duration-300 ease-in-out h-[calc(100vh-72px)]",
                isOpen ? "translate-x-0" : "translate-x-full"
              )
        )}
      >
        <NavigationMenuContent 
          isPinned={isPinned}
          onTogglePin={handleTogglePin}
          onClose={onClose}
          isOpen={isOpen}
        />
      </div>
    </>
  );
}