"use client";

import { motion, AnimatePresence } from "motion/react";
import { 
  Search, Bell, Settings, FileDown, Share2, Loader2, 
  Stethoscope, Pill, FlaskConical, AlertTriangle, 
  Syringe, Activity, User, Hash, Scan, type LucideIcon
} from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "../../../../lib/supabase";
import type { MedicalRecord, AppNotification } from "../page";

interface TopBarProps {
  onSettingsClick?: () => void;
  onShareClick?: () => void;
  onExportPdf?: () => Promise<void>;
  isExporting?: boolean;
  records?: MedicalRecord[];
  onSearchResultClick?: (record: MedicalRecord, boundingBox: [number, number, number, number]) => void;
  notifications?: AppNotification[];
  onNotificationClick?: (notification: AppNotification) => void;
  onAvatarClick?: () => void;
}

export default function TopBar({ onSettingsClick, onShareClick, onExportPdf, isExporting, records, onSearchResultClick, notifications = [], onNotificationClick, onAvatarClick }: TopBarProps) {
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("User");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

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

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Deep Filter Logic ────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !records) return [];
    
    const query = searchQuery.toLowerCase();
    const results: {
      id: string;
      record: MedicalRecord;
      type: string;
      title: string;
      subtitle: string;
      boundingBox: [number, number, number, number];
      icon: LucideIcon;
      colorClass: string;
    }[] = [];

    records.forEach((record) => {
      const data = record.extracted_data;
      if (!data) return;

      const docName = record.pdf_url ? record.pdf_url.split('/').pop() : "Document";

      const addResult = (type: string, title: string, subtitle: string, boundingBox: [number, number, number, number], icon: LucideIcon, colorClass: string) => {
        if (!title) return;
        if (title.toLowerCase().includes(query) || subtitle.toLowerCase().includes(query)) {
          results.push({
            id: `${record.id}-${type}-${title}-${Math.random()}`,
            record,
            type,
            title,
            subtitle: subtitle ? `${subtitle} · Found in ${docName}` : `Found in ${docName}`,
            boundingBox,
            icon,
            colorClass,
          });
        }
      };

      data.diagnoses?.forEach((d) => addResult("Diagnosis", d.name, "", d.boundingBox, Stethoscope, "text-blue-600 bg-blue-50"));
      data.medications?.forEach((m) => addResult("Medication", m.name, [m.dosage, m.frequency].filter(Boolean).join(" "), m.boundingBox, Pill, "text-amber-600 bg-amber-50"));
      data.labResults?.forEach((l) => addResult("Lab Result", l.testName, `${l.value} ${l.unit || ''}`, l.boundingBox, FlaskConical, "text-emerald-600 bg-emerald-50"));
      data.allergies?.forEach((a) => addResult("Allergy", a.allergen, [a.reaction, a.severity].filter(Boolean).join(" "), a.boundingBox, AlertTriangle, "text-red-600 bg-red-50"));
      data.procedures?.forEach((p) => addResult("Procedure", p.name, [p.date, p.body_part].filter(Boolean).join(" "), p.boundingBox, Syringe, "text-indigo-600 bg-indigo-50"));
      data.vitals?.forEach((v) => addResult("Vital", v.measurement, `${v.value} ${v.unit || ''}`, v.boundingBox, Activity, "text-sky-600 bg-sky-50"));
      data.physicians?.forEach((ph) => addResult("Physician", ph.name, ph.specialty || "", ph.boundingBox, User, "text-violet-600 bg-violet-50"));
      data.icdCodes?.forEach((icd) => addResult("ICD Code", icd.code, icd.description || "", icd.boundingBox, Hash, "text-pink-600 bg-pink-50"));
      data.imagingFindings?.forEach((img) => addResult("Imaging", img.bodyPart, img.finding, img.boundingBox, Scan, "text-cyan-600 bg-cyan-50"));
      
      // Note: Family History and Social History might not have bounding boxes in some schemas, so we check if they exist.
      // If the schema requires boundingBox, we can add them here if they have it. 
      // For now, based on ExtractedDataCards, they don't seem to have boundingBox rendered, but let's safely skip if undefined.
    });

    return results.slice(0, 8); // Limit to 8 results for clean UI
  }, [searchQuery, records]);

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
        <div className="relative hidden md:block w-72" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
          <input
            className="w-full pl-10 pr-4 py-1.5 bg-surface-container-low border border-transparent rounded-full text-body-sm focus:border-primary/30 focus:ring-1 focus:ring-primary/30 text-on-surface outline-none placeholder:text-on-surface-variant/60 transition-all"
            placeholder="Search clinical facts, meds, labs..."
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
          />

          {/* Search Dropdown */}
          <AnimatePresence>
            {isDropdownOpen && searchQuery.trim() !== "" && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute top-full left-0 mt-2 w-96 bg-white border border-slate-200/60 rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col"
              >
                {searchResults.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto py-2 divide-y divide-slate-100">
                    {searchResults.map((result) => {
                      const Icon = result.icon;
                      return (
                        <div
                          key={result.id}
                          onClick={() => {
                            if (onSearchResultClick && result.boundingBox) {
                              onSearchResultClick(result.record, result.boundingBox);
                            }
                            setIsDropdownOpen(false);
                            setSearchQuery("");
                          }}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors group"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-transparent group-hover:border-current/10 transition-colors ${result.colorClass}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-primary transition-colors">
                              {result.title}
                            </p>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {result.subtitle}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 shrink-0">
                            {result.type}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-900">No results found</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your search term</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-3">
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer active:scale-95 duration-150 relative"
          >
            <Bell className="w-5 h-5" />
            {notifications.some(n => !n.read) && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            )}
          </button>
          
          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200/60 rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col"
              >
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-semibold text-slate-800">Notifications</h3>
                  <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                    {notifications.filter(n => !n.read).length} new
                  </span>
                </div>
                
                {notifications.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => {
                          if (onNotificationClick) {
                            onNotificationClick(notification);
                          }
                          setIsNotificationsOpen(false);
                        }}
                        className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors flex gap-3 ${!notification.read ? 'bg-slate-50/50' : ''}`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {notification.type === 'warning' ? (
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center"><AlertTriangle className="w-4 h-4" /></div>
                          ) : notification.type === 'error' ? (
                            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><AlertTriangle className="w-4 h-4" /></div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><Bell className="w-4 h-4" /></div>
                          )}
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${!notification.read ? 'text-slate-900' : 'text-slate-600'}`}>{notification.title}</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notification.message}</p>
                        </div>
                        {!notification.read && (
                          <div className="ml-auto shrink-0 mt-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <Bell className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                    <p className="text-sm font-medium">No notifications</p>
                    <p className="text-xs mt-1">You&apos;re all caught up!</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button 
          onClick={onSettingsClick}
          className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer active:scale-95 duration-150"
        >
          <Settings className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-document-border mx-2" />

        <button
          onClick={onExportPdf}
          disabled={isExporting}
          className="px-4 py-2 border border-document-border rounded-lg text-primary hover:bg-surface-container-low transition-colors text-body-sm font-semibold cursor-pointer active:scale-95 duration-150 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          {isExporting ? "Generating..." : "Export PDF"}
        </button>
        <button
          onClick={onShareClick}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-all text-body-sm font-semibold cursor-pointer active:scale-95 duration-150 flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share Summary
        </button>

        {/* Profile Avatar */}
        <button 
          onClick={onAvatarClick}
          className="ml-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
          aria-label="Profile Settings"
        >
          {photoURL ? (
            <img
              alt={displayName}
              className="w-9 h-9 rounded-full border border-document-border object-cover"
              src={photoURL}
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-sm font-semibold"
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </button>
      </div>
    </motion.header>
  );
}
