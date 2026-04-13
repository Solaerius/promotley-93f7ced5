interface SectionBlendProps {
  direction?: 'up' | 'down' | 'both';
  intensity?: 'soft' | 'medium' | 'strong';
  className?: string;
}

const SectionBlend = ({ 
  direction = 'both', 
  intensity = 'medium',
  className = '' 
}: SectionBlendProps) => {
  const heights = {
    soft: 'h-24 md:h-32',
    medium: 'h-32 md:h-48',
    strong: 'h-48 md:h-64',
  };

  const blurAmounts = {
    soft: 'blur-[60px]',
    medium: 'blur-[100px]',
    strong: 'blur-[140px]',
  };

  return (
    <>
      {(direction === 'up' || direction === 'both') && (
        <div 
          className={`absolute top-0 left-0 right-0 ${heights[intensity]} pointer-events-none z-10 ${className}`}
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, transparent 100%)',
          }}
        >
          <div className={`absolute inset-0 ${blurAmounts[intensity]} opacity-80`} 
            style={{ 
              background: 'inherit',
              backdropFilter: `blur(${intensity === 'soft' ? '20px' : intensity === 'medium' ? '40px' : '60px'})`,
              maskImage: 'linear-gradient(to bottom, black, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
            }} 
          />
        </div>
      )}
      {(direction === 'down' || direction === 'both') && (
        <div 
          className={`absolute bottom-0 left-0 right-0 ${heights[intensity]} pointer-events-none z-10 ${className}`}
        >
          <div className={`absolute inset-0 ${blurAmounts[intensity]} opacity-80`}
            style={{ 
              backdropFilter: `blur(${intensity === 'soft' ? '20px' : intensity === 'medium' ? '40px' : '60px'})`,
              maskImage: 'linear-gradient(to top, black, transparent)',
              WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
            }} 
          />
        </div>
      )}
    </>
  );
};

export default SectionBlend;
