"use client";

import { motion } from "motion/react";
import {
  FolderOpen,
  CalendarDays,
  BarChart3,
  ShieldCheck,
  HelpCircle,
  LogOut,
  Menu,
  FileUp,
} from "lucide-react";
import { supabase } from "../../../../lib/supabase";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { icon: FileUp, label: "Upload", id: "upload" },
  { icon: FolderOpen, label: "Records", id: "records" },
  { icon: CalendarDays, label: "Timeline", id: "timeline" },
  { icon: BarChart3, label: "Analytics", id: "analytics" },
  { icon: ShieldCheck, label: "Verification", id: "verification" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeTab: string;
  onTabChange: (id: string) => void;
  onHelpClick?: () => void;
}

export default function Sidebar({ collapsed, onToggle, activeTab, onTabChange, onHelpClick }: SidebarProps) {
  const router = useRouter();

  const handleSignOut = () => {
    // 1. Instantly route the user to the landing page for a snappy UX
    router.push("/");
    
    // 2. Handle the database sign-out in the background
    supabase.auth.signOut().then(() => {
      // 3. Purge the cache only after the sign-out is confirmed
      router.refresh(); 
    });
  };

  return (
    <motion.nav
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`bg-white/80 backdrop-blur-xl h-screen fixed left-0 top-0 border-r border-slate-200/60 flex flex-col z-40 transition-[width] duration-300 ease-in-out overflow-x-hidden shadow-[1px_0_15px_-3px_rgba(0,0,0,0.04)] ${collapsed ? "w-[68px]" : "w-60"
        }`}
    >
      {/* Toggle */}
      <div className={`h-16 flex items-center shrink-0 border-b border-slate-100 ${collapsed ? "justify-center px-0" : "px-4"}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onToggle}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200 cursor-pointer active:scale-95 shrink-0"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="w-[18px] h-[18px]" />
            </button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" sideOffset={8}>
              Expand sidebar
            </TooltipContent>
          )}
        </Tooltip>
      </div>

      {/* Navigation Links */}
      <div className={`flex-1 flex flex-col gap-2 overflow-y-auto overflow-x-hidden pt-1 ${collapsed ? "px-2" : "px-3"}`}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;

          const button = (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex items-center justify-start rounded-xl overflow-hidden transition-all duration-200 cursor-pointer active:scale-[0.97] w-full h-10 shrink-0 pl-4 pr-3 group ${isActive
                  ? "text-blue-700 font-semibold"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
            >
              {/* Active indicator pill */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 bg-blue-50 border border-blue-100/80 rounded-xl shadow-sm"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              {/* Left accent bar */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-accent-bar"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-600 rounded-r-full"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              <item.icon className={`relative z-10 w-[18px] h-[18px] shrink-0 transition-colors duration-200 ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />

              <span className={`relative z-10 text-[13px] leading-none overflow-hidden whitespace-nowrap transition-all duration-300 ${collapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100 ml-3"} ${isActive ? "font-semibold text-blue-700" : "font-medium text-slate-600 group-hover:text-slate-800"}`}>
                {item.label}
              </span>
            </button>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  {button}
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return button;
        })}
      </div>

      {/* Footer */}
      <div className={`shrink-0 ${collapsed ? "px-2" : "px-3"}`}>
        <Separator className="mb-2" />
        <div className="flex flex-col gap-1 pb-4">
          {/* Help */}
          {(() => {
            const helpButton = (
              <button
                onClick={() => onHelpClick?.()}
                className={`flex items-center rounded-xl overflow-hidden transition-all duration-200 cursor-pointer text-slate-400 hover:text-slate-700 hover:bg-slate-50 w-full group active:scale-[0.97] ${collapsed ? "h-10 justify-center" : "h-10 px-3 gap-3"}`}
              >
                <HelpCircle className="w-[18px] h-[18px] shrink-0 group-hover:text-slate-600 transition-colors" />
                {!collapsed && (
                  <span className="text-[13px] font-medium text-slate-500 group-hover:text-slate-700 whitespace-nowrap transition-colors">Help Center</span>
                )}
              </button>
            );

            return collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{helpButton}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>Help Center</TooltipContent>
              </Tooltip>
            ) : helpButton;
          })()}

          {/* Log Out */}
          {(() => {
            const logoutButton = (
              <button
                onClick={handleSignOut}
                className={`flex items-center rounded-xl overflow-hidden transition-all duration-200 cursor-pointer text-slate-400 hover:text-red-600 hover:bg-red-50/60 w-full group active:scale-[0.97] ${collapsed ? "h-10 justify-center" : "h-10 px-3 gap-3"}`}
              >
                <LogOut className="w-[18px] h-[18px] shrink-0 group-hover:text-red-500 transition-colors" />
                {!collapsed && (
                  <span className="text-[13px] font-medium text-slate-500 group-hover:text-red-600 whitespace-nowrap transition-colors">Log Out</span>
                )}
              </button>
            );

            return collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{logoutButton}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>Log Out</TooltipContent>
              </Tooltip>
            ) : logoutButton;
          })()}
        </div>
      </div>
    </motion.nav>
  );
}
