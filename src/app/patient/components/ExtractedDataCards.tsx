"use client";

import { motion } from "motion/react";
import { Stethoscope, Pill, FlaskConical, AlertTriangle, Activity, User, Hash, Syringe, Users, Wine, Scan } from "lucide-react";

// ---------------------------------------------------------------------------
// Types (mirroring the API response shape)
// ---------------------------------------------------------------------------

interface DiagnosisItem {
  name: string;
  date?: string;
  confidence: "High" | "Medium" | "Low";
  boundingBox: [number, number, number, number];
  verified_by?: string;
}

interface MedicationItem {
  name: string;
  date?: string;
  dosage: string;
  frequency: string;
  confidence: "High" | "Medium" | "Low";
  boundingBox: [number, number, number, number];
  verified_by?: string;
}

interface LabResultItem {
  testName: string;
  date?: string;
  value: string;
  unit: string;
  isAbnormal?: boolean;
  confidence: "High" | "Medium" | "Low";
  boundingBox: [number, number, number, number];
  verified_by?: string;
}

interface AllergyItem {
  allergen: string;
  reaction?: string;
  severity?: string;
  source_page?: number;
  confidence: "High" | "Medium" | "Low";
  boundingBox: [number, number, number, number];
  verified_by?: string;
}

interface ProcedureItem {
  name: string;
  date?: string;
  body_part?: string;
  source_page?: number;
  confidence: "High" | "Medium" | "Low";
  boundingBox: [number, number, number, number];
  verified_by?: string;
}

interface VitalItem {
  measurement: string;
  value: string;
  unit?: string;
  confidence: "High" | "Medium" | "Low";
  boundingBox: [number, number, number, number];
  verified_by?: string;
}

interface PhysicianItem {
  name: string;
  specialty?: string;
  confidence: "High" | "Medium" | "Low";
  boundingBox: [number, number, number, number];
  verified_by?: string;
}

interface IcdCodeItem {
  code: string;
  description?: string;
  confidence: "High" | "Medium" | "Low";
  boundingBox: [number, number, number, number];
  verified_by?: string;
}

interface FamilyHistoryItem {
  condition: string;
  relative: string;
}

interface SocialHistoryItem {
  category: "Smoking" | "Alcohol";
  status: string;
  details: string;
}

interface ImagingFindingItem {
  bodyPart: string;
  finding: string;
  confidence: "High" | "Medium" | "Low";
  boundingBox: [number, number, number, number];
  verified_by?: string;
}

