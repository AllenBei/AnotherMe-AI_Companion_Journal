// TypeScript declarations for untyped libraries
declare module 'react-responsive-masonry' {
  import * as React from 'react';

  interface MasonryProps {
    children: React.ReactNode;
    columnsCount?: number;
    gutter?: string | number;
    className?: string;
    style?: React.CSSProperties;
  }

  interface ResponsiveMasonryProps {
    children: React.ReactNode;
    columnsCountBreakPoints?: {
      [key: number]: number;
    };
    className?: string;
    style?: React.CSSProperties;
  }

  const Masonry: React.FC<MasonryProps>;
  
  export const ResponsiveMasonry: React.FC<ResponsiveMasonryProps>;
  
  export default Masonry;
} 