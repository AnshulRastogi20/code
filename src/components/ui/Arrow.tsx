import { FC } from 'react';

const Arrow: FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      className={className}
      width="40" 
      height="40" 
      viewBox="0 0 24 24"
    >
      {/* Your SVG path here */}
    </svg>
  );
};

export default Arrow;