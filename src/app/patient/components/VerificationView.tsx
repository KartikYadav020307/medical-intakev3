"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  ShieldCheck,
  Check,
  Trash2,
  Loader2,
  Stethoscope,
  Pill,
  FlaskConical,
  AlertTriangle,
  Syringe,
  Activity,
  User,
  Hash,
  Scan,
  ChevronRight,
  FileText,
  PartyPopper,
} from "lucide-react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../../../../lib/supabase";
import type { ExtractionData } from "./ExtractedDataCards";

const PdfViewer = dynamic(() => import("./PdfViewer"), { ssr: false });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BoundingBox = [number, number, number, number];

/** A flattened verification item with provenance metadata */
interface VerificationItem {
  /** Unique key for React list rendering */
  key: string;
  /** JSONB category key (e.g. 'diagnoses', 'medications') */
  category: string;
  /** Human-readable category label */
  categoryLabel: string;
  /** Index within the original category array */
  index: number;
  /** Display name of the fact */
  name: string;
  /** Optional secondary detail */
  detail?: string;
  /** AI confidence level */
  confidence: "High" | "Medium" | "Low";
  /** Bounding box for PDF highlighting */
  boundingBox: BoundingBox;
  /** User who verified, undefined = unverified */
  verified_by?: string;
  /** Parent record ID for the RPC call */
  recordId: string;
  /** PDF URL from the parent record */
  pdfUrl: string | null;
}

type MedicalRecord = {
  id: string;
  created_at: string;
  pdf_url?: string | null;
  extracted_data?: Partial<ExtractionData> | null;
};

interface VerificationViewProps {
  records: MedicalRecord[];
  onRecordsUpdate: (updatedRecords: MedicalRecord[]) => void;
  onToast: (message: string, type: "success" | "error") => void;
}

// ---------------------------------------------------------------------------
// Category metadata (icon + colors)
// ---------------------------------------------------------------------------

