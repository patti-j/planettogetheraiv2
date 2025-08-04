import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');  
      } else {
        setDeviceType('desktop');
      }
    };

    // Check initially
    checkDeviceType();

    // Add event listener for resize
    window.addEventListener('resize', checkDeviceType);

    // Cleanup
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  return deviceType;
}

export function shouldShowWidget(targetPlatform: string, currentDevice: DeviceType): boolean {
  switch (targetPlatform.toLowerCase()) {
    case 'mobile':
      return currentDevice === 'mobile';
    case 'tablet':
      return currentDevice === 'tablet';
    case 'desktop':
      return currentDevice === 'desktop';
    case 'both':
    case 'all':
      return true;
    default:
      return true;
  }
}