export interface ExtractionData {
  encounter_date?: string;
  diagnoses: DiagnosisItem[];
  medications: MedicationItem[];
  labResults: LabResultItem[];
  allergies?: AllergyItem[];
  procedures?: ProcedureItem[];
  vitals?: VitalItem[];
  physicians?: PhysicianItem[];
  icdCodes?: IcdCodeItem[];
  familyHistory?: FamilyHistoryItem[];
  socialHistory?: SocialHistoryItem[];
  imagingFindings?: ImagingFindingItem[];
  safetyAlerts?: { conflictFound: boolean; severity: string; description: string; };
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
          {[1, 2, 3, 4, 5].map((i) => (
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
      {/* ── Safety Banner ── */}
      {data.safetyAlerts?.conflictFound && (
        <div className="bg-red-600 text-white p-4 rounded-xl shadow-lg mb-6 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5 text-red-100" />
          <div>
            <h2 className="text-lg font-bold tracking-tight uppercase">Critical Safety Alert</h2>
            <p className="text-red-50 mt-1 font-medium">{data.safetyAlerts.description}</p>
          </div>
        </div>
      )}

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
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 mb-3 last:mb-0 ${isActiveBox(d.boundingBox)
                  ? "border-blue-500 bg-blue-50/50 shadow-[0_0_0_1px_rgba(59,130,246,1)] scale-[1.02]"
                  : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 hover:-translate-y-0.5 hover:shadow-sm"
                }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium text-slate-800 leading-snug">
                  {d.name}
                </span>
                {d.confidence && confidenceBadge(d.confidence)}
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
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 mb-3 last:mb-0 ${isActiveBox(m.boundingBox)
                  ? "border-amber-500 bg-amber-50/50 shadow-[0_0_0_1px_rgba(245,158,11,1)] scale-[1.02]"
                  : "border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 hover:-translate-y-0.5 hover:shadow-sm"
                }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-sm font-medium text-slate-800 block leading-snug">
                    {m.name}
                  </span>
                  {(m.dosage || m.frequency) && (
                    <span className="text-xs font-medium text-slate-500 mt-1.5 block">
                      {[m.dosage, m.frequency].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
                {m.confidence && confidenceBadge(m.confidence)}
              </div>
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
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 mb-3 last:mb-0 ${isActiveBox(l.boundingBox)
                  ? "border-emerald-500 bg-emerald-50/50 shadow-[0_0_0_1px_rgba(16,185,129,1)] scale-[1.02]"
                  : "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 hover:-translate-y-0.5 hover:shadow-sm"
                }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-800 leading-snug">
                  {l.testName}
                </span>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold px-2 py-1 rounded-md border ${l.isAbnormal ? 'text-orange-600 bg-orange-50 border-orange-200' : 'text-emerald-700 bg-emerald-50 border-emerald-100'}`}>
                    {l.value}
                    {l.unit && (
                      <span className={`${l.isAbnormal ? 'text-orange-500/80' : 'text-emerald-600/80'} font-medium ml-1`}>
                        {l.unit}
                      </span>
                    )}
                  </span>
                  {l.confidence && confidenceBadge(l.confidence)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Allergies ── */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-red-200/60 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 shadow-inner">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 tracking-tight">
              Allergies
            </h3>
            <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              {data.allergies?.length || 0}
            </span>
          </div>

          {(!data.allergies || data.allergies.length === 0) && (
            <p className="text-body-sm text-on-surface-variant py-4 text-center">
              No allergies extracted.
            </p>
          )}

          {data.allergies?.map((a, i) => (
            <motion.div
              key={`allergy-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() =>
                onHighlight(isActiveBox(a.boundingBox) ? null : a.boundingBox)
              }
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 mb-3 last:mb-0 ${isActiveBox(a.boundingBox)
                  ? "border-red-500 bg-red-50/50 shadow-[0_0_0_1px_rgba(239,68,68,1)] scale-[1.02]"
                  : "border-slate-200 hover:border-red-300 hover:bg-red-50/30 hover:-translate-y-0.5 hover:shadow-sm"
                }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-sm font-bold text-red-600 leading-snug">
                    {a.allergen}
                  </span>
                  {(a.reaction || a.severity) && (
                    <span className="text-xs font-medium text-slate-500 mt-1.5 block">
                      {[a.reaction, a.severity].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {a.confidence && confidenceBadge(a.confidence)}
                  {a.source_page && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                      Pg {a.source_page}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Procedures ── */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-indigo-200/60 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
              <Syringe className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 tracking-tight">
              Procedures
            </h3>
            <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              {data.procedures?.length || 0}
            </span>
          </div>

          {(!data.procedures || data.procedures.length === 0) && (
            <p className="text-body-sm text-on-surface-variant py-4 text-center">
              No procedures extracted.
            </p>
          )}

          {data.procedures?.map((p, i) => (
            <motion.div
              key={`procedure-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() =>
                onHighlight(isActiveBox(p.boundingBox) ? null : p.boundingBox)
              }
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 mb-3 last:mb-0 ${isActiveBox(p.boundingBox)
                  ? "border-indigo-500 bg-indigo-50/50 shadow-[0_0_0_1px_rgba(99,102,241,1)] scale-[1.02]"
                  : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 hover:-translate-y-0.5 hover:shadow-sm"
                }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-sm font-semibold text-slate-800 leading-snug">
                    {p.name}
                  </span>
                  {(p.date || p.body_part) && (
                    <span className="text-xs font-medium text-slate-500 mt-1.5 block">
                      {[p.date, p.body_part].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {p.confidence && confidenceBadge(p.confidence)}
                  {p.source_page && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                      Pg {p.source_page}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Vitals ── */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-sky-200/60 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 shadow-inner">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 tracking-tight">
              Vitals
            </h3>
            <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              {data.vitals?.length || 0}
            </span>
          </div>

          {(!data.vitals || data.vitals.length === 0) && (
            <p className="text-body-sm text-on-surface-variant py-4 text-center">
              No vitals extracted.
            </p>
          )}

          {data.vitals?.map((v, i) => (
            <motion.div
              key={`vital-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() =>
                onHighlight(isActiveBox(v.boundingBox) ? null : v.boundingBox)
              }
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 mb-3 last:mb-0 ${isActiveBox(v.boundingBox)
                  ? "border-sky-500 bg-sky-50/50 shadow-[0_0_0_1px_rgba(14,165,233,1)] scale-[1.02]"
                  : "border-slate-200 hover:border-sky-300 hover:bg-sky-50/30 hover:-translate-y-0.5 hover:shadow-sm"
                }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-800 leading-snug">
                  {v.measurement}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-sky-700 bg-sky-50 px-2 py-1 rounded-md border border-sky-100">
                    {v.value}
                    {v.unit && (
                      <span className="text-sky-600/80 font-medium ml-1">
                        {v.unit}
                      </span>
                    )}
                  </span>
                  {v.confidence && confidenceBadge(v.confidence)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Physicians ── */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-violet-200/60 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 shadow-inner">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 tracking-tight">
              Physicians
            </h3>
            <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              {data.physicians?.length || 0}
            </span>
          </div>

          {(!data.physicians || data.physicians.length === 0) && (
            <p className="text-body-sm text-on-surface-variant py-4 text-center">
              No physicians extracted.
            </p>
          )}

          {data.physicians?.map((ph, i) => (
            <motion.div
              key={`physician-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() =>
                onHighlight(isActiveBox(ph.boundingBox) ? null : ph.boundingBox)
              }
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 mb-3 last:mb-0 ${isActiveBox(ph.boundingBox)
                  ? "border-violet-500 bg-violet-50/50 shadow-[0_0_0_1px_rgba(139,92,246,1)] scale-[1.02]"
                  : "border-slate-200 hover:border-violet-300 hover:bg-violet-50/30 hover:-translate-y-0.5 hover:shadow-sm"
                }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-sm font-semibold text-slate-800 leading-snug">
                    {ph.name}
                  </span>
                  {ph.specialty && (
                    <span className="text-xs font-medium text-slate-500 mt-1.5 block">
                      {ph.specialty}
                    </span>
                  )}
                </div>
                {ph.confidence && confidenceBadge(ph.confidence)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── ICD Codes ── */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-pink-200/60 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600 shadow-inner">
              <Hash className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 tracking-tight">
              ICD Codes
            </h3>
            <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              {data.icdCodes?.length || 0}
            </span>
          </div>

          {(!data.icdCodes || data.icdCodes.length === 0) && (
            <p className="text-body-sm text-on-surface-variant py-4 text-center">
              No ICD codes extracted.
            </p>
          )}

          {data.icdCodes?.map((icd, i) => (
            <motion.div
              key={`icd-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() =>
                onHighlight(isActiveBox(icd.boundingBox) ? null : icd.boundingBox)
              }
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 mb-3 last:mb-0 ${isActiveBox(icd.boundingBox)
                  ? "border-pink-500 bg-pink-50/50 shadow-[0_0_0_1px_rgba(236,72,153,1)] scale-[1.02]"
                  : "border-slate-200 hover:border-pink-300 hover:bg-pink-50/30 hover:-translate-y-0.5 hover:shadow-sm"
                }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-sm font-bold text-pink-600 leading-snug">
                    {icd.code}
                  </span>
                  {icd.description && (
                    <span className="text-xs font-medium text-slate-500 mt-1.5 block">
                      {icd.description}
                    </span>
                  )}
                </div>
                {icd.confidence && confidenceBadge(icd.confidence)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Family History ── */}
        {data.familyHistory && data.familyHistory.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-rose-200/60 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shadow-inner">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 tracking-tight">
                Family History
              </h3>
              <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                {data.familyHistory.length}
              </span>
            </div>

            {data.familyHistory.map((fh, i) => (
              <motion.div
                key={`family-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-2xl border border-slate-200 bg-white mb-3 last:mb-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-sm font-semibold text-slate-800 leading-snug">
                      {fh.condition}
                    </span>
                    <span className="text-xs font-medium text-slate-500 mt-1.5 block">
                      {fh.relative}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Social History ── */}
        {data.socialHistory && data.socialHistory.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-fuchsia-200/60 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-fuchsia-50 flex items-center justify-center text-fuchsia-600 shadow-inner">
                <Wine className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 tracking-tight">
                Social History
              </h3>
              <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                {data.socialHistory.length}
              </span>
            </div>

            {data.socialHistory.map((sh, i) => (
              <motion.div
                key={`social-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-2xl border border-slate-200 bg-white mb-3 last:mb-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-sm font-semibold text-slate-800 leading-snug">
                      {sh.category}
                    </span>
                    <span className="text-xs font-medium text-slate-500 mt-1.5 block">
                      {[sh.status, sh.details].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Imaging Findings ── */}
        {data.imagingFindings && data.imagingFindings.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-cyan-200/60 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600 shadow-inner">
                <Scan className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 tracking-tight">
                Imaging Findings
              </h3>
              <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                {data.imagingFindings.length}
              </span>
            </div>

            {data.imagingFindings.map((img, i) => (
              <motion.div
                key={`imaging-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() =>
                  onHighlight(isActiveBox(img.boundingBox) ? null : img.boundingBox)
                }
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 mb-3 last:mb-0 ${isActiveBox(img.boundingBox)
                    ? "border-cyan-500 bg-cyan-50/50 shadow-[0_0_0_1px_rgba(6,182,212,1)] scale-[1.02]"
                    : "border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/30 hover:-translate-y-0.5 hover:shadow-sm"
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-sm font-semibold text-slate-800 leading-snug block mb-1">
                      {img.bodyPart}
                    </span>
                    <span className="text-xs font-medium text-slate-500 leading-relaxed block">
                      {img.finding}
                    </span>
                  </div>
                  <div className="flex-shrink-0 ml-3">
                    {img.confidence && confidenceBadge(img.confidence)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
