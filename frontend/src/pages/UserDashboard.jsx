import { useState, useEffect, useRef } from "react";
import { T } from "../utils/theme";
import { DarkCard, Btn, Badge, MiniChart } from "../components/RiskDashboard";
import { getUser, getMyResults, getDoctors } from "../services/api";
import { useAssessment } from "../context/AssessmentContext";
import { submitAnalysis } from "../services/api";
import { db } from "../firebase";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";

// ── Gemini & Places API keys from environment ─────────────────────────────

const LIME = "#C8F135";
const RED  = "#e84040";
const AMB  = "#f59e0b";
const BLU  = "#60a5fa";
const PUR  = "#a78bfa";

/* ─────────────────────────────────────────────
   Firebase doctor sync helpers
───────────────────────────────────────────── */
async function syncDoctorsToFirebase(doctors) {
  if (!db || !doctors?.length) return;
  try {
    for (const doctor of doctors) {
      if (doctor.id) {
        await setDoc(doc(db, "doctors", String(doctor.id)), {
          id: doctor.id, full_name: doctor.full_name || "",
          specialization: doctor.specialization || "", hospital: doctor.hospital || "",
          location: doctor.location || "", consultation_mode: doctor.consultation_mode || "",
          max_patients: doctor.max_patients || 10, current_patients: doctor.current_patients || 0,
          bio: doctor.bio || "", updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    }
  } catch (e) { console.warn("Firestore doctor sync:", e.message); }
}
async function loadDoctorsFromFirebase() {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, "doctors"));
    return snap.docs.map(d => d.data());
  } catch (e) { return []; }
}

/* ─────────────────────────────────────────────
   helpers
───────────────────────────────────────────── */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

