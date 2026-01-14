import { useState, useEffect } from 'react';

type NavbarPosition = 'top' | 'bottom';

export function useNavbarPosition() {
  const [position, setPosition] = useState<NavbarPosition>(() => {
    const saved = localStorage.getItem('navbar-position');
    return (saved as NavbarPosition) || 'bottom';
  });

  useEffect(() => {
    localStorage.setItem('navbar-position', position);
  }, [position]);

  const togglePosition = () => {
    setPosition(prev => prev === 'top' ? 'bottom' : 'top');
  };

  return { position, setPosition, togglePosition };
}
