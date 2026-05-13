"use client";

import { motion } from "motion/react";
import { CloudUpload } from "lucide-react";
import { useState } from "react";

export default function UploadHero() {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="lg:col-span-2 bg-surface rounded-xl border border-document-border p-8 flex flex-col relative overflow-hidden group"
    >
      {/* Ambient glow decoration */}
      <div className="absolute right-0 top-0 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <h1 className="text-headline-xl text-on-surface mb-2 relative z-10">
        Build Your Digital Twin
      </h1>
      <p className="text-body-main text-on-surface-variant max-w-lg mb-8 relative z-10">
        Securely upload MRI discs, analog lab reports, or handwritten
        prescriptions. Our audit engine will instantly verify facts and construct
        a chronological, error-free medical history.
      </p>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          // Future: handle file upload
        }}
        className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer w-full mt-auto relative z-10 ${
          isDragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-outline-variant hover:border-primary bg-surface-container-low/50"
        }`}
      >
        <motion.div
          animate={isDragOver ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <CloudUpload className="w-12 h-12 text-primary mb-4" strokeWidth={1.5} />
        </motion.div>
        <span className="text-headline-md text-on-surface mb-1">
          Upload New Record
        </span>
        <span className="text-body-sm text-on-surface-variant">
          Drag and drop PDFs, images, or ZIP files here, or click to browse.
        </span>
      </div>
    </motion.div>
  );
}
