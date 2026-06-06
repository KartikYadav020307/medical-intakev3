"use client";

import { motion } from "motion/react";
import { Search, Bell, Settings, FileDown, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

interface TopBarProps {
  onShareClick?: () => void;
}

export default function TopBar({ onShareClick }: TopBarProps) {
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("User");

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted || !user) return;

      const metadata = user.user_metadata as Record<string, unknown>;
      const avatar = metadata.avatar_url ?? metadata.picture;
      const name = metadata.full_name ?? metadata.name;

      setPhotoURL(typeof avatar === "string" ? avatar : null);
      setDisplayName(
        typeof name === "string" && name.trim() ? name : user.email ?? "User"
      );
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);



  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-surface border-b border-document-border w-full h-16 flex justify-between items-center px-8 sticky top-0 z-50"
    >
      {/* Left: Brand / Search */}
      <div className="flex items-center gap-6">
        <span className="text-headline-xl text-primary tracking-tight select-none">
          ClinicalAudit
        </span>
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
          <input
            className="w-full pl-10 pr-4 py-1.5 bg-surface-container-low border-none rounded-full text-body-sm focus:ring-1 focus:ring-primary text-on-surface outline-none placeholder:text-on-surface-variant/60"
            placeholder="Search records, conditions..."
            type="text"
          />
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-3">
        <button className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer active:scale-95 duration-150">
          <Bell className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer active:scale-95 duration-150">
          <Settings className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-document-border mx-2" />

        <button className="px-4 py-2 border border-document-border rounded-lg text-primary hover:bg-surface-container-low transition-colors text-body-sm font-semibold cursor-pointer active:scale-95 duration-150 flex items-center gap-2">
          <FileDown className="w-4 h-4" />
          Export PDF
        </button>
        <button
          onClick={onShareClick}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-all text-body-sm font-semibold cursor-pointer active:scale-95 duration-150 flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share Summary
        </button>

        {/* Profile Avatar */}
        {photoURL ? (
          <img
            alt={displayName}
            className="w-9 h-9 rounded-full border border-document-border object-cover ml-2 transition-all"
            src={photoURL}
          />
        ) : (
          <div
            className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center ml-2 text-sm font-semibold transition-all"
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </motion.header>
  );
}
