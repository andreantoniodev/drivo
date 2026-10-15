import React from 'react';

export interface DrivoLogoProps {
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
}

export const DrivoLogo: React.FC<DrivoLogoProps> = ({
  className,
  width = 88,
  height = 28,
  alt = 'Drivo',
}) => {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/drivo-logo.png"
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        objectFit: 'contain',
      }}
    />
  );
};
