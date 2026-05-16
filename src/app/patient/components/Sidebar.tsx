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
      className={`bg-surface-container-low h-screen fixed left-0 top-0 border-r border-document-border flex flex-col py-4 z-40 transition-[width] duration-300 ease-in-out overflow-x-hidden ${collapsed ? "w-16" : "w-56"
        }`}
    >
      {/* Toggle */}
      <div className="flex items-center px-3 mb-4">
        <button
          onClick={onToggle}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer active:scale-95 shrink-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 flex flex-col gap-2 px-3 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => (
          <a
            key={item.label}
            href="#"
            title={collapsed ? item.label : undefined}
            className={`flex items-center rounded-lg overflow-hidden transition-colors duration-200 cursor-pointer active:scale-95 h-10 w-full px-2.5 ${item.active
                ? "bg-primary-container text-on-primary-container font-semibold"
                : "text-on-surface-variant hover:bg-surface-variant"
              }`}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${collapsed ? "w-0 opacity-0" : "w-[140px] opacity-100"
                }`}
            >
              <span className="text-body-sm pl-3 whitespace-nowrap block">{item.label}</span>
            </div>
          </a>
        ))}
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 pt-4 pb-4 border-t border-document-border px-3">
        <a
          href="#"
          title={collapsed ? "Help Center" : undefined}
          className="flex items-center rounded-lg overflow-hidden transition-colors duration-200 cursor-pointer text-on-surface-variant hover:bg-surface-variant h-10 w-full px-2.5"
        >
          <HelpCircle className="w-5 h-5 shrink-0" />
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${collapsed ? "w-0 opacity-0" : "w-[140px] opacity-100"
              }`}
          >
            <span className="text-body-sm pl-3 whitespace-nowrap block">Help Center</span>
          </div>
        </a>
        <button
          onClick={handleLogout}
          title={collapsed ? "Log Out" : undefined}
          className="flex items-center rounded-lg overflow-hidden transition-colors duration-200 cursor-pointer w-full text-left text-on-surface-variant hover:bg-surface-variant h-10 w-full px-2.5"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${collapsed ? "w-0 opacity-0" : "w-[140px] opacity-100"
              }`}
          >
            <span className="text-body-sm pl-3 whitespace-nowrap block">Log Out</span>
          </div>
        </button>
      </div>
    </motion.nav>
  );
}
