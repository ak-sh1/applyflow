"use client";

import { useEffect, useState } from "react";
import AuthScreen from "./auth-screen";
import CommandCenter from "./command-center";
import { getSupabase } from "@/lib/supabase";

const GUEST_SESSION_KEY = "applyflow-guest-session";
const GUEST_DATA_KEY = "applyflow-guest-applications";
const GUEST_USER = { id: "applyflow-guest", is_anonymous: true };

export default function Home() {
  const supabase = getSupabase();
  const [user, setUser] = useState(null);
  const [guestMode, setGuestMode] = useState(() =>
    typeof window !== "undefined" && window.sessionStorage.getItem(GUEST_SESSION_KEY) === "active",
  );
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  function startGuestDemo() {
    window.sessionStorage.setItem(GUEST_SESSION_KEY, "active");
    setGuestMode(true);
  }

  function exitGuestDemo() {
    window.sessionStorage.removeItem(GUEST_SESSION_KEY);
    window.localStorage.removeItem(GUEST_DATA_KEY);
    setGuestMode(false);
  }

  if (!supabase) return <SetupScreen />;
  if (loading) return <div className="loading-screen"><span className="brand-mark"><span /></span><p>Loading ApplyFlow…</p></div>;
  if (!user && guestMode) return <CommandCenter user={GUEST_USER} supabase={supabase} onGuestExit={exitGuestDemo} />;
  if (!user) return <AuthScreen supabase={supabase} onGuest={startGuestDemo} />;

  return <CommandCenter user={user} supabase={supabase} />;
}

function SetupScreen() {
  return (
    <main className="setup-screen">
      <span className="brand-mark"><span /></span>
      <p className="eyebrow">ONE-TIME SETUP</p>
      <h1>Connect ApplyFlow to Supabase</h1>
      <p>Copy <code>.env.example</code> to <code>.env.local</code>, add your project URL and publishable key, then restart the development server.</p>
    </main>
  );
}
