import { useEffect, useState } from 'react';

export const useKeyboardVisibility = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      // Detect if keyboard is visible by checking viewport height
      const initialHeight = window.innerHeight;
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      
      // If viewport height is significantly smaller, keyboard is likely visible
      const heightDifference = initialHeight - currentHeight;
      const keyboardThreshold = 150; // pixels
      
      setIsKeyboardVisible(heightDifference > keyboardThreshold);
      
      // Add/remove class to body for CSS targeting
      if (heightDifference > keyboardThreshold) {
        document.body.classList.add('keyboard-visible');
      } else {
        document.body.classList.remove('keyboard-visible');
      }
    };

    // Listen for viewport changes (more reliable than window resize)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    // Also listen for focus events on inputs/textareas
    const handleFocus = () => {
      // Small delay to allow keyboard to appear
      setTimeout(handleResize, 300);
    };

    const handleBlur = () => {
      // Small delay to allow keyboard to disappear
      setTimeout(handleResize, 300);
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
      document.body.classList.remove('keyboard-visible');
    };
  }, []);

  return isKeyboardVisible;
};



