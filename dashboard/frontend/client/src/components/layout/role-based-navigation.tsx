import { Link } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  Clock, 
  Package, 
  FileText, 
  Users, 
  Search,
  Calendar,
  CalendarDays,
  ShoppingCart, 
  BarChart3, 
  Settings,
  LogOut,
  Zap,
  Timer,
  Upload,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  RefreshCw,
  Database,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter, routes } from "@/hooks/useRouter";
import { useAuth } from "@/hooks/useAuth";
import marinLogo from "@/assets/marin-logo.svg";

// Navigation items for regular employees
const employeeNavigationItems = [
  { path: "/employee-dashboard", label: "Weekly Summary", icon: LayoutDashboard },
  { path: "/time-tracking", label: "Time Tracking", icon: Clock },
  { path: "/clock", label: "Punch Clock", icon: Timer },
  { path: "/marin-job-form", label: "Job Entry Form", icon: FileText },
  { path: "/employee-schedule", label: "My Schedule", icon: Calendar },
  { path: "/customers", label: "Customers", icon: Users },
  { path: "/products", label: "Products", icon: ShoppingCart },
];

// Admin navigation with grouped sections
const adminNavigationItems = [
  { 
    label: "Core Operations", 
    items: [
      { path: "/", label: "Work Calendar", icon: LayoutDashboard },
      { path: "/time-tracking", label: "Time Clock", icon: Clock },
      { path: "/marin-job-form", label: "Hours and Materials", icon: FileText },
      { path: "/invoices", label: "Invoices", icon: FileText },
      { path: "/customers", label: "Customers", icon: Users },
      { path: "/products", label: "Products", icon: ShoppingCart },
    ]
  },
  {
    label: "Employee Management",
    items: [
      { path: "/employees", label: "Employee Directory", icon: Users },
      { path: "/employee-schedule", label: "Employee Schedules", icon: Calendar },
    ]
  },
  {
    label: "Administration",
    items: [
      { path: "/reports", label: "Reports", icon: BarChart3 },
      { path: "/settings", label: "Settings", icon: Settings },
      { path: "/workflows", label: "Workflows", icon: Zap },
      { path: "/documentation", label: "Documentation", icon: FileText },
    ]
  }
];

interface RoleBasedNavigationProps {
  userRole?: string;
}

// System Status Indicators Component
function SystemStatusIndicators() {
  // QuickBooks authorization status query
  const { data: qbAuthStatus, isError: qbAuthError } = useQuery({
    queryKey: ["/api/quickbooks/auth-status"],
    queryFn: () => api.getTokenStatus(),
    refetchInterval: 60000, // Refresh every minute
    retry: 1,
    select: (data: any) => data?.isAuthorized || false
  });

  // Database health check query
  const { data: dbHealth, isError: dbError } = useQuery({
    queryKey: ["/api/health"],
    queryFn: () => fetch("http://23.128.116.9:5000/health").then((res) => res.json()),
    refetchInterval: 120000, // Refresh every 2 minutes
    retry: 1,
    select: (data: any) => data?.ok || false
  });

  const getQBStatusColor = () => {
    if (qbAuthError || !qbAuthStatus) return "bg-red-500";
    return "bg-green-500";
  };

  const getQBStatusText = () => {
    if (qbAuthError || !qbAuthStatus) return "QuickBooks Need Auth";
    return "QuickBooks Authorized";
  };

  const getDBStatusColor = () => {
    if (dbError || !dbHealth) return "bg-red-500";
    return "bg-green-500";
  };

  const getDBStatusText = () => {
    if (dbError || !dbHealth) return "Database Disconnected";
    return "Database Connected";
  };

  return (
    <div className="space-y-2">
      {/* QuickBooks Status */}
      <div className="flex items-center space-x-2">
        <DollarSign className="w-3 h-3 text-zinc-400" />
        <div className={`w-2 h-2 rounded-full ${getQBStatusColor()}`} />
        <span className="text-xs text-zinc-400 truncate">
          {getQBStatusText()}
        </span>
      </div>
      
      {/* Database Status */}
      <div className="flex items-center space-x-2">
        <Database className="w-3 h-3 text-zinc-400" />
        <div className={`w-2 h-2 rounded-full ${getDBStatusColor()}`} />
        <span className="text-xs text-zinc-400 truncate">
          {getDBStatusText()}
        </span>
      </div>
    </div>
  );
}

export default function RoleBasedNavigation({ userRole = "admin" }: RoleBasedNavigationProps) {
  const { location, isActive } = useRouter();
  const { user } = useAuth();
  const [expandedSections, setExpandedSections] = useState<string[]>(["Core Operations"]);
  
  const toggleSection = (sectionLabel: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionLabel)
        ? prev.filter(s => s !== sectionLabel)
        : [...prev, sectionLabel]
    );
  };

  const isAdmin = userRole === "admin";

  return (
    <nav className="bg-zinc-900 border-r border-zinc-800 w-64 flex-shrink-0">
      <div className="flex flex-col h-full">
        {/* Logo and Title */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center space-x-3">
            <img src={marinLogo} alt="Marin Pest Control" className="w-8 h-8 rounded" />
            <div>
              <h1 className="text-white font-bold text-lg">Marin Pest Control</h1>
              <p className="text-zinc-400 text-xs">MPC Internal Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-2">
          {isAdmin ? (
            // Admin grouped navigation
            <div className="space-y-2">
              {adminNavigationItems.map((section) => (
                <div key={section.label}>
                  <button
                    onClick={() => toggleSection(section.label)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                  >
                    <span>{section.label}</span>
                    {expandedSections.includes(section.label) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  
                  {expandedSections.includes(section.label) && (
                    <div className="ml-4 space-y-1">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const itemIsActive = isActive(item.path);
                        
                        return (
                          <Link key={item.path} href={item.path}>
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full justify-start text-left h-auto py-2 px-3",
                                itemIsActive
                                  ? "bg-purple-600 text-white hover:bg-purple-700"
                                  : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                              )}
                            >
                              <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Employee flat navigation
            <div className="space-y-1">
              {employeeNavigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                
                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-left h-auto py-3 px-3",
                        isActive
                          ? "bg-purple-600 text-white hover:bg-purple-700"
                          : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                      )}
                    >
                      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* System Status Indicators */}
        <div className="px-4 py-3 border-t border-zinc-800">
          <SystemStatusIndicators />
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="text-white font-medium">Employee</p>
              <p className="text-zinc-400 text-xs capitalize">{userRole}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}