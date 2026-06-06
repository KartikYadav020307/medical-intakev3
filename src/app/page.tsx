"use client";

import { motion } from 'motion/react';
import { Dna, Network, AlignCenter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor'>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  // Auto-redirect if already authenticated (keep-logged-in)
  useEffect(() => {
    const redirectAuthenticatedUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // User is already signed in; gate on onboarding completion.
        const meta = session.user.user_metadata;
        if (!meta?.onboarding_complete) {
          router.replace('/onboarding');
        } else {
          router.replace(meta.role === 'doctor' ? '/doctor' : '/patient');
        }
      } else {
        setCheckingAuth(false);
      }
    };

    redirectAuthenticatedUser();
  }, [router]);

  const handleSignUp = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role: selectedRole } },
      });
      if (error) throw error;
      if (data.session) {
        router.push('/onboarding');
      } else {
        setSuccessMsg("Check your email for the magic link!");
      }
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const meta = data.session.user.user_metadata;
      if (!meta?.onboarding_complete) {
        router.push('/onboarding');
      } else {
        router.push(meta.role === 'doctor' ? '/doctor' : '/patient');
      }
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Show a loading state while checking if the user is already logged in
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-sans">Checking session...</p>
        </div>
      </div>
    );
  }

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

              <form className="space-y-5" onSubmit={handleLogin}>
                {/* Role Toggle */}
                <div className="flex bg-slate-100/50 p-1 rounded-xl mb-6">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('patient')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                      selectedRole === 'patient'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('doctor')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                      selectedRole === 'doctor'
                        ? 'bg-white text-teal-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Doctor
                  </button>
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    placeholder="you@example.com"
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    placeholder="••••••••"
                  />
                </div>

                {errorMsg && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md mb-4 text-center border border-red-100">{errorMsg}</div>}
                {successMsg && <div className="text-emerald-600 text-sm bg-emerald-50 p-3 rounded-md mb-4 text-center border border-emerald-100">{successMsg}</div>}

                <div className="pt-2 flex gap-3">
                  <button type="submit" disabled={loading} className="relative flex-1 overflow-hidden rounded-xl p-[1px] group/btn disabled:opacity-70">
                    <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-teal-400 rounded-xl opacity-80 group-hover/btn:opacity-100 transition-opacity" />
                    <div className="relative flex items-center justify-center gap-2 bg-white w-full py-3.5 rounded-xl transition-all group-hover/btn:bg-transparent text-slate-800 group-hover/btn:text-white font-medium shadow-sm">
                      {loading ? 'Processing...' : 'Log In'}
                    </div>
                  </button>
                  <button type="button" onClick={handleSignUp} disabled={loading} className="relative flex-1 overflow-hidden rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3.5 transition-colors disabled:opacity-70">
                    Sign Up
                  </button>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
                 <span>STATUS: <span className="text-teal-600 uppercase font-semibold">Operational</span></span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
