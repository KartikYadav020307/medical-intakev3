"use client";

import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { motion } from "motion/react";
import { Loader2, AlertCircle, X, FileText } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PdfViewerProps {
  pdfUrl: string;
  activeHighlight: [number, number, number, number] | null;
  onClearHighlight: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PdfViewer({
  pdfUrl,
  activeHighlight,
  onClearHighlight,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        // Adjust for padding (px-8 = 32px on both sides = 64px) or just take raw width
        // and cap it slightly so it looks good embedded
        setContainerWidth(
          Math.min(800, entries[0].contentRect.width)
        );
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full flex flex-col relative"
    >
      {/* Header */}
      <div className="absolute top-0 inset-x-0 h-14 bg-surface/80 backdrop-blur-md border-b border-document-border flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-secondary" />
          <h2 className="text-body-lg font-semibold text-on-surface">Document View</h2>
        </div>
        <div className="flex items-center gap-4">
          {numPages > 0 && (
            <span className="text-citation-code text-on-surface-variant">
              Page 1 of {numPages}
            </span>
          )}
          {activeHighlight && (
            <button
              onClick={onClearHighlight}
              className="flex items-center gap-1 px-3 py-1.5 bg-surface border border-document-border text-body-sm font-medium text-on-surface hover:bg-surface-variant rounded-lg transition-all cursor-pointer shadow-sm"
            >
              <X className="w-4 h-4" />
              Clear Selection
            </button>
          )}
        </div>
      </div>

      {/* PDF Container */}
      <div 
        ref={containerRef}
        className="flex-1 w-full h-full overflow-auto flex justify-center bg-gray-100 pt-20 pb-12 px-8"
      >
        <Document
          file={`/api/proxy-pdf?url=${encodeURIComponent(
            encodeURI(
              (() => {
                let decoded = pdfUrl;
                try {
                  while (decoded !== decodeURIComponent(decoded)) {
                    decoded = decodeURIComponent(decoded);
                  }
                } catch {
                  // ignore
                }
                return decoded;
              })()
            )
          )}`}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          loading={
            <div className="flex items-center gap-2 mt-20 text-on-surface-variant">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-body-sm">Loading PDF...</span>
            </div>
          }
          error={
            <div className="flex flex-col items-center gap-2 mt-20 text-error">
              <AlertCircle className="w-6 h-6" />
              <span className="text-body-sm">
                Failed to load PDF. Check the URL.
              </span>
            </div>
          }
        >
          {/* Wrapper with relative positioning for overlay alignment */}
          <div className="relative inline-block shadow-2xl bg-white border border-document-border">
            <Page
              pageNumber={1}
              width={containerWidth} // Dynamic responsive width
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />

            {/* ── Bounding Box Highlight Overlay ── */}
            {activeHighlight && (
              <div
                className="absolute bg-yellow-300 opacity-50 mix-blend-multiply border border-yellow-500 rounded z-50 pointer-events-none transition-all duration-300"
                style={{
                  top: `${(activeHighlight[0] / 1000) * 100}%`,
                  left: `${(activeHighlight[1] / 1000) * 100}%`,
                  width: `${((activeHighlight[3] - activeHighlight[1]) / 1000) * 100}%`,
                  height: `${((activeHighlight[2] - activeHighlight[0]) / 1000) * 100}%`,
                }}
              />
            )}
          </div>
        </Document>
      </div>
    </motion.div>
  );
}
