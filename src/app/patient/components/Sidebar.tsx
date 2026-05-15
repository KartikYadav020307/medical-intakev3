"use client";

import { motion } from "motion/react";
import {
  FolderOpen,
  CalendarDays,
  BarChart3,
  ShieldCheck,
  HelpCircle,
  LogOut,
  Cross,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { auth } from "../../../../lib/firebase";
import { useRouter } from "next/navigation";

const navItems = [
  { icon: FolderOpen, label: "Records", active: true },
  { icon: CalendarDays, label: "Timeline", active: false },
  { icon: BarChart3, label: "Analytics", active: false },
  { icon: ShieldCheck, label: "Verification", active: false },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  return (
    <motion.nav
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`bg-surface-container-low h-screen fixed left-0 top-0 border-r border-document-border flex flex-col py-4 gap-4 z-40 transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header + Toggle */}
      <div className={`flex items-center ${collapsed ? "justify-center px-2" : "justify-between px-6"} py-2`}>
        {!collapsed && (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shrink-0">
              <Cross className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-headline-md text-primary leading-none tracking-tight truncate">
                Health Records
              </h2>
              <p className="text-body-sm text-on-surface-variant mt-1 truncate">
                Precision Audit Tool
              </p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-variant transition-colors cursor-pointer active:scale-90 shrink-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <div className={`flex-1 flex flex-col gap-1 mt-4 ${collapsed ? "px-2" : "px-4"}`}>
        {navItems.map((item) => (
          <a
            key={item.label}
            href="#"
            title={collapsed ? item.label : undefined}
            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ease-in-out cursor-pointer active:scale-95 ${
              collapsed ? "justify-center" : ""
            } ${
              item.active
                ? "bg-primary-container text-on-primary-container font-semibold"
                : "text-on-surface-variant hover:bg-surface-variant"
            }`}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-body-sm truncate">{item.label}</span>}
          </a>
        ))}
      </div>

      {/* Footer */}
      <div className={`flex flex-col gap-1 pt-4 border-t border-document-border ${collapsed ? "px-2" : "px-4"}`}>
        <a
          href="#"
          title={collapsed ? "Help Center" : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all duration-200 ease-in-out cursor-pointer ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <HelpCircle className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-body-sm">Help Center</span>}
        </a>
        <button
          onClick={handleLogout}
          title={collapsed ? "Log Out" : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all duration-200 ease-in-out cursor-pointer w-full text-left ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-body-sm">Log Out</span>}
        </button>
      </div>
    </motion.nav>
  );
}
