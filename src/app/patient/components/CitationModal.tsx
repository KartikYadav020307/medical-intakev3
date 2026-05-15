"use client";

import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import type { ExtractionData } from "./ExtractedDataCards";
import MedicalTimeline from "./MedicalTimeline";
import dynamic from "next/dynamic";

const PdfViewer = dynamic(() => import("./PdfViewer"), {
  ssr: false,
});

interface CitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  activeHighlight: [number, number, number, number] | null;
  extractionData: ExtractionData | null;
  onItemClick: (boundingBox: [number, number, number, number]) => void;
}

export default function CitationModal({
  isOpen,
  onClose,
  pdfUrl,
  activeHighlight,
  extractionData,
  onItemClick,
}: CitationModalProps) {
  if (!isOpen || !pdfUrl || !extractionData) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-[95vw] h-[95vh] bg-surface rounded-xl overflow-hidden flex flex-row relative shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors z-[60] cursor-pointer"
          >
            <X className="w-6 h-6 text-on-surface" />
          </button>

          {/* Left Column - Details/Timeline */}
          <div className="w-[30%] h-full overflow-y-auto border-r border-document-border bg-surface p-6">
            <h2 className="text-headline-md text-on-surface mb-6">Medical History</h2>
            <MedicalTimeline data={extractionData} onItemClick={onItemClick} />
          </div>

          {/* Right Column - PDF Viewer */}
          <div className="w-[70%] h-full bg-gray-100 flex flex-col relative overflow-hidden">
            <PdfViewer
              pdfUrl={pdfUrl}
              activeHighlight={activeHighlight}
              onClearHighlight={() => onItemClick(null as any)}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
