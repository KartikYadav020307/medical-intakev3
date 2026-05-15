"use client";

import { motion } from "motion/react";
import { CloudUpload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "../../../../lib/supabase";

interface UploadHeroProps {
  onUploadComplete?: (downloadUrl: string) => void;
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
      const fileName = `${Date.now()}_${file.name}`;

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
      onUploadComplete?.(urlData.publicUrl);
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
    ? "text-primary animate-spin"
    : uploadError
      ? "text-error"
      : uploadedFileName
        ? "text-clinical-verified"
        : "text-primary";

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
      <div
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
        className={`relative h-28 rounded-xl border-2 border-dashed flex items-center gap-5 px-6 cursor-pointer transition-all duration-300 overflow-hidden ${
          uploadError
            ? "border-error bg-error-container/10"
            : isDragOver
              ? "border-primary bg-primary/5 scale-[1.005]"
              : "border-outline-variant hover:border-primary bg-surface"
        }`}
      >
        {/* Ambient glow */}
        <div className="absolute right-0 top-0 w-48 h-48 bg-primary-container/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

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
              <span className="text-body-sm font-semibold text-on-surface">
                Uploading...
              </span>
              <span className="text-citation-code text-on-surface-variant">
                Sending file to secure storage.
              </span>
            </>
          ) : uploadError ? (
            <>
              <span className="text-body-sm font-semibold text-error">
                Upload Failed
              </span>
              <span className="text-citation-code text-error/80 truncate">
                {uploadError}
              </span>
              <span className="text-citation-code text-on-surface-variant mt-0.5">
                Click to try again.
              </span>
            </>
          ) : uploadedFileName ? (
            <>
              <span className="text-body-sm font-semibold text-on-surface truncate">
                {uploadedFileName}
              </span>
              <span className="text-citation-code text-clinical-verified">
                Uploaded — analyzing document.
              </span>
            </>
          ) : (
            <>
              <span className="text-body-sm font-semibold text-on-surface">
                Upload New Record
              </span>
              <span className="text-citation-code text-on-surface-variant">
                Drag & drop a PDF here, or click to browse.
              </span>
            </>
          )}
        </div>

        {/* Right-side button hint */}
        {!isUploading && !uploadedFileName && !uploadError && (
          <div className="ml-auto shrink-0 relative z-10">
            <span className="px-4 py-2 rounded-lg bg-primary text-on-primary text-body-sm font-semibold pointer-events-none">
              Browse Files
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
