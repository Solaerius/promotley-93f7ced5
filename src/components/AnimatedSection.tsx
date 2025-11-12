import { ReactNode } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface AnimatedSectionProps {
  children: ReactNode;
  animation?: 'fade-in' | 'slide-up' | 'fade-in-scale' | 'slide-left' | 'slide-right';
  delay?: number;
  className?: string;
}

const AnimatedSection = ({ 
  children, 
  animation = 'fade-in', 
  delay = 0,
  className = ''
}: AnimatedSectionProps) => {
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
  });

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all duration-1000 ease-out';
    
    const animations = {
      'fade-in': {
        initial: 'opacity-0',
        visible: 'opacity-100',
      },
      'slide-up': {
        initial: 'opacity-0 translate-y-16',
        visible: 'opacity-100 translate-y-0',
      },
      'fade-in-scale': {
        initial: 'opacity-0 scale-95',
        visible: 'opacity-100 scale-100',
      },
      'slide-left': {
        initial: 'opacity-0 translate-x-16',
        visible: 'opacity-100 translate-x-0',
      },
      'slide-right': {
        initial: 'opacity-0 -translate-x-16',
        visible: 'opacity-100 translate-x-0',
      },
    };

    const animationClass = animations[animation];
    return `${baseClasses} ${isVisible ? animationClass.visible : animationClass.initial}`;
  };

  return (
    <div
      ref={ref as any}
      className={`${getAnimationClasses()} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;
