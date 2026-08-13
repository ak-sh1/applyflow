"use client";

import Link from "next/link";
import { useState } from "react";

export default function AuthScreen({ supabase, onGuest }) {
  const [mode, setMode] = useState("sign-in");
  const [loadingAction, setLoadingAction] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    setLoadingAction("account");
    setMessage("");
    setIsError(false);

    const result = mode === "sign-up"
      ? await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    setLoadingAction("");
    if (result.error) {
      setIsError(true);
      const isRateLimited = result.error.message.toLowerCase().includes("rate limit");
      setMessage(isRateLimited
        ? "The confirmation email service is temporarily at its limit. Try again in about an hour."
        : result.error.message);
      return;
    }

    if (mode === "sign-up" && !result.data.session) {
      setMessage("Check your email to confirm your account, then sign in.");
    } else if (mode === "sign-up") {
      setMessage("Account created. Loading your dashboard…");
    }
  }

  function continueAsGuest() {
    setLoadingAction("guest");
    setMessage("");
    setIsError(false);
    onGuest();
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setMessage("");
    setIsError(false);
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <Link className="brand auth-brand" href="/" aria-label="ApplyFlow home">
          <span className="brand-mark"><span /></span>
          <span>ApplyFlow</span>
        </Link>
        <div>
          <p className="eyebrow">YOUR INTERNSHIP SEARCH</p>
          <h1>Every opportunity.<br />One clear workflow.</h1>
          <p>Track applications, next steps, interviews and offers without losing momentum.</p>
          <div className="auth-preview" aria-hidden="true">
            <span className="preview-dot" />
            <div><strong>Software Developer Intern</strong><span>Interview · Technical round Tuesday</span></div>
            <span className="status-pill status-interview">Interview</span>
          </div>
        </div>
        <p className="auth-footnote">Private by design. Your records are protected by database-level access rules.</p>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">{mode === "sign-in" ? "WELCOME BACK" : "GET STARTED"}</p>
          <h2>{mode === "sign-in" ? "Sign in to ApplyFlow" : "Create your account"}</h2>
          <p>{mode === "sign-in" ? "Continue managing your application pipeline." : "Start organizing your internship search in minutes."}</p>

          <div className="guest-entry">
            <div className="guest-entry-label"><span>QUICK DEMO</span><span>No account needed</span></div>
            <button className="guest-button" type="button" onClick={continueAsGuest} disabled={Boolean(loadingAction)}>
              <span><strong>{loadingAction === "guest" ? "Opening demo…" : "Continue as guest"}</strong><small>Explore a ready-to-use workspace</small></span>
              <b aria-hidden="true">→</b>
            </button>
          </div>

          <div className="auth-divider"><span>or use your account</span></div>

          <div className="auth-tabs" role="tablist" aria-label="Account action">
            <button className={mode === "sign-in" ? "active" : ""} onClick={() => changeMode("sign-in")} type="button">Sign in</button>
            <button className={mode === "sign-up" ? "active" : ""} onClick={() => changeMode("sign-up")} type="button">Create account</button>
          </div>

          {message && <p className={isError ? "auth-message error" : "auth-message"} role="status">{message}</p>}

          <form onSubmit={submit} className="auth-form">
            <label>Email<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
            <label>Password<input name="password" type="password" minLength={8} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} placeholder="At least 8 characters" required /></label>
            <button className="primary-button auth-submit" disabled={Boolean(loadingAction)}>
              {loadingAction === "account" ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="auth-switch">
            {mode === "sign-in" ? "New to ApplyFlow?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => changeMode(mode === "sign-in" ? "sign-up" : "sign-in")}>{mode === "sign-in" ? "Create one" : "Sign in"}</button>
          </p>
        </div>
      </section>
    </main>
  );
}
