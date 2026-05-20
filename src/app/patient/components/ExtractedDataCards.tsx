"use client";

import { motion } from "motion/react";
import { Stethoscope, Pill, FlaskConical } from "lucide-react";

// ---------------------------------------------------------------------------
// Types (mirroring the API response shape)
// ---------------------------------------------------------------------------

interface DiagnosisItem {
  name: string;
  confidence: "High" | "Medium" | "Low";
  boundingBox: [number, number, number, number];
}

interface MedicationItem {
  name: string;
  dosage: string;
  frequency: string;
  boundingBox: [number, number, number, number];
}

interface LabResultItem {
  testName: string;
  value: string;
  unit: string;
  boundingBox: [number, number, number, number];
}

export interface ExtractionData {
  diagnoses: DiagnosisItem[];
  medications: MedicationItem[];
  labResults: LabResultItem[];
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ExtractedDataCardsProps {
  data: ExtractionData;
  isProcessing: boolean;
  activeHighlight: [number, number, number, number] | null;
  onHighlight: (box: [number, number, number, number] | null) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ExtractedDataCards({
  data,
  isProcessing,
  activeHighlight,
  onHighlight,
}: ExtractedDataCardsProps) {
  // ── Helpers ────────────────────────────────────────────────────────
  const isActiveBox = (box: [number, number, number, number]) =>
    activeHighlight &&
    box[0] === activeHighlight[0] &&
    box[1] === activeHighlight[1] &&
    box[2] === activeHighlight[2] &&
    box[3] === activeHighlight[3];

  const confidenceBadge = (level: "High" | "Medium" | "Low") => {
    const styles = {
      High: "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm",
      Medium: "bg-amber-50 text-amber-700 border-amber-200 shadow-sm",
      Low: "bg-red-50 text-red-700 border-red-200 shadow-sm",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[level]}`}
      >
        {level}
      </span>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────
  if (isProcessing) {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
                <div className="w-24 h-5 rounded-md bg-slate-200 animate-pulse" />
              </div>
              <div className="space-y-3 mt-2">
                <div className="w-full h-4 rounded bg-slate-100 animate-pulse" />
                <div className="w-5/6 h-4 rounded bg-slate-100 animate-pulse" />
                <div className="w-4/6 h-4 rounded bg-slate-100 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── Diagnoses ── */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
              <Stethoscope className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 tracking-tight">
              Diagnoses
            </h3>
            <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              {data.diagnoses.length}
            </span>
          </div>

          {data.diagnoses.length === 0 && (
            <p className="text-body-sm text-on-surface-variant py-4 text-center">
              No diagnoses found.
            </p>
          )}

          {data.diagnoses.map((d, i) => (
            <motion.div
              key={`diag-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() =>
                onHighlight(isActiveBox(d.boundingBox) ? null : d.boundingBox)
              }
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 mb-3 last:mb-0 ${
                isActiveBox(d.boundingBox)
                  ? "border-blue-500 bg-blue-50/50 shadow-[0_0_0_1px_rgba(59,130,246,1)] scale-[1.02]"
                  : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 hover:-translate-y-0.5 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium text-slate-800 leading-snug">
                  {d.name}
                </span>
                {confidenceBadge(d.confidence)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Medications ── */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shadow-inner">
              <Pill className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 tracking-tight">
              Medications
            </h3>
            <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              {data.medications.length}
            </span>
          </div>

          {data.medications.length === 0 && (
            <p className="text-body-sm text-on-surface-variant py-4 text-center">
              No medications found.
            </p>
          )}

          {data.medications.map((m, i) => (
            <motion.div
              key={`med-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() =>
                onHighlight(isActiveBox(m.boundingBox) ? null : m.boundingBox)
              }
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 mb-3 last:mb-0 ${
                isActiveBox(m.boundingBox)
                  ? "border-amber-500 bg-amber-50/50 shadow-[0_0_0_1px_rgba(245,158,11,1)] scale-[1.02]"
                  : "border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 hover:-translate-y-0.5 hover:shadow-sm"
              }`}
            >
              <span className="text-sm font-medium text-slate-800 block leading-snug">
                {m.name}
              </span>
              {(m.dosage || m.frequency) && (
                <span className="text-xs font-medium text-slate-500 mt-1.5 block">
                  {[m.dosage, m.frequency].filter(Boolean).join(" · ")}
                </span>
              )}
            </motion.div>
          ))}
        </div>

        {/* ── Lab Results ── */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
              <FlaskConical className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 tracking-tight">
              Lab Results
            </h3>
            <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              {data.labResults.length}
            </span>
          </div>

          {data.labResults.length === 0 && (
            <p className="text-body-sm text-on-surface-variant py-4 text-center">
              No lab results found.
            </p>
          )}

          {data.labResults.map((l, i) => (
            <motion.div
              key={`lab-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() =>
                onHighlight(isActiveBox(l.boundingBox) ? null : l.boundingBox)
              }
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 mb-3 last:mb-0 ${
                isActiveBox(l.boundingBox)
                  ? "border-emerald-500 bg-emerald-50/50 shadow-[0_0_0_1px_rgba(16,185,129,1)] scale-[1.02]"
                  : "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 hover:-translate-y-0.5 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-800 leading-snug">
                  {l.testName}
                </span>
                <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                  {l.value}
                  {l.unit && (
                    <span className="text-emerald-600/80 font-medium ml-1">
                      {l.unit}
                    </span>
                  )}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
