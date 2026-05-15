"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import UploadHero from "./components/UploadHero";
import TimelineSection from "./components/TimelineSection";
import type { ExtractionData } from "./components/ExtractedDataCards";
import MedicalTimeline from "./components/MedicalTimeline";
import { Stethoscope, Pill, FlaskConical, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const CitationModal = dynamic(() => import("./components/CitationModal"), {
  ssr: false,
});

export default function PatientDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── Extraction state ───────────────────────────────────────────────
  const [loadedPdfUrl, setLoadedPdfUrl] = useState<string | null>(null);
  const [extractionData, setExtractionData] = useState<ExtractionData | null>(
    null,
  );
  const [activeHighlight, setActiveHighlight] = useState<
    [number, number, number, number] | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // ── Auth guard ─────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/");
      } else {
        setAuthenticated(true);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // ── Core extraction function ───────────────────────────────────────
  const processDocument = useCallback(async (pdfUrl: string) => {
    setIsProcessing(true);
    setExtractionData(null);
    setActiveHighlight(null);
    setExtractionError(null);

    try {
      const response = await fetch("/api/extract/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfUrl }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Extraction failed.");
      }

      setExtractionData(result.data);
    } catch (err) {
      console.error("Document extraction failed:", err);
      setExtractionError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // ── Upload complete handler — triggers extraction automatically ────
  const handleUploadComplete = useCallback(
    (downloadUrl: string) => {
      setLoadedPdfUrl(downloadUrl);
      processDocument(downloadUrl);
    },
    [processDocument],
  );

  // ── Loading / auth guards ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin shadow-sm" />
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">
            Loading your health records...
          </p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="bg-slate-50 text-slate-900 font-body antialiased flex min-h-screen">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Main workspace — margin tracks sidebar width */}
      <main
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        <TopBar />

        {/* Single-column dashboard canvas */}
        <div className="p-8 flex flex-col gap-5 max-w-5xl mx-auto w-full">
          {/* Compact upload zone */}
          <UploadHero onUploadComplete={handleUploadComplete} />

          {/* Extraction error banner */}
          {extractionError && (
            <div className="p-5 bg-red-50 border border-red-100 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 shadow-inner">
                <span className="text-red-600 text-xl font-bold">!</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-red-800 tracking-tight">
                  Extraction Failed
                </p>
                <p className="text-sm text-red-600/90 truncate mt-0.5">
                  {extractionError}
                </p>
              </div>
              {loadedPdfUrl && (
                <button
                  onClick={() => processDocument(loadedPdfUrl)}
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium shadow-[0_2px_10px_-3px_rgba(220,38,38,0.4)] hover:shadow-[0_4px_15px_-3px_rgba(220,38,38,0.5)] hover:-translate-y-0.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {/* High-Level Summary */}
          {(extractionData || isProcessing) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Diagnoses Summary */}
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 flex items-center gap-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(6,81,237,0.1)] transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 shadow-inner">
                  {isProcessing ? <Loader2 className="w-7 h-7 text-blue-600 animate-spin" /> : <Stethoscope className="w-7 h-7 text-blue-600" />}
                </div>
                <div>
                  <p className="text-4xl font-semibold text-slate-800 tracking-tight leading-none">
                    {isProcessing ? "-" : extractionData?.diagnoses.length || 0}
                  </p>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-2">Diagnoses Found</p>
                </div>
              </div>

              {/* Medications Summary */}
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 flex items-center gap-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(6,81,237,0.1)] transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 shadow-inner">
                  {isProcessing ? <Loader2 className="w-7 h-7 text-amber-600 animate-spin" /> : <Pill className="w-7 h-7 text-amber-600" />}
                </div>
                <div>
                  <p className="text-4xl font-semibold text-slate-800 tracking-tight leading-none">
                    {isProcessing ? "-" : extractionData?.medications.length || 0}
                  </p>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-2">Medications</p>
                </div>
              </div>

              {/* Lab Results Summary */}
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 flex items-center gap-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(6,81,237,0.1)] transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 shadow-inner">
                  {isProcessing ? <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" /> : <FlaskConical className="w-7 h-7 text-emerald-600" />}
                </div>
                <div>
                  <p className="text-4xl font-semibold text-slate-800 tracking-tight leading-none">
                    {isProcessing ? "-" : extractionData?.labResults.length || 0}
                  </p>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-2">Lab Results</p>
                </div>
              </div>
            </div>
          )}

          {/* Medical Timeline */}
          {extractionData && !isProcessing && (
            <MedicalTimeline
              data={extractionData}
              onItemClick={(box) => {
                setActiveHighlight(box);
                setIsModalOpen(true);
              }}
            />
          )}

          {/* Timeline */}
          <TimelineSection />
        </div>
      </main>

      {/* Citation Modal */}
      <CitationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pdfUrl={loadedPdfUrl}
        activeHighlight={activeHighlight}
        extractionData={extractionData}
        onItemClick={(box) => setActiveHighlight(box)}
      />
    </div>
  );
}