"use client";

import { motion } from "motion/react";
import { Check, FileText } from "lucide-react";

const events = [
  {
    date: "Oct 12",
    category: "DIAGNOSIS",
    categoryColor: "bg-primary-container text-on-primary-container",
    fact: "Mild L4-L5 disc desiccation noted.",
    source: "Lumbar Spine MRI Summary",
    citation: "Page 1, Line 4",
  },
  {
    date: "Sep 28",
    category: "MEDICATION",
    categoryColor: "bg-secondary-container text-on-secondary-container",
    fact: "Cyclobenzaprine 5mg, take 1 PO qHS PRN muscle spasm.",
    source: "Orthopedic Consult Notes",
    citation: "Prescription Slip",
  },
];

export default function TimelineSection() {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="mt-4"
    >
      {/* Section Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-headline-md text-on-surface">
            Recent Verified Events
          </h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Extracted facts mapped from your uploaded documents.
          </p>
        </div>
        <a
          className="text-body-sm font-semibold text-primary hover:underline cursor-pointer"
          href="#"
        >
          View Full Timeline
        </a>
      </div>

      {/* Timeline */}
      <div className="flex flex-col gap-3 relative before:absolute before:inset-y-0 before:left-[4.5rem] before:w-px before:bg-document-border">
        {events.map((event, i) => (
          <motion.div
            key={event.date + event.category}
            initial={{ x: -15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 + i * 0.15 }}
            className="flex gap-6 items-start relative z-10 group"
          >
            {/* Date */}
            <div className="w-16 pt-1 text-right shrink-0">
              <span className="text-citation-code text-on-surface-variant">
                {event.date}
              </span>
            </div>

            {/* Status Node */}
            <div className="w-4 h-4 rounded-full bg-surface border-2 border-clinical-verified flex items-center justify-center shrink-0 mt-1.5 shadow-[0_0_0_4px_#faf8ff]">
              <Check className="w-2.5 h-2.5 text-clinical-verified" strokeWidth={3} />
            </div>

            {/* Card Content */}
            <div className="flex-1 bg-surface border border-document-border rounded-xl p-4 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-shadow duration-200">
              <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-label-caps ${event.categoryColor}`}
                >
                  {event.category}
                </span>
                <button className="px-2 py-1 bg-citation-highlight/30 border border-citation-border rounded flex items-center gap-1 text-on-surface hover:bg-citation-highlight/50 transition-colors cursor-pointer">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="text-citation-code">{event.citation}</span>
                </button>
              </div>
              <p className="text-body-main text-on-surface font-semibold mb-1">
                {event.fact}
              </p>
              <p className="text-body-sm text-on-surface-variant">
                Extracted from: {event.source}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
