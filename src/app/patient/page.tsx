"use client";

import React, { useEffect, useState, useCallback } from "react";
import { FileText, FolderOpen, TrendingUp, Activity } from "lucide-react";

import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import UploadHero from "./components/UploadHero";
import { supabase } from "../../../lib/supabase";
import type { ExtractionData } from "./components/ExtractedDataCards";
import MedicalTimeline from "./components/MedicalTimeline";
import { Stethoscope, Pill, FlaskConical, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const CitationModal = dynamic(() => import("./components/CitationModal"), {
  ssr: false,
});

type MedicalRecord = {
  id: string;
  created_at: string;
  extracted_data?: Partial<ExtractionData> | null;
};

type MasterTimelineEvent = {
  type: "diagnosis" | "medication" | "lab";
  title: string;
  detail: string;
  date: string;
  rawDate: string;
};

export default function PatientDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [patientHistory, setPatientHistory] = useState<MedicalRecord[]>([]);

  // ── Derived Master Timeline ─────────────────────────────────────────
  const masterTimeline = React.useMemo(() => {
    if (!patientHistory || patientHistory.length === 0) return [];
    
    const events: MasterTimelineEvent[] = [];
    const uniqueEvents = new Map<string, MasterTimelineEvent>();
    const getEventKey = (event: MasterTimelineEvent) =>
      `${event.type}:${event.title.trim().toLowerCase()}`;
    patientHistory.forEach((record) => {
      const date = new Date(record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const data = record.extracted_data;
      
      if (data?.diagnoses) {
        data.diagnoses.forEach((d) => {
          events.push({ type: 'diagnosis', title: d.name, detail: `Confidence: ${d.confidence}`, date, rawDate: record.created_at });
        });
      }
      if (data?.medications) {
        data.medications.forEach((m) => {
          events.push({ type: 'medication', title: m.name, detail: [m.dosage, m.frequency].filter(Boolean).join(' · '), date, rawDate: record.created_at });
        });
      }
      if (data?.labResults) {
        data.labResults.forEach((l) => {
          events.push({ type: 'lab', title: l.testName, detail: `${l.value} ${l.unit || ''}`, date, rawDate: record.created_at });
        });
      }
    });

    events.forEach((event) => {
      const key = getEventKey(event);
      const existing = uniqueEvents.get(key);

      if (!existing || new Date(event.rawDate).getTime() > new Date(existing.rawDate).getTime()) {
        uniqueEvents.set(key, event);
      }
    });
    
    return Array.from(uniqueEvents.values()).sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
  }, [patientHistory]);

  // ── Derived Analytics ───────────────────────────────────────────────
  const analyticsData = React.useMemo(() => {
    const uniqueDiagnoses = new Set<string>();
    const uniqueMedications = new Set<string>();
    const uniqueLabs = new Set<string>();
    const uniqueRecentActivity = new Map<string, MasterTimelineEvent>();

    masterTimeline.forEach((event) => {
      const key = `${event.type}:${event.title.trim().toLowerCase()}`;

      if (event.type === 'diagnosis') {
        uniqueDiagnoses.add(key);
        if (!uniqueRecentActivity.has(key)) {
          uniqueRecentActivity.set(key, event);
        }
      } else if (event.type === 'medication') {
        uniqueMedications.add(key);
        if (!uniqueRecentActivity.has(key)) {
          uniqueRecentActivity.set(key, event);
        }
      } else if (event.type === 'lab') {
        uniqueLabs.add(key);
      }
    });

    const totalDiagnoses = uniqueDiagnoses.size;
    const totalMedications = uniqueMedications.size;
    const totalLabs = uniqueLabs.size;
    
    const recentActivity = Array.from(uniqueRecentActivity.values()).slice(0, 5);

    return { totalDiagnoses, totalMedications, totalLabs, recentActivity };
  }, [masterTimeline]);

  // ── Fetch Patient History ──────────────────────────────────────────
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from("medical_records")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (error) throw error;
          if (data) setPatientHistory(data as MedicalRecord[]);
        }
      } catch (err) {
        console.error("Failed to fetch patient history:", err);
      }
    };

    fetchHistory();
  }, []);

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

      // Safe DB Injection
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('medical_records').insert([{
            user_id: user.id,
            pdf_url: pdfUrl,
            extracted_data: result.data
          }]);
        }
      } catch (dbError) {
        console.error("Failed to save medical record to database:", dbError);
      }
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

  const renderMasterTimeline = () => (
    masterTimeline.length === 0 ? (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/60 shadow-sm">
        <p className="text-slate-500">No events found in your history.</p>
      </div>
    ) : (
      <div className="flex flex-col gap-4 relative before:absolute before:inset-y-2 before:left-[1.35rem] before:w-px before:bg-slate-200">
        {masterTimeline.map((event, idx) => (
          <div key={idx} className="flex gap-6 items-start relative z-10 group">
            {/* Icon Node */}
            <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-[0_0_0_4px_#faf8ff] border-2 border-white ${event.type === 'diagnosis' ? 'bg-blue-100 text-blue-600' : event.type === 'medication' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {event.type === 'diagnosis' && <Stethoscope className="w-5 h-5" />}
              {event.type === 'medication' && <Pill className="w-5 h-5" />}
              {event.type === 'lab' && <FlaskConical className="w-5 h-5" />}
            </div>

            {/* Content Card */}
            <div className="flex-1 bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${
                  event.type === 'diagnosis' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                  event.type === 'medication' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                  'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                  {event.type}
                </span>
                <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                  {event.date}
                </span>
              </div>
              <h4 className="text-base font-semibold text-slate-800 leading-snug">{event.title}</h4>
              {event.detail && (
                <p className="text-sm text-slate-500 mt-1">{event.detail}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  );

  return (
    <div className="bg-slate-50 text-slate-900 font-body antialiased flex min-h-screen">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main workspace — margin tracks sidebar width */}
      <main
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "ml-16" : "ml-56"
        }`}
      >
        <TopBar />

        {/* Single-column dashboard canvas */}
        <div className="p-8 flex flex-col gap-5 max-w-5xl mx-auto w-full">
          {activeTab === "upload" && (
            <>
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

              <hr className="my-8 border-slate-200" />

              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Recent Medical History</h2>
                  <p className="text-slate-500 text-sm mt-1">A unified chronological view of all extracted medical events.</p>
                </div>

                {renderMasterTimeline()}
              </div>
          </>)}

          {activeTab === "records" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Upload History</h2>
                <p className="text-slate-500 text-sm mt-1">Review your previously processed medical documents.</p>
              </div>
              
              {patientHistory.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/60 shadow-sm">
                  <p className="text-slate-500">No records found. Head to the Upload tab to process your first document.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {patientHistory.map((record) => {
                    const data = record.extracted_data;
                    const dCount = data?.diagnoses?.length || 0;
                    const mCount = data?.medications?.length || 0;
                    const lCount = data?.labResults?.length || 0;
                    
                    return (
                      <div key={record.id} className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(6,81,237,0.1)] transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors shadow-inner">
                            <FileText className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                            {new Date(record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-800 truncate">Document Record</h3>
                        <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                          Contains <span className="font-medium text-slate-700">{dCount}</span> diagnoses, <span className="font-medium text-slate-700">{mCount}</span> medications, and <span className="font-medium text-slate-700">{lCount}</span> labs.
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Master Timeline</h2>
                <p className="text-slate-500 text-sm mt-1">A unified chronological view of all extracted medical events.</p>
              </div>

              {renderMasterTimeline()}
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Health Analytics</h2>
                <p className="text-slate-500 text-sm mt-1">Aggregate insights across your entire medical history.</p>
              </div>

              {patientHistory.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/60 shadow-sm flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 text-slate-400">
                    <Activity className="w-8 h-8" />
                  </div>
                  <p className="text-slate-500 font-medium">No data available for analytics.</p>
                  <p className="text-slate-400 text-sm mt-1">Upload a medical document to generate your health insights.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {/* Top Level Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-3xl border border-slate-200/60 p-6 flex items-center gap-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-all duration-300">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 shadow-inner">
                        <Stethoscope className="w-7 h-7 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-4xl font-semibold text-slate-800 tracking-tight leading-none">
                          {analyticsData.totalDiagnoses}
                        </p>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-2">Diagnoses Found</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200/60 p-6 flex items-center gap-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-all duration-300">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 shadow-inner">
                        <Pill className="w-7 h-7 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-4xl font-semibold text-slate-800 tracking-tight leading-none">
                          {analyticsData.totalMedications}
                        </p>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-2">Medications</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200/60 p-6 flex items-center gap-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-all duration-300">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 shadow-inner">
                        <FlaskConical className="w-7 h-7 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-4xl font-semibold text-slate-800 tracking-tight leading-none">
                          {analyticsData.totalLabs}
                        </p>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-2">Lab Results</p>
                      </div>
                    </div>
                  </div>

                  {/* Health Insights Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-4 px-2">
                      <TrendingUp className="w-5 h-5 text-slate-600" />
                      <h3 className="text-lg font-bold text-slate-800">Recent Activity & Trends</h3>
                    </div>
                    
                    <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm">
                      {analyticsData.recentActivity.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">No recent diagnoses or medications found.</div>
                      ) : (
                        <div className="flex flex-col divide-y divide-slate-100">
                          {analyticsData.recentActivity.map((activity, idx) => (
                            <div key={idx} className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner border ${
                                  activity.type === 'diagnosis' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                  {activity.type === 'diagnosis' ? <Stethoscope className="w-5 h-5" /> : <Pill className="w-5 h-5" />}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{activity.title}</p>
                                  <p className="text-xs font-medium text-slate-500 mt-0.5">{activity.detail}</p>
                                </div>
                              </div>
                              <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                {activity.date}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {(!["upload", "records", "timeline", "analytics"].includes(activeTab)) && (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200/60 shadow-sm mt-8 animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                <FolderOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 tracking-tight capitalize">{activeTab} View</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-sm text-center">
                This view is part of the next phase. You currently have <span className="font-semibold text-slate-700">{patientHistory.length}</span> saved records in the database.
              </p>
            </div>
          )}

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
