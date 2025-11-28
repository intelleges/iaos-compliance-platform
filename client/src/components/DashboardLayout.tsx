import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO } from "@/const";
import { Building2, Users, Briefcase, FileText, Target, Tag, FolderTree, ClipboardList, Shield, Lock, FileSearch, Settings, Plus, Archive, Search, Eye, ArchiveRestore, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

const menuItems = [
  { 
    label: "Enterprise", 
    icon: Building2, 
    color: "bg-green-500",
    actions: ["Add", "Archive", "Find", "View", "Unarchive"]
  },
  { 
    label: "Person", 
    icon: Users, 
    color: "bg-blue-500",
    actions: ["Add", "Archive", "Find", "View", "Unarchive"]
  },
  { 
    label: "Partner", 
    icon: Briefcase, 
    color: "bg-yellow-500",
    actions: ["Add", "Archive", "Find", "View", "Unarchive"]
  },
  { 
    label: "Protocol", 
    icon: FileText, 
    color: "bg-purple-500",
    actions: ["Add", "Archive", "Find", "View", "Unarchive"]
  },
  { 
    label: "Touchpoint", 
    icon: Target, 
    color: "bg-cyan-500",
    actions: ["Add", "Archive", "Find", "View", "Unarchive"]
  },
  { 
    label: "Partnertype", 
    icon: Tag, 
    color: "bg-pink-500",
    actions: ["Add", "Archive", "Find", "View", "Unarchive"]
  },
  { 
    label: "Group", 
    icon: FolderTree, 
    color: "bg-indigo-500",
    actions: ["Add", "Archive", "Find", "View", "Unarchive"]
  },
  { 
    label: "Questionnaire", 
    icon: ClipboardList, 
    color: "bg-orange-500",
    actions: ["Add", "Archive", "Find", "View", "Unarchive"]
  },
];

const adminItems = [
  { label: "Roles", icon: Shield, color: "bg-emerald-500" },
  { label: "Permissions", icon: Lock, color: "bg-red-500" },
  { label: "Audit Log", icon: FileSearch, color: "bg-sky-500" },
  { label: "System Settings", icon: Settings, color: "bg-rose-500" },
];

const actionIcons: Record<string, any> = {
  "Add": Plus,
  "Archive": Archive,
  "Find": Search,
  "View": Eye,
  "Unarchive": ArchiveRestore,
};

const actionColors: Record<string, string> = {
  "Add": "bg-blue-500",
  "Archive": "bg-orange-500",
  "Find": "bg-purple-500",
  "View": "bg-teal-500",
  "Unarchive": "bg-pink-500",
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  onMenuAction?: (entity: string, action: string) => void;
}

export default function DashboardLayout({ children, onMenuAction }: DashboardLayoutProps) {
  const { user, loading } = useAuth();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    window.location.href = "/";
    return null;
  }

  const toggleMenu = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  const handleActionClick = (entity: string, action: string) => {
    if (onMenuAction) {
      onMenuAction(entity, action);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt="Logo" className="h-10 w-10 rounded-md object-cover" />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm">Intelleges</span>
              <span className="text-xs text-gray-600 leading-tight">Federal Compliance<br/>Management System</span>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {menuItems.map((item) => {
              const isExpanded = expandedMenu === item.label;
              const Icon = item.icon;
              const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;
              
              return (
                <div key={item.label}>
                  {/* Main Menu Item */}
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors text-gray-700 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`h-5 w-5 rounded ${item.color} flex items-center justify-center`}>
                        <span className="text-[10px] font-bold text-white">{item.label.charAt(0)}</span>
                      </div>
                      <ChevronIcon className="h-3 w-3 text-gray-400" />
                    </div>
                  </button>

                  {/* Submenu Actions */}
                  {isExpanded && item.actions && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.actions.map((action) => {
                        const ActionIcon = actionIcons[action];
                        const actionColor = actionColors[action];
                        
                        return (
                          <button
                            key={action}
                            onClick={() => handleActionClick(item.label, action)}
                            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          >
                            <div className="flex items-center gap-2">
                              <ActionIcon className="h-3.5 w-3.5" />
                              <span>{action}</span>
                            </div>
                            <div className={`h-4 w-4 rounded ${actionColor} flex items-center justify-center`}>
                              <span className="text-[8px] font-bold text-white">{action.charAt(0)}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Administration Section */}
          <div className="mt-6 px-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
              Administration
            </div>
            <div className="space-y-1">
              {adminItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => handleActionClick("Admin", item.label)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors text-gray-700 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    <div className={`h-5 w-5 rounded ${item.color} flex items-center justify-center`}>
                      <span className="text-[10px] font-bold text-white">{item.label.charAt(0)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{user.name || "User"}</div>
              <div className="text-xs text-gray-500 truncate">{user.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
