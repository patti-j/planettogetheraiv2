import { Factory } from 'lucide-react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'medium', showText = true, className = '' }: LogoProps) {
  const sizeClasses = {
    small: {
      icon: 'w-6 h-6',
      text: 'text-lg',
      container: 'gap-2'
    },
    medium: {
      icon: 'w-8 h-8',
      text: 'text-xl',
      container: 'gap-3'
    },
    large: {
      icon: 'w-12 h-12',
      text: 'text-2xl',
      container: 'gap-4'
    }
  };

  const { icon, text, container } = sizeClasses[size];

  return (
    <div className={`flex items-center ${container} ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg opacity-20 blur-sm" />
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2">
          <Factory className={`${icon} text-white`} />
        </div>
      </div>
      {showText && (
        <span className={`font-bold ${text} bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
          PlanetTogether
        </span>
      )}
    </div>
  );
}