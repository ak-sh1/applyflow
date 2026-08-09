"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { STATUSES, type Application, type Status } from "@/lib/types";

const WEEK_AGO_AT_LOAD = Date.now() - 7 * 24 * 60 * 60 * 1000;

function Icon({ children }: { children: React.ReactNode }) {
  return <span aria-hidden="true" className="icon">{children}</span>;
}

function formatDate(value: string | null) {
  if (!value) return "Not applied";
  return new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric" })
    .format(new Date(`${value}T12:00:00`));
}

function normalizeJobUrl(value: string) {
  if (!value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function CommandCenter({ user, supabase }: { user: User; supabase: SupabaseClient }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeStatus, setActiveStatus] = useState<"All" | Status>("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Application | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    async function loadApplications() {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (!active) return;
      if (error) {
        setNotice("Applications could not be loaded. Check that the Supabase schema has been applied.");
      } else {
        const rows = (data ?? []) as Application[];
        setApplications(rows);
        setSelected(rows[0] ?? null);
      }
      setLoading(false);
    }

    loadApplications();
    return () => { active = false; };
  }, [supabase, user.id]);

  const visibleApplications = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    return applications.filter((application) => {
      const statusMatches = activeStatus === "All" || application.status === activeStatus;
      const queryMatches = !normalizedQuery ||
        `${application.company} ${application.role} ${application.location}`
          .toLowerCase()
          .includes(normalizedQuery);
      return statusMatches && queryMatches;
    });
  }, [applications, activeStatus, query]);

  const counts = useMemo(() => {
    return Object.fromEntries(
      STATUSES.map((status) => [status, applications.filter((item) => item.status === status).length]),
    ) as Record<Status, number>;
  }, [applications]);

  const weeklyCount = useMemo(() => {
    return applications.filter((item) => new Date(item.created_at).getTime() >= WEEK_AGO_AT_LOAD).length;
  }, [applications]);

  const responseRate = useMemo(() => {
    const submitted = applications.filter((item) => item.status !== "Saved").length;
    const responses = counts.Interview + counts.Offer;
    return submitted ? Math.round((responses / submitted) * 100) : 0;
  }, [applications, counts]);

  const focusApplications = applications
    .filter((item) => item.next_step && item.next_step !== "Add your next action")
    .slice(0, 3);

  const initials = (user.email ?? "User")
    .split(/[@._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  async function addApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const company = String(form.get("company") ?? "").trim();
    const role = String(form.get("role") ?? "").trim();
    const status = String(form.get("status") ?? "Saved") as Status;
    const rawJobUrl = String(form.get("jobUrl") ?? "");
    const jobUrl = normalizeJobUrl(rawJobUrl);

    if (!company || !role || !STATUSES.includes(status)) return;
    if (rawJobUrl.trim() && !jobUrl) {
      setNotice("Enter a valid job link beginning with http:// or https://.");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const payload = {
      user_id: user.id,
      company: company.slice(0, 120),
      role: role.slice(0, 160),
      location: String(form.get("location") ?? "").trim().slice(0, 120) || "Location not specified",
      status,
      applied_date: status === "Saved" ? null : String(form.get("appliedDate") || today),
      next_step: String(form.get("nextStep") ?? "").trim().slice(0, 180) || "Add your next action",
      source: String(form.get("source") ?? "Manual entry").slice(0, 100),
      resume: "Not selected",
      accent: company.slice(0, 1).toUpperCase(),
      job_url: jobUrl,
      notes: String(form.get("notes") ?? "").trim().slice(0, 1000) || null,
    };

    setSaving(true);
    setNotice("");
    const { data, error } = await supabase
      .from("applications")
      .insert(payload)
      .select("*")
      .single();

    setSaving(false);
    if (error) {
      setNotice(`Could not add the application: ${error.message}`);
      return;
    }

    const application = data as Application;
    setApplications((current) => [application, ...current]);
    setSelected(application);
    setNotice(`${company} was added to your pipeline.`);
    setShowForm(false);
    formElement.reset();
  }

  async function moveToNextStage(application: Application) {
    const currentIndex = STATUSES.indexOf(application.status);
    const status = STATUSES[Math.min(currentIndex + 1, STATUSES.length - 1)];
    if (status === application.status) return;

    const { data, error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", application.id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      setNotice(`Could not change the stage: ${error.message}`);
      return;
    }

    const updated = data as Application;
    setApplications((current) => current.map((item) => item.id === application.id ? updated : item));
    setSelected(updated);
    setNotice(`${application.company} moved to ${status}.`);
  }

  async function deleteApplication(application: Application) {
    if (!window.confirm(`Delete the ${application.company} application? This cannot be undone.`)) return;

    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", application.id)
      .eq("user_id", user.id);

    if (error) {
      setNotice(`Could not delete the application: ${error.message}`);
      return;
    }

    setApplications((current) => current.filter((item) => item.id !== application.id));
    setSelected(null);
    setNotice(`${application.company} was removed.`);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="ApplyFlow dashboard home">
          <span className="brand-mark"><span /></span>
          <span>ApplyFlow</span>
        </a>
        <div className="top-actions">
          <button className="help-button" onClick={() => setNotice("Add a role, record its next step, then move it through the pipeline as you hear back.")} aria-label="Help"><Icon>?</Icon></button>
          <div className="profile-wrap">
            <button className="avatar" onClick={() => setShowProfile((value) => !value)} aria-expanded={showProfile} aria-label="Open profile menu">{initials}</button>
            {showProfile && (
              <div className="profile-menu">
                <strong>{user.email}</strong>
                <span>Your application data is private to this account.</span>
                <button onClick={signOut}>Sign out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="workspace" id="top">
        <aside className="sidebar" aria-label="Main navigation">
          <nav>
            <a className="nav-item active" href="#dashboard"><Icon>⌂</Icon><span>Dashboard</span></a>
            <a className="nav-item" href="#applications"><Icon>▣</Icon><span>Applications</span><span className="nav-count">{applications.length}</span></a>
          </nav>
          <div className="sidebar-bottom">
            <div className="progress-card">
              <div className="progress-card-header"><span>Weekly goal</span><strong>{Math.min(weeklyCount, 10)}/10</strong></div>
              <div className="progress-track"><span style={{ width: `${Math.min(weeklyCount * 10, 100)}%` }} /></div>
              <p>{weeklyCount >= 10 ? "Weekly goal reached." : `${10 - weeklyCount} more application${10 - weeklyCount === 1 ? "" : "s"} to reach your target.`}</p>
            </div>
            <button className="nav-item settings" onClick={() => setShowProfile(true)}><Icon>⚙</Icon><span>Account</span></button>
          </div>
        </aside>

        <section className="main-content" id="dashboard">
          {notice && <button className="notice" onClick={() => setNotice("")} aria-label="Dismiss notification">{notice}<span>×</span></button>}
          <div className="page-heading">
            <div>
              <p className="eyebrow">{new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "long", day: "numeric" }).format(new Date()).toUpperCase()}</p>
              <h1>Your search, under control.</h1>
              <p>Keep every application moving and know exactly what comes next.</p>
            </div>
            <button className="primary-button" onClick={() => setShowForm(true)}><span>＋</span> Add application</button>
          </div>

          <section className="metrics" aria-label="Application summary">
            <article><span className="metric-icon blue"><Icon>↗</Icon></span><div><strong>{applications.length}</strong><span>Total applications</span></div><small>{weeklyCount} added this week</small></article>
            <article><span className="metric-icon violet"><Icon>◇</Icon></span><div><strong>{counts.Interview}</strong><span>Active interviews</span></div><small>Keep preparing</small></article>
            <article><span className="metric-icon amber"><Icon>★</Icon></span><div><strong>{counts.Offer}</strong><span>Offers</span></div><small>{counts.Applied} awaiting response</small></article>
            <article><span className="metric-icon green"><Icon>✓</Icon></span><div><strong>{responseRate}%</strong><span>Response rate</span></div><small>Interviews and offers</small></article>
          </section>

          <section className="focus-card">
            <div className="focus-heading"><span className="pulse-dot" /><div><p>NEXT ACTIONS</p><h2>{focusApplications.length ? "Keep your pipeline moving" : "Add next steps to build your focus list"}</h2></div></div>
            <div className="focus-items">
              {focusApplications.length ? focusApplications.map((application) => (
                <button key={application.id} onClick={() => setSelected(application)}><span className="check-ring" /><div><strong>{application.next_step}</strong><span>{application.company} · {application.role}</span></div><small>{application.status}</small></button>
              )) : <p className="focus-empty">Your three most recent next actions will appear here.</p>}
            </div>
          </section>

          <section className="pipeline" id="applications">
            <div className="section-heading">
              <div><p className="eyebrow">PIPELINE</p><h2>Applications</h2></div>
              <div className="controls">
                <label className="search"><Icon>⌕</Icon><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company or role" aria-label="Search applications" /></label>
              </div>
            </div>
            <div className="status-tabs" role="tablist" aria-label="Filter by application status">
              {(["All", ...STATUSES] as const).map((status) => (
                <button key={status} className={activeStatus === status ? "active" : ""} onClick={() => setActiveStatus(status)} role="tab" aria-selected={activeStatus === status}>
                  {status}<span>{status === "All" ? applications.length : counts[status]}</span>
                </button>
              ))}
            </div>

            <div className="application-layout">
              <div className="application-list">
                {loading ? <div className="empty-state"><strong>Loading applications…</strong></div> : visibleApplications.length ? visibleApplications.map((application) => (
                  <button className={`application-row ${selected?.id === application.id ? "selected" : ""}`} key={application.id} onClick={() => setSelected(application)}>
                    <span className={`company-logo logo-${application.accent.toLowerCase()}`}>{application.accent}</span>
                    <span className="application-main"><strong>{application.role}</strong><span>{application.company} · {application.location}</span></span>
                    <span className={`status-pill status-${application.status.toLowerCase()}`}>{application.status}</span>
                    <span className="next-step"><strong>{application.next_step}</strong><span>{formatDate(application.applied_date)}</span></span>
                    <span className="row-arrow">›</span>
                  </button>
                )) : <div className="empty-state"><strong>{applications.length ? "No applications found" : "Your pipeline is ready"}</strong><span>{applications.length ? "Try another search or status." : "Add your first opportunity to begin tracking it."}</span>{!applications.length && <button className="primary-button empty-action" onClick={() => setShowForm(true)}>Add first application</button>}</div>}
              </div>

              <aside className="detail-panel" aria-label="Selected application details">
                {selected ? <>
                  <div className="detail-company"><span className={`company-logo large logo-${selected.accent.toLowerCase()}`}>{selected.accent}</span><div><p>{selected.company}</p><h3>{selected.role}</h3><span>{selected.location}</span></div><button onClick={() => deleteApplication(selected)} aria-label="Delete application" title="Delete application">×</button></div>
                  <div className="detail-status"><span className={`status-pill status-${selected.status.toLowerCase()}`}>{selected.status}</span><button onClick={() => moveToNextStage(selected)} disabled={selected.status === "Offer"}>{selected.status === "Offer" ? "Final stage" : "Move to next stage →"}</button></div>
                  <dl>
                    <div><dt>Next action</dt><dd>{selected.next_step}</dd></div>
                    <div><dt>Applied</dt><dd>{formatDate(selected.applied_date)}</dd></div>
                    <div><dt>Source</dt><dd>{selected.source}</dd></div>
                    <div><dt>Résumé</dt><dd>{selected.resume}</dd></div>
                  </dl>
                  <div className="detail-note"><p>NOTES</p><span>{selected.notes || "No notes added."}</span></div>
                  {selected.job_url ? <a className="secondary-button secondary-link" href={selected.job_url} target="_blank" rel="noreferrer">Open job posting ↗</a> : <button className="secondary-button" onClick={() => setNotice("Add the job URL when creating an application to open it from here.")}>No job link saved</button>}
                  <button className="delete-button" onClick={() => deleteApplication(selected)}>Delete application</button>
                </> : <div className="empty-detail">Select an application to see details.</div>}
              </aside>
            </div>
          </section>
        </section>
      </div>

      {showForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowForm(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="add-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-heading"><div><p className="eyebrow">NEW OPPORTUNITY</p><h2 id="add-title">Add an application</h2></div><button onClick={() => setShowForm(false)} aria-label="Close">×</button></div>
            <form onSubmit={addApplication}>
              <label>Company<input name="company" placeholder="e.g. Shopify" required autoFocus maxLength={120} /></label>
              <label>Role<input name="role" placeholder="e.g. Software Developer Intern" required maxLength={160} /></label>
              <div className="form-grid">
                <label>Location<input name="location" placeholder="Toronto · Hybrid" maxLength={120} /></label>
                <label>Status<select name="status" defaultValue="Saved">{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
              </div>
              <div className="form-grid">
                <label>Source<select name="source" defaultValue="Company careers"><option>Company careers</option><option>York Experience</option><option>LinkedIn</option><option>Referral</option><option>Other</option></select></label>
                <label>Applied date<input name="appliedDate" type="date" /></label>
              </div>
              <label>Next action<input name="nextStep" placeholder="e.g. Tailor résumé by Friday" maxLength={180} /></label>
              <label>Job posting URL<input name="jobUrl" type="url" placeholder="https://company.com/jobs/..." maxLength={500} /></label>
              <label>Notes<textarea name="notes" placeholder="Recruiter, interview topics, or reminders" maxLength={1000} /></label>
              <div className="modal-actions"><button type="button" className="ghost-button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? "Saving…" : "Add application"}</button></div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
