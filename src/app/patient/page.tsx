"use client";

import { auth } from '../../../lib/firebase';
import { useRouter } from 'next/navigation';

export default function PatientDashboard() {
  const router = useRouter();

  return (
    <div className="min-h-screen p-24 bg-slate-50 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-4 font-display">Patient Dashboard</h1>
      <p className="text-slate-600 mb-8 max-w-lg text-center">
        Welcome! Please complete your medical intake forms and view diagnostics assignments here.
      </p>
      <button 
        onClick={() => { auth.signOut(); router.push('/'); }}
        className="px-6 py-2 bg-teal-600 text-white rounded-lg shadow-sm hover:bg-teal-700"
      >
        Sign Out
      </button>
    </div>
  );
}