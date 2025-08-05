import companyLogo from '@/assets/company-logo.png';

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
      <img 
        src={companyLogo}
        alt="PlanetTogether"
        className={`${icon} object-contain`}
      />
      {showText && (
        <span className={`font-bold ${text} text-gray-900 dark:text-white`}>
          PlanetTogether
        </span>
      )}
    </div>
  );
}