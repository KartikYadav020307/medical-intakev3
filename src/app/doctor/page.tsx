"use client";

import { useAuth } from '../../../lib/firebase'; // Actually I can just import auth directly for now
import { auth } from '../../../lib/firebase';
import { useRouter } from 'next/navigation';

export default function DoctorDashboard() {
  const router = useRouter();

  return (
    <div className="min-h-screen p-24 bg-slate-50 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-4 font-display">Doctor Dashboard</h1>
      <p className="text-slate-600 mb-8 max-w-lg text-center">
        Welcome! Here you can view incoming patient records, analyze telemetry, and process diagnosis environments.
      </p>
      <button 
        onClick={() => { auth.signOut(); router.push('/'); }}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700"
      >
        Sign Out
      </button>
    </div>
  );
}