import { useState, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

export function useMobileKeyboard() {
  const isMobile = useIsMobile();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) return;

    let initialViewportHeight = window.visualViewport?.height || window.innerHeight;
    
    const handleResize = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      
      // Keyboard is considered open if viewport shrunk by more than 150px
      const keyboardOpen = heightDifference > 150;
      setIsKeyboardOpen(keyboardOpen);
      
      // Apply/remove keyboard-open class to body
      if (keyboardOpen) {
        document.body.classList.add('keyboard-open');
      } else {
        document.body.classList.remove('keyboard-open');
      }
    };

    const handleVisualViewportChange = () => handleResize();
    
    // Listen to visual viewport changes (modern approach)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    }
    
    // Fallback for older browsers
    window.addEventListener('resize', handleResize);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      }
      window.removeEventListener('resize', handleResize);
      document.body.classList.remove('keyboard-open');
    };
  }, [isMobile]);

  const handleInputFocus = () => {
    if (isMobile) {
      // Prevent viewport jump by using setTimeout
      setTimeout(() => {
        const activeElement = document.activeElement as HTMLInputElement;
        if (activeElement) {
          activeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 300);
    }
  };

  const handleInputBlur = () => {
    if (isMobile) {
      // Small delay to ensure keyboard is closed
      setTimeout(() => {
        setIsKeyboardOpen(false);
        document.body.classList.remove('keyboard-open');
      }, 100);
    }
  };

  return {
    isKeyboardOpen,
    handleInputFocus,
    handleInputBlur,
    isMobile
  };
}