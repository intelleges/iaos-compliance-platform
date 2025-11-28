import { useEffect, useRef } from "react";
import { Edit, Trash2, Archive, Eye } from "lucide-react";

export interface ContextMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("contextmenu", onClose);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("contextmenu", onClose);
    };
  }, [onClose]);

  // Adjust position to keep menu within viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      if (rect.bottom > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[180px]"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-100 transition-colors ${
            item.variant === "danger"
              ? "text-red-600 hover:bg-red-50"
              : "text-gray-700"
          }`}
        >
          <span className="flex-shrink-0">{item.icon}</span>
          <span className="text-sm font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// Predefined context menu items for common actions
export const getStandardContextMenuItems = (
  onEdit: () => void,
  onDelete: () => void,
  onArchive: () => void,
  onViewDetails: () => void
): ContextMenuItem[] => [
  {
    label: "View Details",
    icon: <Eye className="h-4 w-4" />,
    onClick: onViewDetails,
  },
  {
    label: "Edit",
    icon: <Edit className="h-4 w-4" />,
    onClick: onEdit,
  },
  {
    label: "Archive",
    icon: <Archive className="h-4 w-4" />,
    onClick: onArchive,
  },
  {
    label: "Delete",
    icon: <Trash2 className="h-4 w-4" />,
    onClick: onDelete,
    variant: "danger",
  },
];
