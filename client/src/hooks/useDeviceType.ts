import { useState, useEffect } from 'react';

type DeviceType = 'mobile' | 'desktop';

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  useEffect(() => {
    const checkDeviceType = () => {
      // Check for mobile devices using various methods
      const isMobile = 
        window.innerWidth <= 768 || // Screen width check
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || // User agent check
        ('ontouchstart' in window) || // Touch support check
        (navigator.maxTouchPoints > 0); // Touch points check

      setDeviceType(isMobile ? 'mobile' : 'desktop');
    };

    // Check on initial load
    checkDeviceType();

    // Add resize listener to detect screen size changes
    window.addEventListener('resize', checkDeviceType);

    // Cleanup
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  return deviceType;
}

// Utility functions for checking platform compatibility
export function shouldShowWidget(
  widgetPlatform: "mobile" | "desktop" | "both",
  currentDevice: DeviceType
): boolean {
  if (widgetPlatform === "both") return true;
  return widgetPlatform === currentDevice;
}

export function getPlatformIcon(platform: "mobile" | "desktop" | "both") {
  switch (platform) {
    case "mobile":
      return "📱";
    case "desktop":
      return "🖥️";
    case "both":
      return "📱🖥️";
    default:
      return "📱🖥️";
  }
}