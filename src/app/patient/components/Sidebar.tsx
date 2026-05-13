"use client";

import { motion } from "motion/react";
import {
  FolderOpen,
  CalendarDays,
  BarChart3,
  ShieldCheck,
  Upload,
  HelpCircle,
  LogOut,
  Cross,
} from "lucide-react";
import { auth } from "../../../../lib/firebase";
import { useRouter } from "next/navigation";

const navItems = [
  { icon: FolderOpen, label: "Records", active: true },
  { icon: CalendarDays, label: "Timeline", active: false },
  { icon: BarChart3, label: "Analytics", active: false },
  { icon: ShieldCheck, label: "Verification", active: false },
];

export default function Sidebar() {
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
      className="bg-surface-container-low h-screen w-64 fixed left-0 top-0 border-r border-document-border flex flex-col py-4 gap-4 z-40"
    >
      {/* Header */}
      <div className="px-6 py-2 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
          <Cross className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-headline-md text-primary leading-none tracking-tight">
            Health Records
          </h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Precision Audit Tool
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="px-4 flex-1 flex flex-col gap-1 mt-4">
        {navItems.map((item) => (
          <a
            key={item.label}
            href="#"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out cursor-pointer active:scale-95 ${
              item.active
                ? "bg-primary-container text-on-primary-container font-semibold"
                : "text-on-surface-variant hover:bg-surface-variant"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-body-sm">{item.label}</span>
          </a>
        ))}
      </div>

      {/* CTA */}
      <div className="px-6 mb-4">
        <button className="w-full py-2.5 px-4 bg-surface border border-primary text-primary hover:bg-surface-variant transition-colors rounded-lg text-body-sm font-semibold flex items-center justify-center gap-2 cursor-pointer active:scale-95">
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 flex flex-col gap-1 pt-4 border-t border-document-border">
        <a
          href="#"
          className="flex items-center gap-3 px-4 py-2.5 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all duration-200 ease-in-out cursor-pointer"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="text-body-sm">Help Center</span>
        </a>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all duration-200 ease-in-out cursor-pointer w-full text-left"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-body-sm">Log Out</span>
        </button>
      </div>
    </motion.nav>
  );
}
