import { useEffect, useRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface ContextMenuOption {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  danger?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  options: ContextMenuOption[];
}

export function ContextMenu({ x, y, onClose, options }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Adjust position if menu would go off screen
  const adjustedStyle = {
    left: x,
    top: y,
  };

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const offsetX = Math.max(0, rect.right - window.innerWidth + 10);
      const offsetY = Math.max(0, rect.bottom - window.innerHeight + 10);
      
      if (offsetX > 0) {
        menuRef.current.style.left = `${x - offsetX}px`;
      }
      if (offsetY > 0) {
        menuRef.current.style.top = `${y - offsetY}px`;
      }
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-pink-200 py-2 min-w-[200px] animate-in fade-in zoom-in-95 duration-100"
      style={adjustedStyle}
    >
      {options.map((option, index) => {
        const IconComponent = option.icon;
        return (
          <button
            key={index}
            onClick={option.onClick}
            className={`w-full px-4 py-2 text-left flex items-center gap-3 transition-colors ${
              option.danger
                ? 'hover:bg-red-50 text-red-600'
                : 'hover:bg-pink-50 text-pink-900'
            }`}
          >
            {IconComponent && <IconComponent className="h-4 w-4" />}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
