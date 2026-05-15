"use client";

import { motion } from "motion/react";
import { Stethoscope, Pill, FlaskConical, Loader2 } from "lucide-react";

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
      High: "bg-clinical-verified/15 text-clinical-verified border-clinical-verified/30",
      Medium:
        "bg-citation-highlight/40 text-on-surface border-citation-border/50",
      Low: "bg-error-container/40 text-error border-error/20",
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
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ── Diagnoses ── */}
        <div className="bg-surface rounded-xl border border-document-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Stethoscope className="w-4 h-4 text-primary" />
            <h3 className="text-body-sm font-semibold text-on-surface">
              Diagnoses
            </h3>
            <span className="ml-auto text-citation-code text-on-surface-variant">
              {data.diagnoses.length} found
            </span>
          </div>

          {isProcessing && (
            <div className="flex items-center gap-2 py-6 justify-center text-on-surface-variant">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-body-sm">Extracting...</span>
            </div>
          )}

          {!isProcessing && data.diagnoses.length === 0 && (
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
              className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 mb-2 last:mb-0 ${
                isActiveBox(d.boundingBox)
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-document-border hover:border-primary/40 hover:bg-surface-container-low"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-body-sm font-medium text-on-surface">
                  {d.name}
                </span>
                {confidenceBadge(d.confidence)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Medications ── */}
        <div className="bg-surface rounded-xl border border-document-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Pill className="w-4 h-4 text-secondary" />
            <h3 className="text-body-sm font-semibold text-on-surface">
              Medications
            </h3>
            <span className="ml-auto text-citation-code text-on-surface-variant">
              {data.medications.length} found
            </span>
          </div>

          {isProcessing && (
            <div className="flex items-center gap-2 py-6 justify-center text-on-surface-variant">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-body-sm">Extracting...</span>
            </div>
          )}

          {!isProcessing && data.medications.length === 0 && (
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
              className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 mb-2 last:mb-0 ${
                isActiveBox(m.boundingBox)
                  ? "border-secondary bg-secondary/5 shadow-sm"
                  : "border-document-border hover:border-secondary/40 hover:bg-surface-container-low"
              }`}
            >
              <span className="text-body-sm font-medium text-on-surface block">
                {m.name}
              </span>
              {(m.dosage || m.frequency) && (
                <span className="text-citation-code text-on-surface-variant mt-1 block">
                  {[m.dosage, m.frequency].filter(Boolean).join(" · ")}
                </span>
              )}
            </motion.div>
          ))}
        </div>

        {/* ── Lab Results ── */}
        <div className="bg-surface rounded-xl border border-document-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical className="w-4 h-4 text-tertiary" />
            <h3 className="text-body-sm font-semibold text-on-surface">
              Lab Results
            </h3>
            <span className="ml-auto text-citation-code text-on-surface-variant">
              {data.labResults.length} found
            </span>
          </div>

          {isProcessing && (
            <div className="flex items-center gap-2 py-6 justify-center text-on-surface-variant">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-body-sm">Extracting...</span>
            </div>
          )}

          {!isProcessing && data.labResults.length === 0 && (
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
              className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 mb-2 last:mb-0 ${
                isActiveBox(l.boundingBox)
                  ? "border-tertiary bg-tertiary/5 shadow-sm"
                  : "border-document-border hover:border-tertiary/40 hover:bg-surface-container-low"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-body-sm font-medium text-on-surface">
                  {l.testName}
                </span>
                <span className="text-body-sm font-semibold text-on-surface">
                  {l.value}
                  {l.unit && (
                    <span className="text-on-surface-variant font-normal ml-1">
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
