import { ReactNode, useRef, useEffect, useState } from 'react';

interface ResizableSidebarProps {
  children: ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  side?: 'left' | 'right';
}

export function ResizableSidebar({
  children,
  defaultWidth = 320,
  minWidth = 250,
  maxWidth = 600,
  side = 'right',
}: ResizableSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeStartRef.current) return;

      const { startX, startWidth } = resizeStartRef.current;
      let newWidth: number;

      if (side === 'right') {
        // For right-side panel: dragging left increases width, dragging right decreases width
        const deltaX = startX - e.clientX; // Positive when dragging left
        newWidth = startWidth + deltaX;
      } else {
        // For left-side panel: dragging right increases width, dragging left decreases width
        const deltaX = e.clientX - startX; // Positive when dragging right
        newWidth = startWidth + deltaX;
      }

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, minWidth, maxWidth, side]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    resizeStartRef.current = {
      startX: e.clientX,
      startWidth: sidebarWidth,
    };
  };

  const borderClass = side === 'right' ? 'border-l' : 'border-r';
  const resizeHandleClass = side === 'right' ? 'left-0' : 'right-0';

  return (
    <aside
      ref={sidebarRef}
      style={{ width: `${sidebarWidth}px` }}
      className={`bg-card ${borderClass} border-border flex flex-col overflow-y-auto relative flex-shrink-0 h-full`}
    >
      <div
        className={`absolute ${resizeHandleClass} top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/50 transition-colors z-10`}
        onMouseDown={handleMouseDown}
      />
      {children}
    </aside>
  );
}

