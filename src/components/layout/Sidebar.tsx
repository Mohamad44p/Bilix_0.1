"use client";

import React, { JSX } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  LayoutDashboard,
  FileText,
  Upload,
  BarChart2,
  Settings,
  Users,
  HelpCircle,
  CreditCard,
  MessageSquare,
  Coins,
  Database,
} from "lucide-react";
import { File } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "motion/react"

interface SidebarProps {
  className?: string;
  collapsed: boolean;
  onToggle: () => void;
  isMobile: boolean;
  visible: boolean;
}

interface SidebarItemProps {
  href: string;
  icon: JSX.Element;
  label: string;
  collapsed: boolean;
  active: boolean;
}

interface UsageItemProps { 
  icon: JSX.Element; 
  label: string; 
  value: string;
  tooltip?: string;
  isFeature?: boolean;
}

function NavItem({ href, icon, label, collapsed, active }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
        active
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800/50"
      )}
    >
      <div className={cn("flex-shrink-0", active ? "text-blue-600" : "text-gray-500")}>
        {icon}
      </div>
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );
}

const SidebarItem = ({ 
    icon, 
    label, 
    value, 
    tooltip,
    isFeature
  }: UsageItemProps) => {
    // Check if this is the AI Credits item
    const isCredits = label === "AI Credits";
    
    return (
      <div className={cn(
        "flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-md transition-colors",
        isCredits && "bg-amber-50/50 dark:bg-amber-900/10"
      )}>
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex-shrink-0",
            isCredits ? "text-amber-500" : "text-muted-foreground"
          )}>
            {icon}
          </div>
          <span className={cn(
            "text-sm font-medium",
            isCredits ? "text-amber-700 dark:text-amber-300" : "text-gray-700 dark:text-gray-300"
          )}>{label}</span>
          {isFeature && (
            <Badge variant="outline">
              Feature
            </Badge>
          )}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={isCredits ? "outline" : "secondary"}>
              {value}
            </Badge>
          </TooltipTrigger>
          {tooltip && (
            <TooltipContent side="right" className="max-w-[200px]">
              <p className="text-xs">{tooltip}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    );
};

const usageStats: UsageItemProps[] = [
  {
    icon: <FileText className="w-4 h-4" />,
    label: "Documents Used",
    value: "75 / 100",
    tooltip: "You have used 75 out of your 100 document allowance this month."
  },
  {
    icon: <MessageSquare className="w-4 h-4" />,
    label: "Assistants Used",
    value: "3 / 5",
    tooltip: "You have used 3 out of your 5 assistant allowance this month.",
    isFeature: true,
  },
  {
    icon: <Coins className="w-4 h-4" />,
    label: "AI Credits",
    value: "150",
    tooltip: "Remaining AI Credits for additional features.",
  },
];

export function Sidebar({ className, collapsed, onToggle, isMobile, visible }: SidebarProps) {
  const pathname = usePathname();
  
  // Navigation items
  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: "Documents",
      href: "/dashboard/invoices",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      label: "Upload",
      href: "/dashboard/upload",
      icon: <Upload className="w-5 h-5" />,
    },
    {
      label: "Analytics",
      href: "/dashboard/analysis",
      icon: <BarChart2 className="w-5 h-5" />,
    },
    {
      label: "Management",
      href: "/dashboard/management",
      icon: <Database className="w-5 h-5" />,
    },
    {
      label: "Reports",
      href: "/dashboard/reports",
      icon: <File className="w-5 h-5" />,
    },
    {
      label: "Assistants",
      href: "/dashboard/assistant",
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      label: "Subscriptions",
      href: "/dashboard/subscription",
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      label: "Team",
      href: "/dashboard/team",
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="w-5 h-5" />,
    },
    {
      label: "Help & Support",
      href: "/dashboard/support",
      icon: <HelpCircle className="w-5 h-5" />,
    },
  ];



  // Only show if visible on mobile
  if (isMobile && !visible) {
    return null;
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 70 : 250 }}
      className={cn(
        "h-full border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col transition-all duration-300 ease-in-out z-30",
        isMobile && "shadow-xl",
        className
      )}
    >
      <div className="flex items-center justify-between h-16 px-3 border-b border-gray-200 dark:border-gray-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-1.5 rounded-md">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">Bilix</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors",
            !collapsed && "ml-auto"
          )}
        >
          <ChevronLeft
            className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")}
          />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1 py-2">
          {navItems.map((item, index) => (
            <NavItem
              key={index}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={item.href === pathname || pathname.startsWith(`${item.href}/`)}
              collapsed={collapsed}
            />
          ))}
        </div>
      </div>

      {/* Usage Statistics Section */}
      <div className={cn(
        "mt-auto mb-4 px-3",
        collapsed ? "hidden" : "block"
      )}>
        <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
          <h4 className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-3 px-2">
            Monthly Usage
          </h4>
          <div className="space-y-1.5">
              {usageStats.map((stat, index) => (
                <SidebarItem
                  key={index}
                  icon={stat.icon}
                  label={stat.label}
                  value={stat.value}
                  tooltip={stat.tooltip}
                  isFeature={stat.isFeature}
                />
              ))}
            </div>
        </div>
      </div>
    </motion.div>
  );
}