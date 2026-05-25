"use client";

import { motion } from "motion/react";
import { CloudUpload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "../../../../lib/supabase";

async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface UploadHeroProps {
  onUploadComplete?: (downloadUrl: string, expectedPatientName: string, expectedDob: string, fileHash: string) => void;
}

export default function UploadHero({ onUploadComplete }: UploadHeroProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (isUploading) return;

    setIsUploading(true);
    setUploadedFileName(null);
    setUploadError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userName = user?.user_metadata?.name || "Unknown Patient";
      const userDob = user?.user_metadata?.dob || "Unknown Patient";

      // Phase 2: Hash file and check for duplicates before expensive upload
      const fileHash = await generateFileHash(file);

      if (user) {
        const { data: existing } = await supabase
          .from("medical_records")
          .select("id")
          .eq("user_id", user.id)
          .eq("file_hash", fileHash)
          .limit(1);

        if (existing && existing.length > 0) {
          throw new Error(
            "Duplicate Detected: You have already uploaded this exact document."
          );
        }
      }

      const fileName = `${crypto.randomUUID()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("records")
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: urlData } = supabase.storage
        .from("records")
        .getPublicUrl(fileName);

      setUploadedFileName(file.name);
      onUploadComplete?.(urlData.publicUrl, userName, userDob, fileHash);
    } catch (err) {
      console.error("Upload failed:", err);
      const msg =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      setUploadError(msg);
      setUploadedFileName(null);
    } finally {
      setIsUploading(false);
    }
  };

  // Determine icon + status text
  const StatusIcon = isUploading
    ? Loader2
    : uploadError
      ? AlertCircle
      : uploadedFileName
        ? CheckCircle2
        : CloudUpload;

  const iconClass = isUploading
    ? "text-blue-600 animate-spin"
    : uploadError
      ? "text-red-500"
      : uploadedFileName
        ? "text-emerald-600"
        : "text-blue-600";

  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
          e.target.value = "";
        }}
      />

      {/* Compact horizontal drop zone */}
      <button
        type="button"
        aria-label="Upload medical record"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFileUpload(file);
        }}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`w-full text-left relative h-32 rounded-2xl border-2 border-dashed flex items-center gap-6 px-8 cursor-pointer transition-all duration-300 overflow-hidden ${
          uploadError
            ? "border-red-300 bg-red-50/50"
            : isDragOver
              ? "border-blue-500 bg-blue-50 scale-[1.02] shadow-lg"
              : "border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/30 shadow-sm hover:shadow-md"
        }`}
      >
        {/* Ambient glow */}
        <div className="absolute right-0 top-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        {/* Icon */}
        <motion.div
          animate={isDragOver ? { y: -3, scale: 1.15 } : { y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="shrink-0 relative z-10"
        >
          <StatusIcon className={`w-9 h-9 ${iconClass}`} strokeWidth={1.5} />
        </motion.div>

        {/* Text */}
        <div className="flex flex-col min-w-0 relative z-10">
          {isUploading ? (
            <>
              <span className="text-base font-semibold text-slate-800 tracking-tight">
                Uploading...
              </span>
              <span className="text-sm font-medium text-slate-500">
                Sending file to secure storage.
              </span>
            </>
          ) : uploadError ? (
            <>
              <span className="text-base font-semibold text-red-600 tracking-tight">
                Upload Failed
              </span>
              <span className="text-sm font-medium text-red-500 truncate">
                {uploadError}
              </span>
              <span className="text-sm font-medium text-slate-500 mt-0.5">
                Click to try again.
              </span>
            </>
          ) : uploadedFileName ? (
            <>
              <span className="text-base font-semibold text-slate-800 tracking-tight truncate">
                {uploadedFileName}
              </span>
              <span className="text-sm font-medium text-emerald-600">
                Uploaded — analyzing document.
              </span>
            </>
          ) : (
            <>
              <span className="text-base font-semibold text-slate-800 tracking-tight">
                Upload New Record
              </span>
              <span className="text-sm font-medium text-slate-500">
                Drag & drop a PDF here, or click to browse.
              </span>
            </>
          )}
        </div>

        {/* Right-side button hint */}
        {!isUploading && !uploadedFileName && !uploadError && (
          <div className="ml-auto shrink-0 relative z-10">
            <span className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all pointer-events-none">
              Browse Files
            </span>
          </div>
        )}
      </button>
    </motion.div>
  );
}
