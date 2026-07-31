"use client";

import { motion } from "motion/react";
import { Plus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { Button } from "@/components/ui/button";

async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface UploadHeroProps {
  onUploadComplete?: (
    downloadUrl: string,
    expectedPatientName: string,
    expectedDob: string,
    fileHash: string,
    expectedSex: string,
    expectedBloodType: string,
    expectedLanguage: string,
    gatekeeperPrefs?: Record<string, unknown>
  ) => void;
}

export default function UploadHero({ onUploadComplete }: UploadHeroProps) {
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
      const userSex = user?.user_metadata?.sex || "Unknown";
      const userBloodType = user?.user_metadata?.blood_type || "Unknown";
      const userLanguage = user?.user_metadata?.language || "English";
      const gatekeeperPrefs = user?.user_metadata?.gatekeeper_prefs || null;

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
      onUploadComplete?.(urlData.publicUrl, userName, userDob, fileHash, userSex, userBloodType, userLanguage, gatekeeperPrefs);
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

  const StatusIcon = isUploading
    ? Loader2
    : uploadError
      ? AlertCircle
      : uploadedFileName
        ? CheckCircle2
        : null;

  const statusText = isUploading
    ? "Sending file to secure storage."
    : uploadError
      ? uploadError
      : uploadedFileName
        ? `${uploadedFileName} uploaded. Analyzing document.`
        : null;

  const statusClass = uploadError
    ? "text-red-600"
    : uploadedFileName
      ? "text-emerald-600"
      : "text-slate-500";

  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3"
    >
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

      <Button
        type="button"
        size="icon-lg"
        aria-label="Upload medical record"
        onClick={() => !isUploading && fileInputRef.current?.click()}
        disabled={isUploading}
        className="h-14 w-14 rounded-full bg-primary text-white shadow-2xl shadow-blue-700/30 transition-transform hover:scale-105 hover:bg-primary active:scale-95 disabled:opacity-80"
      >
        {isUploading ? (
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        ) : (
          <Plus className="w-6 h-6 text-white" />
        )}
      </Button>

      {statusText && (
        <div className={`flex max-w-xs items-center gap-1.5 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-right text-xs font-medium shadow-lg backdrop-blur ${statusClass}`}>
          {StatusIcon && (
            <StatusIcon
              className={`w-3.5 h-3.5 shrink-0 ${isUploading ? "animate-spin" : ""}`}
            />
          )}
          <span className="truncate">{statusText}</span>
        </div>
      )}
    </motion.div>
  );
}
