const SectionDivider = ({ 
  variant = 'default',
  flip = false 
}: { 
  variant?: 'default' | 'gradient' | 'subtle';
  flip?: boolean;
}) => {
  const baseClasses = `w-full h-24 md:h-32 pointer-events-none ${flip ? 'rotate-180' : ''}`;
  
  if (variant === 'gradient') {
    return (
      <div className={`${baseClasses} bg-gradient-to-b from-transparent via-primary/5 to-transparent`} />
    );
  }
  
  if (variant === 'subtle') {
    return (
      <div className={`${baseClasses} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    );
  }
  
  return (
    <div className={`${baseClasses} relative overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-b from-background to-transparent opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-80" />
      <div className="absolute inset-0 backdrop-blur-sm opacity-30" />
    </div>
  );
};

export default SectionDivider;
