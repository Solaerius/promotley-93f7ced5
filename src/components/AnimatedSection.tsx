import { ReactNode } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface AnimatedSectionProps {
  children: ReactNode;
  animation?: 'fade-in' | 'slide-up' | 'fade-in-scale' | 'slide-left' | 'slide-right' | 'blur-in';
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

  const getAnimationStyle = () => {
    const baseTransition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    const animations: Record<string, { initial: React.CSSProperties; visible: React.CSSProperties }> = {
      'fade-in': {
        initial: { opacity: 0, transform: 'translateY(30px)' },
        visible: { opacity: 1, transform: 'translateY(0)' },
      },
      'slide-up': {
        initial: { opacity: 0, transform: 'translateY(50px)' },
        visible: { opacity: 1, transform: 'translateY(0)' },
      },
      'fade-in-scale': {
        initial: { opacity: 0, transform: 'scale(0.95) translateY(20px)' },
        visible: { opacity: 1, transform: 'scale(1) translateY(0)' },
      },
      'slide-left': {
        initial: { opacity: 0, transform: 'translateX(50px)' },
        visible: { opacity: 1, transform: 'translateX(0)' },
      },
      'slide-right': {
        initial: { opacity: 0, transform: 'translateX(-50px)' },
        visible: { opacity: 1, transform: 'translateX(0)' },
      },
      'blur-in': {
        initial: { opacity: 0, transform: 'translateY(30px)', filter: 'blur(8px)' },
        visible: { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' },
      },
    };

    const animationStyle = animations[animation] || animations['fade-in'];
    
    return {
      transition: baseTransition,
      transitionDelay: `${delay}ms`,
      ...(isVisible ? animationStyle.visible : animationStyle.initial),
    };
  };

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      style={getAnimationStyle()}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;
