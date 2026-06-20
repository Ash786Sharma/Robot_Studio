import React, { useRef, useState } from 'react';
import { Box } from '@mui/material';

interface ResizePanelProps {
  children: React.ReactNode;
  defaultSize: number;
  minSize: number;
  maxSize: number;
  onResize: (size: number) => void;
  direction: 'horizontal' | 'vertical';
}

const ResizePanel: React.FC<ResizePanelProps> = ({
  children,
  defaultSize,
  minSize,
  maxSize,
  onResize,
  direction,
}) => {
  const [size, setSize] = useState(defaultSize);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const container = containerRef.current.parentElement;
      if (!container) return;

      if (direction === 'horizontal') {
        const newSize = e.clientX - container.getBoundingClientRect().left;
        if (newSize >= minSize && newSize <= maxSize) {
          setSize(newSize);
          onResize(newSize);
        }
      } else {
        const newSize = e.clientY - container.getBoundingClientRect().top;
        if (newSize >= minSize && newSize <= maxSize) {
          setSize(newSize);
          onResize(newSize);
        }
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minSize, maxSize, direction, onResize]);

  return (
    <>
      <Box
        ref={containerRef}
        sx={{
          [direction === 'horizontal' ? 'width' : 'height']: size,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: direction === 'horizontal' ? 'row' : 'column',
        }}
      >
        {children}
      </Box>
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          [direction === 'horizontal' ? 'width' : 'height']: '4px',
          [direction === 'horizontal' ? 'cursor' : 'cursor']: 'col-resize',
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: '#0e639c',
          },
        }}
      />
    </>
  );
};

export default ResizePanel;
