"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Clock, Copy, Check, X, Loader2, Link2 } from "lucide-react";
import { supabase } from "../../../../lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Duration = { label: string; hours: number };

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DURATION_OPTIONS: Duration[] = [
  { label: "24 Hours", hours: 24 },
  { label: "3 Days", hours: 72 },
  { label: "7 Days", hours: 168 },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ShareLinkModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: ShareLinkModalProps) {
  const [selectedDuration, setSelectedDuration] = useState<Duration>(
    DURATION_OPTIONS[0]
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const expiresAt = new Date(
        Date.now() + selectedDuration.hours * 60 * 60 * 1000
      ).toISOString();

      const { data, error } = await supabase
        .from("shared_links")
        .insert([{ user_id: user.id, expires_at: expiresAt }])
        .select("id")
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/shared/${data.id}`;
      setGeneratedUrl(url);

      await navigator.clipboard.writeText(url);
      setCopied(true);
      onSuccess("Secure link copied to clipboard");
    } catch (err) {
      console.error("Failed to generate share link:", err);
      onError(
        err instanceof Error ? err.message : "Failed to generate share link"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAgain = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onError("Failed to copy link");
    }
  };

  const handleClose = () => {
    setGeneratedUrl(null);
    setCopied(false);
    setSelectedDuration(DURATION_OPTIONS[0]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="relative w-full max-w-md mx-4 overflow-hidden rounded-3xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]"
        >
          {/* Glass gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/30 pointer-events-none" />

          {/* Content */}
          <div className="relative p-8">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Share Medical Summary
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Generate a secure, time-limited link
                </p>
              </div>
            </div>

            {!generatedUrl ? (
              <>
                {/* Duration selector */}
                <div className="mb-6">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">
                    <Clock className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
                    How long should this link be active?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {DURATION_OPTIONS.map((option) => (
                      <button
                        key={option.hours}
                        onClick={() => setSelectedDuration(option)}
                        className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer border ${
                          selectedDuration.hours === option.hours
                            ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/25 scale-[1.02]"
                            : "bg-white/60 text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Security notice */}
                <div className="bg-slate-50/80 rounded-xl p-4 mb-6 border border-slate-100">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    <span className="font-semibold text-slate-600">
                      🔒 Secure by design:
                    </span>{" "}
                    The link uses a 128-bit cryptographic ID and automatically
                    expires after{" "}
                    <span className="font-semibold text-slate-700">
                      {selectedDuration.label.toLowerCase()}
                    </span>
                    . Read-only access — no modifications possible.
                  </p>
                </div>

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Secure Link...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      Generate & Copy Link
                    </>
                  )}
                </button>
              </>
            ) : (
              /* Success state */
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Success icon */}
                <div className="flex justify-center mb-5">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                </div>

                <p className="text-center text-sm font-semibold text-emerald-700 mb-4">
                  Link generated & copied to clipboard!
                </p>

                {/* URL display */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2 mb-4">
                  <code className="text-xs text-slate-600 truncate flex-1 font-mono">
                    {generatedUrl}
                  </code>
                  <button
                    onClick={handleCopyAgain}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Copy again"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-400 text-center mb-5">
                  Expires in{" "}
                  <span className="font-semibold text-slate-600">
                    {selectedDuration.label.toLowerCase()}
                  </span>
                </p>

                <button
                  onClick={handleClose}
                  className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200"
                >
                  Done
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
