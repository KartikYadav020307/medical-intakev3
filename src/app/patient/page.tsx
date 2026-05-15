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
      <div className="min-h-screen bg-unstructured-gray flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-body-sm text-on-surface-variant">
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
    <div className="bg-unstructured-gray text-on-background font-body antialiased flex min-h-screen">
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
            <div className="p-4 bg-error-container/30 border border-error/20 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                <span className="text-error text-lg">!</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-semibold text-error">
                  Extraction Failed
                </p>
                <p className="text-body-sm text-error/80 truncate">
                  {extractionError}
                </p>
              </div>
              {loadedPdfUrl && (
                <button
                  onClick={() => processDocument(loadedPdfUrl)}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-error text-on-error rounded-lg text-body-sm font-semibold hover:opacity-90 transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {/* High-Level Summary */}
          {(extractionData || isProcessing) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Diagnoses Summary */}
              <div className="bg-surface rounded-xl border border-document-border p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  {isProcessing ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" /> : <Stethoscope className="w-5 h-5 text-blue-500" />}
                </div>
                <div>
                  <p className="text-headline-md text-on-surface leading-none">
                    {isProcessing ? "-" : extractionData?.diagnoses.length || 0}
                  </p>
                  <p className="text-body-sm text-on-surface-variant">Diagnoses Found</p>
                </div>
              </div>

              {/* Medications Summary */}
              <div className="bg-surface rounded-xl border border-document-border p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  {isProcessing ? <Loader2 className="w-5 h-5 text-amber-500 animate-spin" /> : <Pill className="w-5 h-5 text-amber-500" />}
                </div>
                <div>
                  <p className="text-headline-md text-on-surface leading-none">
                    {isProcessing ? "-" : extractionData?.medications.length || 0}
                  </p>
                  <p className="text-body-sm text-on-surface-variant">Medications</p>
                </div>
              </div>

              {/* Lab Results Summary */}
              <div className="bg-surface rounded-xl border border-document-border p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  {isProcessing ? <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" /> : <FlaskConical className="w-5 h-5 text-emerald-500" />}
                </div>
                <div>
                  <p className="text-headline-md text-on-surface leading-none">
                    {isProcessing ? "-" : extractionData?.labResults.length || 0}
                  </p>
                  <p className="text-body-sm text-on-surface-variant">Lab Results</p>
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