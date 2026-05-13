"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import UploadHero from "./components/UploadHero";
import ProcessingTracker from "./components/ProcessingTracker";
import TimelineSection from "./components/TimelineSection";

export default function PatientDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/");
      } else {
        setAuthenticated(true);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-unstructured-gray flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-body-sm text-on-surface-variant">
            Loading your health records...
          </p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="bg-unstructured-gray text-on-background font-body antialiased flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Workspace */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <TopBar />

        {/* Dashboard Canvas */}
        <div className="p-8 flex flex-col gap-4 max-w-7xl mx-auto w-full">
          {/* Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <UploadHero />
            <ProcessingTracker />
          </div>

          {/* Timeline */}
          <TimelineSection />
        </div>
      </main>
    </div>
  );
}