import { useState, useEffect } from 'react';

export type NavbarPosition = 'top' | 'bottom' | 'left' | 'right';

export function useNavbarPosition() {
  const [position, setPosition] = useState<NavbarPosition>(() => {
    const saved = localStorage.getItem('navbar-position');
    return (saved as NavbarPosition) || 'right';
  });

  useEffect(() => {
    localStorage.setItem('navbar-position', position);
  }, [position]);

  const cyclePosition = () => {
    setPosition(prev => {
      const positions: NavbarPosition[] = ['right', 'bottom', 'left', 'top'];
      const currentIndex = positions.indexOf(prev);
      return positions[(currentIndex + 1) % positions.length];
    });
  };

  const getPositionLabel = (pos: NavbarPosition): string => {
    const labels: Record<NavbarPosition, string> = {
      top: 'Uppe',
      bottom: 'Nere',
      left: 'Vänster',
      right: 'Höger',
    };
    return labels[pos];
  };

  return { position, setPosition, cyclePosition, getPositionLabel };
}
