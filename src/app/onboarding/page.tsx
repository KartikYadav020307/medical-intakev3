"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import Image from "next/image";
import { Dna, UserCircle, Heart, Shield, Camera, Loader2 } from "lucide-react";
import { supabase } from "../../../lib/supabase";

export default function OnboardingPage() {
  const router = useRouter();

  // ── Auth state ──────────────────────────────────────────────────────
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  // ── Form fields ─────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [language, setLanguage] = useState("");
  const [address, setAddress] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Submission state ────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Auth check on mount ─────────────────────────────────────────────
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/");
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? "");
      setCheckingAuth(false);
    };

    checkUser();
  }, [router]);

  // ── Avatar preview ──────────────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAvatarFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setAvatarPreview(null);
    }
  };

  // ── Submit handler ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!consentGiven) {
      setErrorMsg(
        "You must consent to the Privacy Policy & Medical Data Processing to continue."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      let avatarUrl: string | null = null;

      // Upload avatar if selected
      if (avatarFile && userId) {
        const filePath = `avatars/${userId}-${avatarFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("records")
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
          throw new Error(`Avatar upload failed: ${uploadError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("records").getPublicUrl(filePath);

        avatarUrl = publicUrl;
      }

      // Persist all fields to user_metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          name,
          dob,
          sex,
          phone,
          blood_type: bloodType,
          language,
          address,
          avatar_url: avatarUrl,
          consent_given: true,
          onboarding_complete: true,
        },
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      router.push("/patient");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-sans">
            Securing connection...
          </p>
        </div>
      </div>
    );
  }

  // ── Shared input classes ────────────────────────────────────────────
  const inputClass =
    "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 font-sans text-sm";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";
  const sectionDelay = 0.15;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-600 font-display selection:bg-indigo-500/20">
      {/* ── Background effects ─────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-[900px] h-[900px] bg-gradient-to-tr from-indigo-500/15 via-teal-400/10 to-transparent rounded-full blur-[140px]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at center, rgba(15, 23, 42, 0.04) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* ── Main container ─────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center justify-start px-6 py-12 sm:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Dna className="w-8 h-8 text-indigo-600" />
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Medical<span className="text-indigo-600">.Intake</span>
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-3">
            Complete Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-teal-500">
              Clinical Profile
            </span>
          </h1>
          <p className="text-base text-slate-500 font-sans max-w-md mx-auto">
            Provide your baseline information so we can securely manage your
            medical records and deliver personalized insights.
          </p>
        </motion.div>

        {/* ── Glassmorphism card ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="w-full p-8 sm:p-10 bg-white/70 backdrop-blur-xl border border-slate-200 shadow-2xl shadow-indigo-100/50 rounded-3xl relative overflow-hidden group"
        >
          {/* Ambient hover glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
            {/* ═══ Section 1: Identity ═══════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: sectionDelay * 1 }}
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                  <UserCircle className="w-4.5 h-4.5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Identity
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Email (read-only) */}
                <div className="sm:col-span-2">
                  <label htmlFor="onboarding-email" className={labelClass}>
                    Email Address
                  </label>
                  <input
                    id="onboarding-email"
                    type="email"
                    value={email}
                    disabled
                    className={`${inputClass} bg-slate-50 text-slate-500 cursor-not-allowed`}
                  />
                </div>

                {/* Legal Full Name */}
                <div className="sm:col-span-2">
                  <label htmlFor="onboarding-name" className={labelClass}>
                    Legal Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="onboarding-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    placeholder="John A. Doe"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label htmlFor="onboarding-dob" className={labelClass}>
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="onboarding-dob"
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className={inputClass}
                  />
                </div>

                {/* Biological Sex */}
                <div>
                  <label htmlFor="onboarding-sex" className={labelClass}>
                    Biological Sex <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="onboarding-sex"
                    required
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    className={inputClass}
                  >
                    <option value="" disabled>
                      Select...
                    </option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* ═══ Section 2: Medical Profile ═══════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: sectionDelay * 2 }}
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center border border-teal-100">
                  <Heart className="w-4.5 h-4.5 text-teal-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Medical Profile
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Phone */}
                <div>
                  <label htmlFor="onboarding-phone" className={labelClass}>
                    Phone Number
                  </label>
                  <input
                    id="onboarding-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                {/* Blood Type */}
                <div>
                  <label htmlFor="onboarding-blood" className={labelClass}>
                    Blood Type
                  </label>
                  <select
                    id="onboarding-blood"
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Unknown / Prefer not to say</option>
                    <option value="A+">A+</option>
                    <option value="A-">A−</option>
                    <option value="B+">B+</option>
                    <option value="B-">B−</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB−</option>
                    <option value="O+">O+</option>
                    <option value="O-">O−</option>
                  </select>
                </div>

                {/* Primary Language */}
                <div>
                  <label htmlFor="onboarding-language" className={labelClass}>
                    Primary Language
                  </label>
                  <input
                    id="onboarding-language"
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className={inputClass}
                    placeholder="English"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label htmlFor="onboarding-address" className={labelClass}>
                    Address
                  </label>
                  <textarea
                    id="onboarding-address"
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`${inputClass} resize-none`}
                    placeholder="123 Main St, Suite 4B, City, State ZIP"
                  />
                </div>
              </div>
            </motion.div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* ═══ Section 3: Verification ═════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: sectionDelay * 3 }}
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100">
                  <Shield className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Verification
                </h2>
              </div>

              {/* Profile Photo Upload */}
              <div className="mb-6">
                <label className={labelClass}>Profile Photo</label>
                <div className="flex items-center gap-5">
                  {/* Preview circle */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer shrink-0 group/avatar"
                  >
                    {avatarPreview ? (
                      <Image
                        src={avatarPreview}
                        alt="Avatar preview"
                        fill
                        className="object-cover rounded-2xl"
                      />
                    ) : (
                      <Camera className="w-7 h-7 text-slate-400 group-hover/avatar:text-indigo-500 transition-colors" />
                    )}
                  </button>
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                    >
                      {avatarPreview ? "Change photo" : "Upload a photo"}
                    </button>
                    <p className="text-xs text-slate-400 mt-1">
                      JPG, PNG, or WebP. Max 5 MB.
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="onboarding-avatar"
                  />
                </div>
              </div>

              {/* Consent Checkbox */}
              <div className="flex items-start gap-3 p-4 bg-slate-50/80 border border-slate-200 rounded-xl">
                <input
                  id="onboarding-consent"
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-0.5 w-4.5 h-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                />
                <label
                  htmlFor="onboarding-consent"
                  className="text-sm text-slate-600 leading-relaxed cursor-pointer"
                >
                  I consent to the{" "}
                  <span className="font-semibold text-slate-800">
                    Privacy Policy
                  </span>{" "}
                  and{" "}
                  <span className="font-semibold text-slate-800">
                    Medical Data Processing Agreement
                  </span>
                  . I understand that my clinical data will be stored securely
                  and used exclusively for healthcare purposes.{" "}
                  <span className="text-red-500">*</span>
                </label>
              </div>
            </motion.div>

            {/* ── Error Banner ──────────────────────────────────────── */}
            {errorMsg && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl text-center border border-red-100 font-medium">
                {errorMsg}
              </div>
            )}

            {/* ── Submit Button ─────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: sectionDelay * 4 }}
            >
              <button
                type="submit"
                disabled={isSubmitting}
                className="relative w-full overflow-hidden rounded-xl p-[1px] group/btn disabled:opacity-70 cursor-pointer"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-teal-400 rounded-xl opacity-80 group-hover/btn:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center gap-2.5 bg-white w-full py-4 rounded-xl transition-all group-hover/btn:bg-transparent text-slate-800 group-hover/btn:text-white font-semibold shadow-sm text-base">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving Profile...
                    </>
                  ) : (
                    "Complete Onboarding"
                  )}
                </div>
              </button>
            </motion.div>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-8 flex items-center justify-center gap-2 text-xs font-mono text-slate-400"
        >
          <span>
            STATUS:{" "}
            <span className="text-teal-600 uppercase font-semibold">
              Secure
            </span>
          </span>
          <span className="text-slate-300">·</span>
          <span>AES-256 Encrypted</span>
        </motion.div>
      </div>
    </div>
  );
}
