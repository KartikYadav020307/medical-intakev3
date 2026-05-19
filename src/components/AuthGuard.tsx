"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type AuthGuardProps = {
  children: React.ReactNode;
  requiredRole?: string;
};

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const validateSession = (
      session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]
    ) => {
      if (!session) {
        router.replace("/");
        return;
      }

      const role = session.user.user_metadata?.role;

      if (requiredRole && role !== requiredRole) {
        router.replace("/patient");
        return;
      }

      setIsAuthenticated(true);
    };

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      validateSession(session);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        validateSession(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, requiredRole]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-body">
        <div className="flex flex-col items-center gap-5">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin shadow-sm" />
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">
            Securing Connection...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