async function apiFetch(path, method = "GET", body = null) {
  const token = sessionStorage.getItem("neuroaid_token");
  const res = await fetch(`/api${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Request failed"); }
  return res.json();
}

/* ─────────────────────────────────────────────
   Collapsible Section wrapper
───────────────────────────────────────────── */
function CollapsibleSection({ title, icon, badge, badgeColor = AMB, defaultOpen = false, children, accentColor = LIME }) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef(null);
  const [height, setHeight] = useState(defaultOpen ? "auto" : 0);

  useEffect(() => {
    if (open) {
      setHeight(contentRef.current?.scrollHeight + "px");
      const t = setTimeout(() => setHeight("auto"), 350);
      return () => clearTimeout(t);
    } else {
      setHeight(contentRef.current?.scrollHeight + "px");
      requestAnimationFrame(() => requestAnimationFrame(() => setHeight(0)));
    }
  }, [open]);

  return (
    <div style={{ marginBottom: 14, borderRadius: 18, border: `1px solid ${open ? accentColor + "28" : "rgba(255,255,255,0.07)"}`, overflow: "hidden", background: "#111", transition: "border-color 0.3s" }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "18px 22px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans',sans-serif" }}
      >
        <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
        <span style={{ flex: 1, fontWeight: 800, color: "#fff", fontSize: 15, letterSpacing: "-0.3px" }}>{title}</span>
        {badge != null && (
          <span style={{ background: `${badgeColor}18`, color: badgeColor, border: `1px solid ${badgeColor}30`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
            {badge}
          </span>
        )}
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18, transition: "transform 0.3s", transform: open ? "rotate(90deg)" : "none", flexShrink: 0 }}>›</span>
      </button>

      {/* Animated body */}
      <div ref={contentRef} style={{ height, overflow: "hidden", transition: "height 0.32s cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{ padding: "0 22px 22px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Inline Assessment Panel
───────────────────────────────────────────── */
function AssessmentPanel({ setPage }) {
  const {
    speechData, memoryData, reactionData, stroopData, tapData,
    setApiResult, setLoading: setCtxLoading, setError: setCtxError,
    loading, error, completedCount,
  } = useAssessment();

  const tests = [
    { id: "speech",   icon: "🎙️", title: "Speech Analysis",  desc: "WPM, pauses, rhythm",          dur: "~2 min", accent: RED,  done: !!speechData   },
    { id: "memory",   icon: "🧠", title: "Memory Test",       desc: "Recall, latency, intrusions",  dur: "~3 min", accent: BLU,  done: !!memoryData   },
    { id: "reaction", icon: "⚡", title: "Reaction Time",     desc: "Speed, drift, misses",          dur: "~2 min", accent: AMB,  done: !!reactionData },
    { id: "stroop",   icon: "🎨", title: "Stroop Test",       desc: "Color-word interference",       dur: "~2 min", accent: PUR,  done: !!stroopData   },
    { id: "tap",      icon: "🥁", title: "Motor Tap Test",    desc: "Rhythmic motor control",        dur: "~1 min", accent: LIME, done: !!tapData      },
  ];

  const allDone = completedCount >= 5;
  const pct     = (completedCount / 5) * 100;

  async function handleSubmit() {
    setCtxLoading(true); setCtxError(null);
    try {
      const payload = {
        speech_audio:   speechData?.audio_b64 || null,
        memory_results: { word_recall_accuracy: memoryData?.word_recall_accuracy ?? 50, pattern_accuracy: memoryData?.pattern_accuracy ?? 50 },
        reaction_times: reactionData?.times ?? [],
        speech:   speechData   ? { wpm: speechData.wpm, speed_deviation: speechData.speed_deviation, speech_speed_variability: speechData.speech_speed_variability, pause_ratio: speechData.pause_ratio, completion_ratio: speechData.completion_ratio, restart_count: speechData.restart_count, speech_start_delay: speechData.speech_start_delay } : null,
        memory:   memoryData   ? { word_recall_accuracy: memoryData.word_recall_accuracy, pattern_accuracy: memoryData.pattern_accuracy, delayed_recall_accuracy: memoryData.delayed_recall_accuracy, recall_latency_seconds: memoryData.recall_latency_seconds, order_match_ratio: memoryData.order_match_ratio, intrusion_count: memoryData.intrusion_count } : null,
        reaction: reactionData ? { times: reactionData.times, miss_count: reactionData.miss_count, initiation_delay: reactionData.initiation_delay ?? null } : null,
        stroop:   stroopData   ? { total_trials: stroopData.total_trials, error_count: stroopData.error_count, mean_rt: stroopData.mean_rt, incongruent_rt: stroopData.incongruent_rt } : null,
        tap:      tapData      ? { intervals: tapData.intervals, tap_count: tapData.tap_count } : null,
      };
      const result = await submitAnalysis(payload);
      setApiResult(result);
      setPage("results");
    } catch (e) { setCtxError(e.message); }
    finally { setCtxLoading(false); }
  }

  return (
    <div>
      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "#666", fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase" }}>Session Progress</span>
          <span style={{ fontSize: 13, fontWeight: 900, color: allDone ? LIME : "#fff" }}>
            {completedCount} <span style={{ color: "#444", fontWeight: 400 }}>/ 5 tests</span>
          </span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${LIME},#9ABF28)`, borderRadius: 2, transition: "width 0.6s ease", boxShadow: pct > 0 ? `0 0 10px ${LIME}44` : "none" }} />
        </div>
        {allDone && <div style={{ marginTop: 6, fontSize: 11, color: LIME, fontWeight: 700 }}>✓ All tests complete — ready to submit</div>}
      </div>

      {/* Inline test rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
        {tests.map(t => (
          <div
            key={t.id}
            onClick={loading ? undefined : () => setPage(t.id)}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: t.done ? "rgba(200,241,53,0.05)" : "rgba(255,255,255,0.03)", border: `1px solid ${t.done ? LIME + "25" : "rgba(255,255,255,0.07)"}`, cursor: "pointer", transition: "all 0.18s" }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = t.done ? "rgba(200,241,53,0.09)" : "rgba(255,255,255,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = t.done ? "rgba(200,241,53,0.05)" : "rgba(255,255,255,0.03)"; }}
          >
            {/* Icon */}
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${t.accent}14`, border: `1px solid ${t.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
              {t.icon}
            </div>
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: "#fff", fontSize: 13, lineHeight: 1.2 }}>{t.title}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>{t.desc} · {t.dur}</div>
            </div>
            {/* Status */}
            {t.done ? (
              <span style={{ background: `${LIME}12`, border: `1px solid ${LIME}33`, color: LIME, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>✓ Done</span>
            ) : (
              <span style={{ color: t.accent, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>Start →</span>
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "rgba(232,64,64,0.08)", border: "1px solid rgba(232,64,64,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, color: "#ff7070", fontSize: 13 }}>⚠️ {error}</div>
      )}

      {/* Smart submit button */}
      <button
        onClick={allDone ? handleSubmit : undefined}
        disabled={loading}
        style={{
          width: "100%", padding: "13px 20px", borderRadius: 14,
          border: "none", cursor: allDone ? "pointer" : "default",
          fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: 14,
          transition: "all 0.25s",
          background: completedCount === 0
            ? "rgba(255,255,255,0.05)"
            : allDone
              ? `linear-gradient(90deg,${LIME},#9ABF28)`
              : "rgba(255,255,255,0.08)",
          color: completedCount === 0 ? "#444" : allDone ? "#0a0a0a" : "#fff",
          boxShadow: allDone ? `0 0 20px ${LIME}44` : "none",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading
          ? "⏳ Analyzing 18 features…"
          : completedCount === 0
            ? "Complete tests to unlock analysis"
            : allDone
              ? "🧠 Submit & Get Neural Pattern Analysis →"
              : `Complete ${5 - completedCount} more test${5 - completedCount > 1 ? "s" : ""} to submit`}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Dashboard
───────────────────────────────────────────── */
export default function UserDashboard({ setPage }) {
  const user      = getUser();
  const firstName = user?.full_name?.split(" ")[0] || "there";
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  const [showHistory, setShowHistory] = useState(false);

  const { completedCount, savedResults, loadHistory, apiResult } = useAssessment();

  useEffect(() => {
    // Load from backend API first
    getMyResults()
      .then(r => setResults(r || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));


    // Also load from Firebase (cross-device history)
    loadHistory().catch(() => {});
  }, []);

  // Merge backend results + Firebase results (Firebase may have more if backend is stateless)
  const allResults = results.length > 0 ? results
    : savedResults.length > 0 ? savedResults
    : [];

  // If there's a fresh apiResult from current session, surface it at the top
  const displayResults = apiResult && allResults.length === 0
    ? [{ ...apiResult, timestamp: new Date().toISOString() }]
    : allResults;

  const last    = displayResults.length > 0 ? displayResults[displayResults.length - 1] : null;
  const hasData = !!last;

  const domains = hasData ? [
    { label: "Speech",    v: Math.round(last.speech_score),    color: RED  },
    { label: "Memory",    v: Math.round(last.memory_score),    color: BLU  },
    { label: "Reaction",  v: Math.round(last.reaction_score),  color: AMB  },
    { label: "Executive", v: Math.round(last.executive_score), color: PUR  },
    { label: "Motor",     v: Math.round(last.motor_score),     color: LIME },
  ] : [];

  const overallScore = hasData ? Math.round(domains.reduce((s, d) => s + d.v, 0) / domains.length) : null;

  const chartData = displayResults.slice(-7).map(r =>
    Math.round([r.speech_score, r.memory_score, r.reaction_score, r.executive_score, r.motor_score].reduce((a, b) => a + b, 0) / 5)
  );
  while (chartData.length < 7) chartData.unshift(null);

  const lastDate   = last ? new Date(last.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;
  const riskLevel  = hasData ? (Object.values(last.risk_levels || {}).includes("High") ? "High" : Object.values(last.risk_levels || {}).includes("Moderate") ? "Moderate" : "Low") : null;



  // Assessment section defaults open if no data, closed if they have results
  const assessDefaultOpen = !hasData;

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `rgba(200,241,53,0.10)`, border: `1px solid ${LIME}33`, borderRadius: 99, padding: "5px 14px", marginBottom: 14, fontSize: 11, fontWeight: 700, color: LIME, letterSpacing: 1.5, textTransform: "uppercase" }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: LIME, display: "inline-block", animation: "pulse-dot 2s infinite" }} />
          Cognitive Overview
        </div>
        <h1 style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: "clamp(28px,3.5vw,48px)", color: "#fff", letterSpacing: "-1.5px", lineHeight: 1.1, marginBottom: 8 }}>
          {greeting()}, <span style={{ color: LIME }}>{firstName}.</span>
        </h1>
        <p style={{ color: "#555", fontSize: 14, fontWeight: 500 }}>
          {hasData
            ? `Last assessment ${lastDate} · ${results.length} session${results.length > 1 ? "s" : ""} completed`
            : "No assessments yet — take your first test to see your results"}
        </p>
      </div>

      {loading ? (
        <div style={{ color: "#555", fontSize: 14, padding: 40, textAlign: "center" }}>Loading your results…</div>
      ) : (
        <>
          {/* ── Collapsible: Assessments ── */}
          <CollapsibleSection
            title="Cognitive Assessments"
            icon="🧠"
            badge={completedCount > 0 ? `${completedCount}/5` : null}
            badgeColor={completedCount === 5 ? LIME : AMB}
            defaultOpen={assessDefaultOpen}
            accentColor={LIME}
          >
            <AssessmentPanel setPage={setPage} />
          </CollapsibleSection>


          {/* ── Results (only if data exists) ── */}
          {hasData && (
            <>
              {/* Top row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                {/* Score card */}
                <DarkCard style={{ padding: 36 }} hover={false}>
                  <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16, fontWeight: 700 }}>Overall Cognitive Score</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginBottom: 20 }}>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: 100, color: "#fff", lineHeight: 1, letterSpacing: "-5px" }}>{overallScore}</span>
                    <div style={{ paddingBottom: 18 }}>
                      {displayResults.length >= 2 && (() => {
                        const prev = displayResults[displayResults.length - 2];
                        const prevScore = Math.round([prev.speech_score, prev.memory_score, prev.reaction_score, prev.executive_score, prev.motor_score].reduce((a, b) => a + b, 0) / 5);
                        const diff = overallScore - prevScore;
                        return diff !== 0 ? (
                          <>
                            <div style={{ color: diff > 0 ? LIME : RED, fontSize: 14, fontWeight: 700 }}>{diff > 0 ? "↑" : "↓"} {Math.abs(diff)} pts</div>
                            <div style={{ color: "#444", fontSize: 11, marginTop: 2 }}>vs last session</div>
                          </>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  <Badge level={riskLevel} />
                  <div style={{ marginTop: 24 }}>
                    <MiniChart data={chartData.filter(Boolean)} color={LIME} height={60} />
                  </div>
                </DarkCard>

                {/* Domain scores */}
                <DarkCard style={{ padding: 28 }} hover={false}>
                  <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 24, fontWeight: 700 }}>Domain Scores</div>
                  {domains.map(d => (
                    <div key={d.label} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>{d.label}</span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{d.v}</span>
                      </div>
                      <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.07)" }}>
                        <div style={{ height: "100%", width: `${d.v}%`, background: d.color, borderRadius: 2, boxShadow: `0 0 10px ${d.color}55`, transition: "width 1s ease" }} />
                      </div>
                    </div>
                  ))}
                </DarkCard>
              </div>

              {/* Neural Pattern Anomaly row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 16 }}>
                {[
                  { key: "alzheimers", label: "Memory Deviation Index", icon: "🧩", color: PUR, desc: "Memory & recall pattern" },
                  { key: "dementia",   label: "Executive Drift Score",  icon: "🌀", color: AMB, desc: "Attention & processing" },
                  { key: "parkinsons", label: "Motor Anomaly Index",    icon: "🎯", color: BLU, desc: "Motor coordination" },
                ].map(d => {
                  const prob  = Math.round((last[`${d.key}_risk`] || 0) * 100);
                  const level = last.risk_levels?.[d.key] || "Low";
                  const lvlColor    = level === "High" ? RED : level === "Moderate" ? AMB : T.green;
                  const statusLabel = level === "High" ? "Worth Monitoring" : level === "Moderate" ? "Some Variation" : "Typical Range";
                  return (
                    <DarkCard key={d.key} style={{ padding: 22, border: `1px solid ${d.color}20` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 20 }}>{d.icon}</span>
                          <div>
                            <div style={{ fontWeight: 700, color: "#fff", fontSize: 13 }}>{d.label}</div>
                            <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>{d.desc}</div>
                          </div>
                        </div>
                        <span style={{ background: `${lvlColor}18`, color: lvlColor, padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, border: `1px solid ${lvlColor}33` }}>{statusLabel}</span>
                      </div>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: 40, color: d.color, lineHeight: 1 }}>{prob}<span style={{ fontSize: 16, color: "#555" }}>%</span></div>
                      <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)", marginTop: 12 }}>
                        <div style={{ height: "100%", width: `${prob}%`, background: d.color, borderRadius: 2 }} />
                      </div>
                    </DarkCard>
                  );
                })}
              </div>

              {/* View Results CTA */}
              <DarkCard style={{ padding: 28, display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${LIME}28` }} hover={false}>
                <div>
                  <div style={{ color: LIME, fontWeight: 700, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>● Latest session</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: "clamp(16px,2vw,22px)", color: "#fff", marginBottom: 4, letterSpacing: "-0.5px" }}>
                    View full neural pattern report
                  </div>
                  <div style={{ color: "#555", fontSize: 13 }}>Explainability · Risk drivers · Wellness recommendations</div>
                </div>
                <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                  <Btn onClick={() => setPage("results")} style={{ fontSize: 13 }}>View Report →</Btn>
                  <Btn variant="ghost" onClick={() => setPage("progress")} style={{ fontSize: 13 }}>📈 Progress</Btn>
                </div>
              </DarkCard>

              {/* ── Previous Results History ── */}
              {displayResults.length > 1 && (
                <DarkCard style={{ padding: 24, marginTop: 16, border: `1px solid rgba(255,255,255,0.07)` }} hover={false}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>
                      📅 Previous Sessions ({displayResults.length - 1})
                    </div>
                    <button
                      onClick={() => setShowHistory(h => !h)}
                      style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 12px", color: "#888", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
                    >
                      {showHistory ? "Hide" : "Show"}
                    </button>
                  </div>
                  {showHistory && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[...displayResults].reverse().slice(1).map((r, i) => {
                        const score = Math.round([r.speech_score, r.memory_score, r.reaction_score, r.executive_score, r.motor_score].reduce((a, b) => a + b, 0) / 5);
                        const date  = new Date(r.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                        const rl    = Object.values(r.risk_levels || {}).includes("High") ? "High" : Object.values(r.risk_levels || {}).includes("Moderate") ? "Moderate" : "Low";
                        const rlColor = rl === "High" ? RED : rl === "Moderate" ? AMB : LIME;
                        return (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <div style={{ width: 44, height: 44, borderRadius: 11, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: 18, color: "#fff", flexShrink: 0 }}>{score}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>{date}</div>
                              <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                                {[
                                  { l: "S", v: Math.round(r.speech_score), c: RED },
                                  { l: "M", v: Math.round(r.memory_score), c: BLU },
                                  { l: "R", v: Math.round(r.reaction_score), c: AMB },
                                  { l: "E", v: Math.round(r.executive_score), c: PUR },
                                  { l: "Mo", v: Math.round(r.motor_score), c: LIME },
                                ].map(d => (
                                  <span key={d.l} style={{ fontSize: 11, color: d.c, fontWeight: 700 }}>{d.l}:{d.v}</span>
                                ))}
                              </div>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: `${rlColor}12`, color: rlColor, border: `1px solid ${rlColor}25`, flexShrink: 0 }}>{rl}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </DarkCard>
              )}
            </>
          )}

          {/* ── No data empty state ── */}
          {!hasData && (
            <DarkCard style={{ padding: 40, textAlign: "center", border: `1px solid ${LIME}15` }} hover={false}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>📊</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: 20, color: "#fff", marginBottom: 8 }}>
                Your dashboard will populate here
              </div>
              <p style={{ color: "#555", fontSize: 13, maxWidth: 380, margin: "0 auto", lineHeight: 1.7 }}>
                Complete your first 5-test assessment above to see your cognitive score, domain breakdown, and neural pattern analysis.
              </p>
            </DarkCard>
          )}
        </>
      )}
    </div>
  );
}