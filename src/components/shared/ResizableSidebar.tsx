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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth =
        side === 'right'
          ? window.innerWidth - e.clientX
          : e.clientX;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
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

  const borderClass = side === 'right' ? 'border-l' : 'border-r';
  const resizeHandleClass = side === 'right' ? 'left-0' : 'right-0';

  return (
    <aside
      ref={sidebarRef}
      style={{ width: `${sidebarWidth}px` }}
      className={`bg-card ${borderClass} border-border flex flex-col overflow-y-auto relative`}
    >
      <div
        className={`absolute ${resizeHandleClass} top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/50 transition-colors z-10`}
        onMouseDown={() => setIsResizing(true)}
      />
      {children}
    </aside>
  );
}