const CATEGORY_META: Record<string, {
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  tagClass: string;
}> = {
  diagnoses: {
    icon: Stethoscope,
    colorClass: "text-blue-600",
    bgClass: "bg-blue-50",
    borderClass: "border-blue-200",
    tagClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  medications: {
    icon: Pill,
    colorClass: "text-amber-600",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
    tagClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  labResults: {
    icon: FlaskConical,
    colorClass: "text-emerald-600",
    bgClass: "bg-emerald-50",
    borderClass: "border-emerald-200",
    tagClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  allergies: {
    icon: AlertTriangle,
    colorClass: "text-red-600",
    bgClass: "bg-red-50",
    borderClass: "border-red-200",
    tagClass: "bg-red-50 text-red-700 border-red-200",
  },
  procedures: {
    icon: Syringe,
    colorClass: "text-indigo-600",
    bgClass: "bg-indigo-50",
    borderClass: "border-indigo-200",
    tagClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  vitals: {
    icon: Activity,
    colorClass: "text-sky-600",
    bgClass: "bg-sky-50",
    borderClass: "border-sky-200",
    tagClass: "bg-sky-50 text-sky-700 border-sky-200",
  },
  physicians: {
    icon: User,
    colorClass: "text-violet-600",
    bgClass: "bg-violet-50",
    borderClass: "border-violet-200",
    tagClass: "bg-violet-50 text-violet-700 border-violet-200",
  },
  icdCodes: {
    icon: Hash,
    colorClass: "text-pink-600",
    bgClass: "bg-pink-50",
    borderClass: "border-pink-200",
    tagClass: "bg-pink-50 text-pink-700 border-pink-200",
  },
  imagingFindings: {
    icon: Scan,
    colorClass: "text-cyan-600",
    bgClass: "bg-cyan-50",
    borderClass: "border-cyan-200",
    tagClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  diagnoses: "Diagnosis",
  medications: "Medication",
  labResults: "Lab Result",
  allergies: "Allergy",
  procedures: "Procedure",
  vitals: "Vital",
  physicians: "Physician",
  icdCodes: "ICD Code",
  imagingFindings: "Imaging",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getItemName(category: string, item: Record<string, unknown>): string {
  switch (category) {
    case "diagnoses": return (item.name as string) || "Unknown";
    case "medications": return (item.name as string) || "Unknown";
    case "labResults": return (item.testName as string) || "Unknown";
    case "allergies": return (item.allergen as string) || "Unknown";
    case "procedures": return (item.name as string) || "Unknown";
    case "vitals": return (item.measurement as string) || "Unknown";
    case "physicians": return (item.name as string) || "Unknown";
    case "icdCodes": return (item.code as string) || "Unknown";
    case "imagingFindings": return (item.bodyPart as string) || "Unknown";
    default: return "Unknown";
  }
}

function getItemDetail(category: string, item: Record<string, unknown>): string | undefined {
  switch (category) {
    case "medications": {
      const parts = [item.dosage, item.frequency].filter(Boolean);
      return parts.length > 0 ? parts.join(" · ") : undefined;
    }
    case "labResults": {
      const v = item.value as string;
      const u = item.unit as string;
      return v ? `${v}${u ? ` ${u}` : ""}` : undefined;
    }
    case "allergies": {
      const parts = [item.reaction, item.severity].filter(Boolean);
      return parts.length > 0 ? parts.join(" · ") : undefined;
    }
    case "procedures": {
      const parts = [item.date, item.body_part].filter(Boolean);
      return parts.length > 0 ? parts.join(" · ") : undefined;
    }
    case "vitals": {
      const v = item.value as string;
      const u = item.unit as string;
      return v ? `${v}${u ? ` ${u}` : ""}` : undefined;
    }
    case "physicians": return item.specialty as string | undefined;
    case "icdCodes": return item.description as string | undefined;
    case "imagingFindings": return item.finding as string | undefined;
    default: return undefined;
  }
}

// Categories to flatten (all that have confidence + boundingBox)
const VERIFIABLE_CATEGORIES = [
  "diagnoses", "medications", "labResults", "allergies", "procedures",
  "vitals", "physicians", "icdCodes", "imagingFindings",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VerificationView({
  records,
  onRecordsUpdate,
  onToast,
}: VerificationViewProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<BoundingBox | null>(null);
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // ── Flatten + filter unverified / low-confidence items ──────────────
  const verificationQueue = useMemo(() => {
    const items: VerificationItem[] = [];

    records.forEach((record) => {
      const data = record.extracted_data;
      if (!data) return;

      VERIFIABLE_CATEGORIES.forEach((category) => {
        const arr = data[category as keyof ExtractionData];
        if (!Array.isArray(arr)) return;

        (arr as unknown as Record<string, unknown>[]).forEach((item, index) => {
          const confidence = item.confidence as "High" | "Medium" | "Low" | undefined;
          const verifiedBy = item.verified_by as string | undefined;

          // Show items that are Low confidence OR unverified
          if (confidence === "Low" || !verifiedBy) {
            items.push({
              key: `${record.id}-${category}-${index}`,
              category,
              categoryLabel: CATEGORY_LABELS[category] || category,
              index,
              name: getItemName(category, item),
              detail: getItemDetail(category, item),
              confidence: confidence || "Medium",
              boundingBox: item.boundingBox as BoundingBox,
              verified_by: verifiedBy,
              recordId: record.id,
              pdfUrl: record.pdf_url || null,
            });
          }
        });
      });
    });

    return items;
  }, [records]);

  // ── Click a fact → sync PDF viewer ─────────────────────────────────
  const handleFactClick = useCallback((item: VerificationItem) => {
    setSelectedKey(item.key);
    setActiveHighlight(item.boundingBox);
    setActivePdfUrl(item.pdfUrl);
  }, []);

  // ── Approve: set verified_by via RPC ───────────────────────────────
  const handleApprove = useCallback(async (item: VerificationItem) => {
    setPendingAction(item.key);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.rpc("approve_extracted_item", {
        p_record_id: item.recordId,
        p_category: item.category,
        p_item_index: item.index,
        p_user_id: user.id,
      });

      if (error) throw error;

      // Optimistic local state update
      const updatedRecords = records.map((r) => {
        if (r.id !== item.recordId) return r;
        const data = { ...r.extracted_data } as Record<string, unknown>;
        const arr = [...(data[item.category] as Record<string, unknown>[])];
        arr[item.index] = { ...arr[item.index], verified_by: user.id };
        data[item.category] = arr;
        return { ...r, extracted_data: data as Partial<ExtractionData> };
      });
      onRecordsUpdate(updatedRecords);

      // If this was selected, clear selection
      if (selectedKey === item.key) {
        setSelectedKey(null);
        setActiveHighlight(null);
        setActivePdfUrl(null);
      }

      onToast("Fact verified ✓", "success");
    } catch (err) {
      console.error("Approve failed:", err);
      onToast(err instanceof Error ? err.message : "Approval failed", "error");
    } finally {
      setPendingAction(null);
    }
  }, [records, onRecordsUpdate, onToast, selectedKey]);

  // ── Reject: remove item from JSONB array via RPC ───────────────────
  const handleReject = useCallback(async (item: VerificationItem) => {
    setPendingAction(item.key);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.rpc("reject_extracted_item", {
        p_record_id: item.recordId,
        p_category: item.category,
        p_item_index: item.index,
        p_user_id: user.id,
      });

      if (error) throw error;

      // Optimistic local state update — remove the item from the array
      const updatedRecords = records.map((r) => {
        if (r.id !== item.recordId) return r;
        const data = { ...r.extracted_data } as Record<string, unknown>;
        const arr = [...(data[item.category] as Record<string, unknown>[])];
        arr.splice(item.index, 1);
        data[item.category] = arr;
        return { ...r, extracted_data: data as Partial<ExtractionData> };
      });
      onRecordsUpdate(updatedRecords);

      if (selectedKey === item.key) {
        setSelectedKey(null);
        setActiveHighlight(null);
        setActivePdfUrl(null);
      }

      onToast("Fact rejected and removed", "success");
    } catch (err) {
      console.error("Reject failed:", err);
      onToast(err instanceof Error ? err.message : "Rejection failed", "error");
    } finally {
      setPendingAction(null);
    }
  }, [records, onRecordsUpdate, onToast, selectedKey]);

  // ── Confidence badge helper ────────────────────────────────────────
  const confidenceBadge = (level: "High" | "Medium" | "Low") => {
    const styles = {
      High: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Medium: "bg-amber-50 text-amber-700 border-amber-200",
      Low: "bg-red-50 text-red-700 border-red-200",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[level]}`}>
        {level}
      </span>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-5rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ═══════ Left Panel: Verification Queue ═══════ */}
      <div className="w-[42%] h-full overflow-y-auto border-r border-slate-200/60 bg-slate-50/30 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Verification Queue</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {verificationQueue.length === 0
                ? "All facts verified"
                : `${verificationQueue.length} item${verificationQueue.length === 1 ? "" : "s"} need${verificationQueue.length === 1 ? "s" : ""} review`}
            </p>
          </div>
        </div>

        {/* Empty state */}
        {verificationQueue.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="flex flex-col items-center justify-center py-20 px-6 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center mb-6 shadow-inner">
              <PartyPopper className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">All Clear!</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-xs leading-relaxed">
              Every AI-extracted fact has been verified by a human. Your audit trail is complete.
            </p>
            <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">100% Verified</span>
            </div>
          </motion.div>
        ) : (
          /* Fact list */
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {verificationQueue.map((item, i) => {
                const meta = CATEGORY_META[item.category] || CATEGORY_META.diagnoses;
                const Icon = meta.icon;
                const isSelected = selectedKey === item.key;
                const isLoading = pendingAction === item.key;

                return (
                  <motion.div
                    key={item.key}
                    layout
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30, scale: 0.95, transition: { duration: 0.25 } }}
                    transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.35 }}
                    onClick={() => handleFactClick(item)}
                    className={`relative p-4 rounded-2xl border cursor-pointer transition-all duration-200 group ${
                      isSelected
                        ? `border-violet-400 bg-violet-50/60 shadow-[0_0_0_1px_rgba(139,92,246,0.5)] ring-2 ring-violet-200/50`
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5"
                    } ${isLoading ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Category icon */}
                      <div className={`w-9 h-9 rounded-lg ${meta.bgClass} flex items-center justify-center shrink-0 shadow-inner border ${meta.borderClass}`}>
                        <Icon className={`w-4 h-4 ${meta.colorClass}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${meta.tagClass}`}>
                            {item.categoryLabel}
                          </span>
                          {confidenceBadge(item.confidence)}
                        </div>
                        <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                        {item.detail && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">{item.detail}</p>
                        )}
                      </div>

                      {/* Arrow */}
                      <ChevronRight className={`w-4 h-4 mt-2.5 shrink-0 transition-colors ${isSelected ? "text-violet-500" : "text-slate-300 group-hover:text-slate-400"}`} />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleApprove(item); }}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 hover:border-emerald-300 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReject(item); }}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Reject
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ═══════ Right Panel: PDF Viewer ═══════ */}
      <div className="w-[58%] h-full bg-slate-100/50 flex flex-col relative overflow-hidden">
        {activePdfUrl ? (
          <PdfViewer
            pdfUrl={activePdfUrl}
            activeHighlight={activeHighlight}
            onClearHighlight={() => {
              setActiveHighlight(null);
              setSelectedKey(null);
            }}
          />
        ) : (
          /* Placeholder — no fact selected */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 tracking-tight">Select a fact to verify</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-sm leading-relaxed">
              Click on any item in the verification queue to view its source document with the exact location highlighted.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
