import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

export type NavbarPosition = 'top' | 'bottom' | 'left' | 'right';

interface NavbarPositionContextValue {
  position: NavbarPosition;
  setPosition: (pos: NavbarPosition) => void;
  cyclePosition: () => void;
  getPositionLabel: (pos: NavbarPosition) => string;
}

const NavbarPositionContext = createContext<NavbarPositionContextValue | null>(null);

export function NavbarPositionProvider({ children }: { children: ReactNode }) {
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

  return (
    <NavbarPositionContext.Provider value={{ position, setPosition, cyclePosition, getPositionLabel }}>
      {children}
    </NavbarPositionContext.Provider>
  );
}

export function useNavbarPosition() {
  const context = useContext(NavbarPositionContext);
  if (!context) {
    throw new Error('useNavbarPosition must be used within a NavbarPositionProvider');
  }
  return context;
}
