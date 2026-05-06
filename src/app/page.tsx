"use client";

import { motion } from 'motion/react';
import { Dna, Fingerprint, Network, AlignCenter, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function Home() {
  const [isDoctor, setIsDoctor] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user already exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      let finalRole = isDoctor ? 'doctor' : 'patient';

      if (userSnap.exists()) {
        // Use the existing role from the database instead of the toggle
        finalRole = userSnap.data().role;
      } else {
        // Save new user to Firestore
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          role: finalRole,
          createdAt: new Date().toISOString()
        });
      }

      // Route based on actual authorized role
      if (finalRole === 'doctor') {
        router.push('/doctor');
      } else {
        router.push('/patient');
      }
    } catch (error: any) {
      alert("Authentication Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex absolute inset-0 w-full z-10 bg-slate-50 text-slate-600 font-display selection:bg-indigo-500/20">
      
      {/* Background effects */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-[800px] h-[800px] bg-gradient-to-tr from-indigo-500/20 via-teal-400/10 to-transparent rounded-full blur-[120px]" />
        
        {/* Subtle dot grid */}
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundImage: `radial-gradient(circle at center, rgba(15, 23, 42, 0.04) 1px, transparent 1px)`,
            backgroundSize: '24px 24px' 
          }} 
        />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center p-6 sm:p-12 lg:p-24 min-h-screen gap-12 lg:gap-24">
        
        {/* Left Side: Graphic / Tech Vibe */}
        <div className="flex-1 w-full flex flex-col max-w-lg lg:max-w-none">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-10">
              <Dna className="w-8 h-8 text-indigo-600" />
              <span className="text-2xl font-bold tracking-tight text-slate-900">Medical<span className="text-indigo-600">.Intake</span></span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-slate-900 mb-6">
              Accelerating patient <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-teal-500">
                care & analysis.
              </span>
            </h1>
            
            <p className="text-lg text-slate-600 font-sans mb-12 max-w-md">
              Securely access health records, AI diagnostics tools, and collaborative clinical environments.
            </p>

            <div className="grid grid-cols-2 gap-6 max-w-md">
              <div className="flex items-start gap-3">
                <Network className="w-5 h-5 text-teal-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900">Neural Diagnostics</h3>
                  <p className="text-sm font-sans text-slate-500 mt-1">Real-time health anomaly simulations</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlignCenter className="w-5 h-5 text-indigo-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900">Intake Alignment</h3>
                  <p className="text-sm font-sans text-slate-500 mt-1">Unified patient telemetry records</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: High-tech Form */}
        <div className="w-full max-w-md flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="p-8 sm:p-10 bg-white/70 backdrop-blur-xl border border-slate-200 shadow-2xl shadow-indigo-100/50 rounded-3xl relative overflow-hidden group"
          >
            {/* Ambient hover glow on the card border */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Systems Login</h2>
              <p className="text-sm font-sans text-slate-500 mb-8">Authentication required for Core Systems</p>

              {/* Role Toggle */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
                <button
                  type="button"
                  onClick={() => setIsDoctor(false)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${!isDoctor ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => setIsDoctor(true)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${isDoctor ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Doctor
                </button>
              </div>

              <form className="space-y-5" onSubmit={handleAuth}>
                <div className="pt-2">
                  <button type="submit" disabled={loading} className="relative w-full overflow-hidden rounded-xl p-[1px] group/btn disabled:opacity-70">
                    <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-teal-400 rounded-xl opacity-80 group-hover/btn:opacity-100 transition-opacity" />
                    <div className="relative flex items-center justify-center gap-2 bg-white w-full py-3.5 rounded-xl transition-all group-hover/btn:bg-transparent text-slate-800 group-hover/btn:text-white font-medium shadow-sm">
                      <Fingerprint className="w-5 h-5 text-indigo-500 group-hover/btn:text-white transition-colors" />
                      {loading ? 'Authenticating...' : `Authenticate as ${isDoctor ? 'Doctor' : 'Patient'}`}
                    </div>
                  </button>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
                 <span>STATUS: <span className="text-teal-600 uppercase font-semibold">Operational</span></span>
                 <button className="flex items-center gap-1 hover:text-slate-800 transition-colors" onClick={handleAuth as any}>
                   <span>GOOGLE SSO</span>
                   <ArrowRight className="w-3 h-3" />
                 </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
