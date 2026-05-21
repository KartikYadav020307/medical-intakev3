"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  CalendarClock,
  FileText,
  FolderOpen,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";

type ExtractedData = {
  diagnoses?: unknown[];
  medications?: unknown[];
  labResults?: unknown[];
};

type MedicalRecord = {
  id: string;
  user_id: string | null;
  created_at: string;
  pdf_url: string | null;
  extracted_data: ExtractedData | null;
};

type PatientRow = {
  userId: string;
  displayId: string;
  documentCount: number;
  latestUpload: string;
  diagnosesCount: number;
  medicationsCount: number;
  labsCount: number;
  records: MedicalRecord[];
};

const formatDate = (value: string, includeTime = false) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "numeric",
          minute: "2-digit",
        }
      : {}),
  }).format(date);
};

const getArrayCount = (value: unknown) => (Array.isArray(value) ? value.length : 0);

const getShortPatientId = (userId: string) => {
  if (userId === "unassigned") {
    return "Unassigned";
  }

  if (userId.length <= 16) {
    return userId;
  }

  return `${userId.slice(0, 8)}...${userId.slice(-6)}`;
};

function PatientRowCard({ patient }: { patient: PatientRow }) {
  return (
    <article className="group flex flex-col md:grid md:grid-cols-[2fr_100px_2.5fr_150px_130px_120px] md:items-center gap-4 bg-white p-4 md:px-5 md:py-4 transition hover:bg-slate-50 text-left md:border-b md:border-slate-100 last:border-0 rounded-lg md:rounded-none">
      {/* Mobile Header / Desktop Column 1 */}
      <div className="flex items-start md:items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 w-full">
          <div className="hidden md:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">
            {patient.displayId.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm md:text-base font-semibold text-slate-950 truncate">
              Patient {patient.displayId}
            </p>
            <p className="mt-1 font-mono text-xs text-slate-500 truncate max-w-64">
              {patient.userId}
            </p>
          </div>
        </div>
        {/* Mobile only Status */}
        <span className="md:hidden shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          Ready
        </span>
      </div>

      {/* Stats row (Mobile) / Table cells (Desktop) */}
      <div className="grid grid-cols-2 gap-3 md:contents text-sm">
        <div className="rounded-lg bg-slate-50 p-3 md:p-0 md:bg-transparent">
          <p className="md:hidden text-xs font-medium text-slate-500 mb-1">Documents</p>
          <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800">
            {patient.documentCount}
          </span>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 md:hidden">
          <p className="text-xs font-medium text-slate-500">Latest</p>
          <p className="mt-1 font-semibold text-slate-950">{formatDate(patient.latestUpload)}</p>
        </div>
      </div>

      {/* Signals */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-blue-700">Dx {patient.diagnosesCount}</span>
        <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-amber-700">Rx {patient.medicationsCount}</span>
        <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700">Labs {patient.labsCount}</span>
      </div>

      {/* Desktop Latest Date */}
      <div className="hidden md:block text-sm font-medium text-slate-700">
        {formatDate(patient.latestUpload, true)}
      </div>

      {/* Desktop Status Badge */}
      <div className="hidden md:block">
        <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Ready for review</span>
      </div>

      {/* Actions */}
      <div className="mt-2 md:mt-0 w-full md:text-right">
        <button type="button" disabled className="flex md:inline-flex h-10 md:h-9 w-full md:w-auto cursor-not-allowed items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-400">
          View Patient
        </button>
      </div>
    </article>
  );
}

export default function DoctorDashboard() {
  const router = useRouter();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const fetchRecentRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: recordsError } = await supabase
      .from("medical_records")
      .select("id, user_id, created_at, pdf_url, extracted_data")
      .order("created_at", { ascending: false })
      .limit(50);

    if (recordsError) {
      setError(recordsError.message);
      setRecords([]);
      setIsLoading(false);
      return;
    }

    setRecords((data ?? []) as MedicalRecord[]);
    setLastSync(new Date().toISOString());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchRecentRecords();
  }, [fetchRecentRecords]);

  const handleSignOut = () => {
    // 1. Instantly route the user to the landing page for a snappy UX
    router.push("/");
    
    // 2. Handle the database sign-out in the background
    supabase.auth.signOut().then(() => {
      // 3. Purge the cache only after the sign-out is confirmed
      router.refresh(); 
    });
  };

  const patientRows = useMemo<PatientRow[]>(() => {
    const groups = new Map<string, MedicalRecord[]>();

    records.forEach((record) => {
      const userId = record.user_id ?? "unassigned";
      const existing = groups.get(userId) ?? [];
      existing.push(record);
      groups.set(userId, existing);
    });

    return Array.from(groups.entries())
      .map(([userId, patientRecords]) => {
        const sortedRecords = [...patientRecords].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return sortedRecords.reduce<PatientRow>(
          (row, record) => ({
            ...row,
            diagnosesCount:
              row.diagnosesCount +
              getArrayCount(record.extracted_data?.diagnoses),
            medicationsCount:
              row.medicationsCount +
              getArrayCount(record.extracted_data?.medications),
            labsCount:
              row.labsCount + getArrayCount(record.extracted_data?.labResults),
          }),
          {
            userId,
            displayId: getShortPatientId(userId),
            documentCount: sortedRecords.length,
            latestUpload: sortedRecords[0]?.created_at ?? "",
            diagnosesCount: 0,
            medicationsCount: 0,
            labsCount: 0,
            records: sortedRecords,
          }
        );
      })
      .sort(
        (a, b) =>
          new Date(b.latestUpload).getTime() - new Date(a.latestUpload).getTime()
      );
  }, [records]);

  const clinicalSignalTotal = patientRows.reduce(
    (total, patient) =>
      total +
      patient.diagnosesCount +
      patient.medicationsCount +
      patient.labsCount,
    0
  );

  const mostRecentUpload = patientRows[0]?.latestUpload;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 font-body antialiased">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                <ShieldCheck className="h-4 w-4" />
                Clinician Workspace
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                Patient Record Queue
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Recent clinic uploads grouped by patient for review, triage, and
                follow-up.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={fetchRecentRecords}
                disabled={isLoading}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Patients</p>
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {patientRows.length}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Documents</p>
                <FileText className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {records.length}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Signals</p>
                <Activity className="h-5 w-5 text-amber-600" />
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {clinicalSignalTotal}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Last Sync</p>
                <CalendarClock className="h-5 w-5 text-slate-600" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">
                {lastSync ? formatDate(lastSync, true) : "Pending"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Latest upload:{" "}
                {mostRecentUpload ? formatDate(mostRecentUpload) : "None"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-5 py-8 lg:px-8">
        <section className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Active Patients
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Showing up to the 50 most recent medical record uploads.
            </p>
          </div>

          <div className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500 shadow-sm md:w-80">
            <Search className="h-4 w-4 shrink-0" />
            <span className="truncate">Search and filters coming soon</span>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Unable to load records</p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center shadow-sm">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-4 text-sm font-semibold text-slate-900">
              Loading clinic records
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Fetching recent uploads from Supabase.
            </p>
          </div>
        ) : patientRows.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center">
            <FolderOpen className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">No patients assigned</h3>
            <p className="text-slate-500 mt-1 max-w-sm">When patients create accounts and upload documents, they will appear in your clinical queue here.</p>
          </div>
        ) : patientRows.length > 0 ? (
          <div className="flex flex-col gap-4 md:gap-0 md:bg-white md:border md:border-slate-200 md:rounded-lg overflow-hidden md:shadow-sm">
            {/* Desktop Table Header */}
            <div className="hidden md:grid md:grid-cols-[2fr_100px_2.5fr_150px_130px_120px] bg-slate-100 px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">
              <div>Patient</div>
              <div>Documents</div>
              <div>Clinical Signals</div>
              <div>Most Recent Upload</div>
              <div>Status</div>
              <div className="text-right">Action</div>
            </div>

            <div className="flex flex-col gap-4 md:gap-0">
              {patientRows.map((patient) => (
                <PatientRowCard key={patient.userId} patient={patient} />
              ))}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
