/**
 * NeuroBot — NeuroSaathi's built-in assistant
 * 100% offline knowledge base — no API calls, no failures.
 * All answers derived directly from the actual codebase.
 */
import { useState, useRef, useEffect } from "react";

const RED  = "#e84040";
const PUR  = "#a78bfa";
const GRN  = "#4ade80";
const AMB  = "#f59e0b";
const BLU  = "#60a5fa";
const LIME = "#C8F135";

// ══════════════════════════════════════════════════════════════════════════════
// KNOWLEDGE BASE — built directly from the codebase
// ══════════════════════════════════════════════════════════════════════════════
const KB = [
  // ── PLATFORM ────────────────────────────────────────────────────────────────
  {
    triggers: ["what is neurosaa", "about neurosaa", "what does neurosaa do", "tell me about", "overview of", "what is mindsaa"],
    answer: "NeuroSaathi (also called MindSaathi) is a neurological health monitoring platform. It runs 5 cognitive tests — Speech Analysis, Memory Test, Reaction Time, Stroop Test, and Motor Tap Test — and uses AI to compute scores across 5 brain domains. It tracks your cognitive health over time and connects you with neurologists.",
    chips: ["How does the AI work?", "What are the 5 tests?", "Is my data private?"],
  },
  {
    triggers: ["who can use", "who is it for", "who should use", "is it for me"],
    answer: "NeuroSaathi is for adults who want to proactively monitor brain health — especially people with a family history of neurological conditions, older adults, caregivers, and patients working with a neurologist. It's not a replacement for clinical diagnosis.",
    chips: ["How do I get started?", "What are the 5 tests?", "How do I find a doctor?"],
  },
  {
    triggers: ["how does the ai", "how does it work", "ai work", "machine learning", "how are scores calculated", "how is score calculated"],
    answer: "The AI analyzes 18 features collected across your 5 tests. It computes domain scores (0–100) for Speech, Memory, Reaction, Executive function, and Motor control. It also calculates three risk indices — Memory Deviation Index (Alzheimer's pattern), Executive Drift Score (dementia pattern), and Motor Anomaly Index (Parkinson's pattern). All processing happens on the backend server.",
    chips: ["What do the scores mean?", "What is the risk index?", "How often should I test?"],
  },
  {
    triggers: ["privacy", "data safe", "is my data", "who can see", "data stored", "secure", "confidential"],
    answer: "Your assessment data is stored securely on the backend server in a local JSON file. It is only shared with doctors you explicitly enroll with — and only after the doctor approves your enrollment request. NeuroSaathi never sells your data. Your doctor can only view your results once you're enrolled and approved.",
    chips: ["How do I enroll with a doctor?", "Can my doctor see my results?", "How does enrollment work?"],
  },

  // ── GETTING STARTED ─────────────────────────────────────────────────────────
  {
    triggers: ["how do i get started", "how to start", "first time", "new user", "where to begin", "how to use"],
    answer: "Getting started: 1) Register as a Patient from the login page. 2) After registration you'll be prompted to fill in your clinical profile (age, medical history, etc.) — this improves your analysis accuracy. 3) Go to Overview → Cognitive Assessments → complete all 5 tests. 4) Click 'Submit & Get Neural Pattern Analysis' to see your results. 5) Optionally go to My Doctor in the sidebar to enroll with a neurologist.",
    chips: ["What are the 5 tests?", "How do I enroll with a doctor?", "What do the scores mean?"],
  },
  {
    triggers: ["register", "sign up", "create account", "how to login", "how to register"],
    answer: "Click 'Get Started' on the landing page. Choose your role — Patient or Doctor. Fill in your name, email, and password. After registering as a Patient, you'll be taken through a Profile Setup screen to enter clinical details like age, medical history, medications, and sleep habits. These details improve your assessment accuracy.",
    chips: ["How do I get started?", "What are the 5 tests?", "How do I find a doctor?"],
  },

  // ── THE 5 TESTS ─────────────────────────────────────────────────────────────
  {
    triggers: ["what are the 5 tests", "list of tests", "all tests", "which tests", "assessment tests", "what tests"],
    answer: "NeuroSaathi runs 5 cognitive tests:\n1. 🎙️ Speech Analysis (~2 min) — measures WPM, pauses, rhythm\n2. 🧠 Memory Test (~3 min) — tests word recall, pattern memory, delayed recall\n3. ⚡ Reaction Time (~2 min) — measures response speed, miss count, initiation delay\n4. 🎨 Stroop Test (~2 min) — measures color-word interference and executive control\n5. 🥁 Motor Tap Test (~1 min) — measures rhythmic motor consistency\nTotal time: ~10 minutes. Complete all 5 to unlock your full neural pattern analysis.",
    chips: ["What do the scores mean?", "How do I submit my results?", "How often should I test?"],
  },
  {
    triggers: ["speech", "speech analysis", "speech test", "speech score", "wpm", "pause"],
    answer: "The Speech Analysis test (~2 min) records your speech and measures: Words Per Minute (WPM), speech speed variability, pause ratio, completion ratio, restart count, and speech start delay. It detects word-finding difficulty and rhythm changes that can be early indicators of cognitive load. Accent, language background, and reading speed affect this score.",
    chips: ["What does my speech score mean?", "How do I improve my score?", "What are the 5 tests?"],
  },
  {
    triggers: ["memory test", "memory score", "recall", "word recall", "pattern memory", "delayed recall"],
    answer: "The Memory Test (~3 min) measures: word recall accuracy, pattern accuracy, delayed recall accuracy, recall latency (seconds), order match ratio, and intrusion count (wrong words recalled). It scores your short-term and working memory. Scores vary daily with sleep, stress, and hydration — trends across sessions matter more than a single result.",
    chips: ["What does my memory score mean?", "What is the Memory Deviation Index?", "How often should I test?"],
  },
  {
    triggers: ["reaction", "reaction time", "reaction test", "reaction score", "response speed"],
    answer: "The Reaction Time test (~2 min) measures your response speed to visual stimuli. It records individual reaction times (ms), miss count, and initiation delay. Normal web-based reaction times are 250–700ms. Age, caffeine, fatigue, and distraction all affect results. The AI adjusts scoring context based on your profile.",
    chips: ["What does my reaction score mean?", "How do I improve reaction time?", "What are all 5 tests?"],
  },
  {
    triggers: ["stroop", "stroop test", "executive", "color word", "executive score", "cognitive flexibility"],
    answer: "The Stroop Test (~2 min) measures executive function — your brain's ability to suppress automatic responses. You must name the ink color of a word, not read the word itself (e.g., the word 'RED' printed in blue — correct answer is 'blue'). The test records total trials, error count, mean reaction time, and incongruent RT. First-time takers often score lower as the task is unfamiliar.",
    chips: ["What does my executive score mean?", "What is the Stroop interference effect?", "What are all 5 tests?"],
  },
  {
    triggers: ["tap", "tap test", "motor tap", "motor test", "motor score", "tapping"],
    answer: "The Motor Tap Test (~1 min) asks you to tap rhythmically. It measures tap intervals and tap count to assess rhythmic motor consistency. High interval variability may reflect hand fatigue, distraction, or motor timing changes. Parkinson's research shows rhythm irregularity is an early motor signal worth monitoring over time.",
    chips: ["What is the Motor Anomaly Index?", "What does my motor score mean?", "What are all 5 tests?"],
  },

  // ── HOW TO DO ASSESSMENT ────────────────────────────────────────────────────
  {
    triggers: ["how to do assessment", "how to take test", "how to complete", "how to run test", "start assessment", "begin test"],
    answer: "To complete an assessment: 1) Go to Overview in the sidebar. 2) Open 'Cognitive Assessments' section — you'll see 5 test rows. 3) Click 'Start →' on each test (Speech, Memory, Reaction, Stroop, Motor Tap). 4) Complete each test — a green '✓ Done' badge appears when finished. 5) The progress bar shows X/5 tests complete. 6) Once all 5 are done, the submit button turns green — click 'Submit & Get Neural Pattern Analysis'. 7) Your results appear on the Results page.",
    chips: ["What are the 5 tests?", "What do the scores mean?", "How do I view my results?"],
  },
  {
    triggers: ["submit", "how to submit", "submit results", "unlock analysis", "complete tests"],
    answer: "After completing all 5 tests, the 'Submit & Get Neural Pattern Analysis' button activates (turns green). Click it to send your data to the AI backend, which analyzes 18 features and returns your domain scores, risk indices, and recommendations. Results are saved automatically and appear on the Results page.",
    chips: ["What do the scores mean?", "How do I view my results?", "How often should I test?"],
  },
  {
    triggers: ["how to view results", "where are my results", "results page", "see my results", "view report"],
    answer: "Your results appear in two places: 1) The Overview dashboard shows your latest overall score, domain scores bar chart, and the 3 risk indices. 2) Click 'View Report →' or go to the Results page in the sidebar for the full neural pattern report with explanations, risk drivers, and wellness recommendations. The Progress page shows trends across all your sessions.",
    chips: ["What do the scores mean?", "How do I track progress?", "What is the risk index?"],
  },

  // ── SCORES & RESULTS ────────────────────────────────────────────────────────
  {
    triggers: ["what do scores mean", "what does score mean", "score range", "score scale", "healthy score", "score meaning", "interpret score"],
    answer: "All scores are on a 0–100 scale where higher = healthier. Score tiers:\n• 70–100 = Healthy Range ✓\n• 50–69 = Within Normal Variation\n• 0–49 = Worth Monitoring ⚠️\nYour Overall Score is the average of all 5 domain scores. Individual scores fluctuate daily — focus on trends across multiple sessions, not a single result.",
    chips: ["What are domain scores?", "What is the risk index?", "How often should I test?"],
  },
  {
    triggers: ["domain score", "5 domains", "five domains", "what are domain"],
    answer: "The 5 domain scores are:\n• 🔴 Speech — fluency, rhythm, word-finding\n• 🔵 Memory — recall accuracy and speed\n• 🟡 Reaction — processing speed and attention\n• 🟣 Executive — cognitive flexibility and control\n• 🟢 Motor — rhythmic motor consistency\nEach is scored 0–100. They're shown as bars on your dashboard and tracked over time in the Progress page.",
    chips: ["What do the scores mean?", "What is the risk index?", "How do I improve my scores?"],
  },
  {
    triggers: ["risk index", "risk level", "risk score", "alzheimer", "dementia", "parkinson", "neural pattern"],
    answer: "NeuroSaathi calculates 3 neural pattern risk indices:\n• 🧩 Memory Deviation Index — based on memory and recall patterns (Alzheimer's research)\n• 🌀 Executive Drift Score — based on attention and processing patterns (dementia research)\n• 🎯 Motor Anomaly Index — based on motor timing patterns (Parkinson's research)\nEach shows a % and a level: Low (Typical Range), Moderate (Some Variation), or High (Worth Monitoring). These are NOT diagnoses — they flag patterns worth discussing with a neurologist.",
    chips: ["When should I see a neurologist?", "What do the scores mean?", "How does the AI work?"],
  },
  {
    triggers: ["why did my score", "score dropped", "score changed", "score lower", "score higher", "score different"],
    answer: "Scores vary between sessions due to: sleep quality the night before, time of day, stress levels, caffeine or alcohol intake, illness, test familiarity (first-time takers score lower), and distractions during the test. A one-session change is normal. If you see a consistent downward trend over 3+ sessions, discuss it with a neurologist.",
    chips: ["How often should I test?", "How do I track progress?", "When should I see a neurologist?"],
  },
  {
    triggers: ["how often", "retake", "frequency", "when to retest", "test again", "monthly"],
    answer: "Recommended: take the full 5-test assessment once a month for meaningful trend data. Avoid testing immediately after poor sleep, illness, or heavy alcohol use — these temporarily lower scores and don't reflect your true baseline. Consistent monthly testing gives the AI enough data to detect real trends.",
    chips: ["How do I track progress?", "What do the scores mean?", "When should I see a neurologist?"],
  },
  {
    triggers: ["track progress", "progress page", "progress chart", "trend", "history", "over time", "previous sessions"],
    answer: "Go to the Progress page (↗ in sidebar) to see your score trends over time. The Overview dashboard also shows a mini 7-session trend chart. On the dashboard, scroll down past the current scores to see 'Previous Sessions' — click 'Show' to expand your full session history with per-domain scores and risk levels.",
    chips: ["How often should I test?", "What do the scores mean?", "How do I view my results?"],
  },
  {
    triggers: ["improve score", "better score", "improve brain", "brain health tips", "improve memory", "improve reaction", "improve cognitive"],
    answer: "Science-backed ways to improve cognitive scores:\n• 😴 Sleep 7–9 hours — memory consolidation happens during sleep\n• 🏃 Exercise 150 min/week aerobic — increases BDNF (brain growth factor)\n• 🥗 Mediterranean diet — linked to lower dementia risk\n• 🧩 Cognitive challenges — reading, puzzles, learning new skills\n• 👥 Social engagement — protective against cognitive decline\n• 💧 Stay hydrated — dehydration reduces concentration scores\n• 🚭 Avoid smoking and limit alcohol\nConsistent monthly testing on NeuroSaathi helps you see what's working.",
    chips: ["How often should I test?", "When should I see a neurologist?", "What do the scores mean?"],
  },

  // ── DOCTORS ─────────────────────────────────────────────────────────────────
  {
    triggers: ["how to find doctor", "find a neurologist", "nearest doctor", "find nearest", "find doctor", "look for doctor"],
    answer: "Go to My Doctor in the sidebar (🩺). At the bottom of the page you'll find the 🧭 'Find Nearest Neurologist' feature — it uses your GPS location and your health profile to recommend nearby neurology specialists personalized to your condition. Click 'Find Doctors', allow location access, and the AI will suggest 3–4 specialists with addresses, phone numbers, Maps links, and appointment tips.",
    chips: ["How do I enroll with a doctor?", "Can my doctor see my results?", "How do I message my doctor?"],
  },
  {
    triggers: ["how to enroll", "enroll with doctor", "request doctor", "send request", "choose doctor", "select doctor"],
    answer: "To enroll with a doctor: 1) Click 'My Doctor' in the sidebar (🩺). 2) Browse the doctor list — you can see their specialty, hospital, and current patient capacity. 3) Click 'Request →' next to the doctor you want. 4) Your request goes to the doctor as a pending enrollment. 5) Wait for the doctor to approve — you'll see '⏳ Requested' status. 6) Once approved, the doctor appears as 'Your Assigned Doctor' and can view all your assessment data.",
    chips: ["What happens after enrollment?", "Can my doctor see my results?", "How do I message my doctor?"],
  },
  {
    triggers: ["what happens after enroll", "after approval", "doctor approved", "once enrolled", "enrollment approved"],
    answer: "After your doctor approves your enrollment: 1) They appear as 'Your Assigned Doctor' on the My Doctor page. 2) They can see your full assessment history, domain scores, and neural pattern reports from their Doctor Dashboard. 3) You can now message each other through the Messages page. 4) Your doctor can monitor your progress over time and contact you with recommendations.",
    chips: ["Can my doctor see my results?", "How do I message my doctor?", "How do I track progress?"],
  },
  {
    triggers: ["can my doctor see", "doctor access", "doctor view", "results visible to doctor", "doctor see my data"],
    answer: "Yes — but only after you request enrollment AND the doctor approves it. Once enrolled, your doctor can see: your full assessment history across all sessions, all 5 domain scores per session, the 3 neural pattern risk indices, and the overall cognitive trend chart. They access this from their Doctor Dashboard → Patients list → your patient card.",
    chips: ["How does enrollment work?", "How do I message my doctor?", "Is my data private?"],
  },
  {
    triggers: ["pending", "request pending", "enrollment pending", "waiting for doctor", "doctor not approved"],
    answer: "An '⏳ Requested' or 'Pending' status means your enrollment request has been sent but the doctor hasn't approved it yet. You'll see this on the My Doctor page. Once the doctor logs into their dashboard and approves you from the Pending Requests section, your status changes to 'Your Assigned Doctor' and messaging becomes available.",
    chips: ["How long does approval take?", "How do I message my doctor?", "How do I find a different doctor?"],
  },
  {
    triggers: ["doctor full", "capacity full", "doctor capacity", "no slots", "max patients"],
    answer: "Each doctor sets a maximum patient capacity (default: 10 patients). If the capacity bar shows 'Full', that doctor cannot accept new patients. Choose a different doctor from the list. The capacity bar shows current/max patients — e.g., 7/10 means 3 slots remain.",
    chips: ["How do I find a doctor?", "How do I enroll with a doctor?", "Find Nearest Neurologist"],
  },

  // ── MESSAGING ───────────────────────────────────────────────────────────────
  {
    triggers: ["how to message", "message doctor", "contact doctor", "chat with doctor", "send message to doctor", "how to chat"],
    answer: "To message your doctor: 1) You must first be enrolled and approved (see 'How do I enroll with a doctor?'). 2) Go to Messages (✉) in the sidebar. 3) Your enrolled doctor appears in the conversations list. 4) Click their name to open the chat. 5) Type your message and press Enter or click 'Send →'. Messages refresh automatically every 4 seconds. You can also click '✏️ New' to start a fresh conversation.",
    chips: ["How do I enroll with a doctor?", "Can my doctor message me?", "How does messaging work?"],
  },
  {
    triggers: ["can doctor message me", "doctor send message", "doctor contact me", "receive message"],
    answer: "Yes — once enrolled and approved, your doctor can send you messages directly from their Doctor Dashboard. You'll see unread message counts as a badge on the Messages icon in the sidebar (updates every 8 seconds). Open the Messages page to read and reply.",
    chips: ["How do I message my doctor?", "How do I see my messages?", "How does enrollment work?"],
  },
  {
    triggers: ["messages page", "how messages work", "messaging system", "delete message", "message history"],
    answer: "The Messages page has two panels: Left panel — your conversation list showing all chats with doctors/patients, timestamps, and last message preview. Right panel — the active chat thread with real-time message updates (polls every 4 seconds). You can delete your own messages by hovering over them and clicking ✕. Click '✏️ New' to start a conversation with any enrolled doctor.",
    chips: ["How do I message my doctor?", "Can my doctor see my results?", "How do I enroll with a doctor?"],
  },

  // ── DOCTOR ROLE ─────────────────────────────────────────────────────────────
  {
    triggers: ["i am a doctor", "doctor account", "doctor dashboard", "how doctors use", "doctor role", "doctor features"],
    answer: "Doctors have a separate login panel. After registering as a Doctor (with license number, specialization, hospital, location), you get access to: Doctor Dashboard — overview of enrolled patients. Patients page — list of all your approved patients with their latest assessment results. Pending Requests — approve or reject patient enrollment requests. Messages — chat with your patients. Content — manage educational content.",
    chips: ["How do doctors approve patients?", "How do doctors view patient results?", "How does doctor messaging work?"],
  },
  {
    triggers: ["how doctor approve", "approve patient", "reject patient", "pending requests", "doctor pending"],
    answer: "As a doctor: 1) Go to your Doctor Dashboard or Patients page. 2) You'll see a 'Pending Requests' section with patients who've requested enrollment. 3) Click 'Approve' to add them to your patient list, or 'Reject' to decline. 4) Approved patients immediately appear in your patient list and can now message you. 5) Their full assessment history becomes visible to you.",
    chips: ["How do doctors view patient results?", "How does doctor messaging work?", "What can doctors see?"],
  },
  {
    triggers: ["doctor view patient", "how doctor sees results", "patient results", "doctor see patient data"],
    answer: "From the Patients page, click on any patient's name to open their Patient Detail page. You'll see: their profile info (age, gender, medical history), all past assessment sessions, domain scores for each session, neural pattern risk indices, and cognitive trend over time. You can also message the patient directly from this page.",
    chips: ["How does doctor messaging work?", "How do doctors approve patients?", "What can doctors see?"],
  },

  // ── TECHNICAL ───────────────────────────────────────────────────────────────
  {
    triggers: ["how data saved", "where data saved", "data storage", "backend", "how stored", "firebase", "database"],
    answer: "NeuroSaathi uses two storage layers: 1) Backend (primary) — a FastAPI Python server stores all data in local JSON files (users.json, sessions.json, results.json) on the server. 2) Firebase Firestore (secondary) — doctor profiles are synced to Firebase for cross-device access. Assessment results are also saved to Firebase via AssessmentContext for offline access. Session tokens are stored in your browser's sessionStorage.",
    chips: ["Is my data private?", "How does the AI work?", "What happens if I switch devices?"],
  },
  {
    triggers: ["switch device", "different device", "cross device", "another browser", "log out log in"],
    answer: "Your account data (profile, results, doctor assignments) is stored on the backend server and synced to Firebase. When you log in from a different device, your past assessment history and doctor enrollment will be available. Note: your current session's unsaved test progress lives in browser memory and won't transfer between devices or page refreshes.",
    chips: ["How is my data stored?", "Is my data private?", "How do I get started?"],
  },
  {
    triggers: ["session token", "stay logged in", "logout", "sign out", "session expire"],
    answer: "Your login session is stored in browser sessionStorage (not localStorage, so it clears when you close the browser tab). Click '← Sign out' at the bottom of the sidebar to log out manually. Session tokens are securely generated and stored on the backend — logging out invalidates the token immediately.",
    chips: ["Is my data private?", "How do I register?", "How does data storage work?"],
  },

  // ── NAVIGATION ──────────────────────────────────────────────────────────────
  {
    triggers: ["how to navigate", "sidebar", "menu", "navigation", "pages", "what pages"],
    answer: "The sidebar has these pages (for patients):\n• ◆ Overview — your dashboard with scores and assessment launcher\n• ◉ Assessments — expand to access all 5 individual tests\n• ◆ Results — full neural pattern report\n• ↗ Progress — score trends over time\n• ✉ Messages — chat with your doctor\n• 🩺 My Doctor — find, enroll with, and manage your neurologist\nClick the logo to go back to the dashboard.",
    chips: ["How do I get started?", "How do I do an assessment?", "How do I find a doctor?"],
  },

  // ── NEUROBOT ITSELF ─────────────────────────────────────────────────────────
  {
    triggers: ["what can you do", "what can neurobot", "help me", "what are you", "who are you", "hi", "hello", "hey"],
    answer: "Hi! I'm NeuroBot 🧠 — NeuroSaathi's built-in guide. I can answer questions about:\n• How to use the platform and navigate it\n• What each of the 5 cognitive tests measures\n• How to read your scores and risk indices\n• How to find and enroll with a neurologist\n• How to message your doctor\n• How your data is stored and kept private\n• Brain health tips to improve your scores\nSelect a topic below or just ask me anything!",
    chips: ["How do I get started?", "What are the 5 tests?", "How do I find a doctor?"],
  },
  {
    triggers: ["cognitive decline", "what is cognitive", "brain decline", "memory decline"],
    answer: "Cognitive decline refers to a gradual decrease in brain function including memory, attention, processing speed, and executive function. It ranges from normal age-related changes to Mild Cognitive Impairment (MCI) and dementia. Early detection through consistent monitoring is key — NeuroSaathi's monthly assessments are designed to catch meaningful changes early so you can act on them.",
    chips: ["When should I see a neurologist?", "What is the risk index?", "How often should I test?"],
  },
  {
    triggers: ["when should i see", "see a neurologist", "visit a doctor", "consult doctor", "need a doctor", "doctor urgently"],
    answer: "Consider seeing a neurologist if: your risk indices are flagged as 'High' or 'Worth Monitoring', you see a consistent downward trend over 3+ sessions, you experience symptoms like memory lapses, word-finding difficulty, unusual slowness, coordination changes, or if family members notice behavioral changes. Use the 🧭 'Find Nearest Neurologist' feature on the My Doctor page to find specialists near you.",
    chips: ["How do I find a doctor?", "What is the risk index?", "How do I track progress?"],
  },
  {
    triggers: ["diagnosis", "is this a diagnosis", "can neuro diagnose", "medical advice", "clinical"],
    answer: "NeuroSaathi is NOT a diagnostic tool and cannot provide a medical diagnosis. It identifies cognitive performance patterns and flags trends for monitoring. For any clinical concerns about Alzheimer's, dementia, Parkinson's, or other neurological conditions, always consult a qualified neurologist. The 'Find Nearest Neurologist' feature on the My Doctor page can help you find one.",
    chips: ["What is the risk index?", "When should I see a neurologist?", "How do I find a doctor?"],
  },
];

// ── Topic categories for initial menu ────────────────────────────────────────
const TOPICS = {
  "🧠 About the Platform": ["What is NeuroSaathi?", "How does the AI work?", "Is my data private?", "How do I get started?"],
  "📊 Scores & Results":   ["What do scores mean?", "What are the 5 domain scores?", "What is the risk index?", "Why did my score change?"],
  "🧪 The 5 Tests":        ["What are the 5 tests?", "How to do an assessment?", "How do I submit my results?", "How often should I test?"],
  "📈 Progress & History": ["How do I track progress?", "How to view my results?", "How do I improve my scores?", "How often should I test?"],
  "🩺 Find a Doctor":      ["How do I find a doctor?", "How do I enroll with a doctor?", "What happens after enrollment?", "What if a doctor is full?"],
  "💬 Messaging":          ["How do I message my doctor?", "Can my doctor message me?", "How does messaging work?", "How do I enroll with a doctor?"],
};

// ── Lookup answer from KB ─────────────────────────────────────────────────────
function lookup(question) {
  const q = question.toLowerCase().trim();
  for (const entry of KB) {
    if (entry.triggers.some(t => q.includes(t) || t.includes(q.slice(0, 12)))) {
      return entry;
    }
  }
  const words = q.split(/\s+/).filter(w => w.length > 3);
  let best = null, bestScore = 0;
  for (const entry of KB) {
    const score = entry.triggers.reduce((acc, t) => {
      const matches = words.filter(w => t.includes(w)).length;
      return acc + matches;
    }, 0);
    if (score > bestScore) { bestScore = score; best = entry; }
  }
  if (bestScore >= 2) return best;
  return null;
}

// ── Chip component ────────────────────────────────────────────────────────────
function Chip({ label, onClick, color = PUR, small = false }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={() => onClick(label)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: small ? "4px 10px" : "5px 12px", borderRadius: 20,
        border: `1px solid ${hov ? color + "66" : color + "30"}`,
        background: hov ? `${color}18` : `${color}09`,
        color: hov ? "#f0ece3" : "rgba(240,236,227,0.65)",
        fontSize: small ? 10 : 11, cursor: "pointer",
        fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >{label}</button>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ msg, onChipClick }) {
  const isBot = msg.role === "bot";
  const lines = (msg.text || "").split("\n");
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: isBot ? "flex-start" : "flex-end", gap: 8, alignItems: "flex-end" }}>
        {isBot && (
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: `linear-gradient(135deg,${RED},${PUR})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, flexShrink: 0,
          }}>🧠</div>
        )}
        <div style={{
          maxWidth: "80%", padding: "10px 14px",
          borderRadius: isBot ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
          background: isBot ? "#1e1e1e" : `linear-gradient(135deg,${RED}cc,${PUR}cc)`,
          border: isBot ? "1px solid rgba(255,255,255,0.07)" : "none",
          color: "#f0ece3", fontSize: 13, lineHeight: 1.7, wordBreak: "break-word",
        }}>
          {lines.map((line, i) => (
            <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
          ))}
        </div>
      </div>
      {isBot && msg.chips?.length > 0 && onChipClick && (
        <div style={{ paddingLeft: 36, marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {msg.chips.map(c => <Chip key={c} label={c} onClick={onChipClick} color={PUR} small />)}
        </div>
      )}
    </div>
  );
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 12 }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${RED},${PUR})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🧠</div>
      <div style={{ padding: "10px 16px", background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px 16px 16px 16px", display: "flex", gap: 4, alignItems: "center" }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(240,236,227,0.3)", animation: `nbdot 1.2s ease-in-out ${i*0.2}s infinite` }} />
        ))}
      </div>
      <style>{`@keyframes nbdot{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1.1)}}`}</style>
    </div>
  );
}

// ── Welcome message ───────────────────────────────────────────────────────────
const WELCOME = {
  role: "bot",
  text: "Hi! I'm NeuroBot 🧠 — your NeuroSaathi guide. I know everything about how this platform works.\n\nChoose a topic to get started:",
  chips: Object.keys(TOPICS),
};

// ── Main component ────────────────────────────────────────────────────────────
export default function NeuroBot({ user }) {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [typing,   setTyping]   = useState(false);
  const [hasNew,   setHasNew]   = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, typing]);

  function respond(question) {
    if (TOPICS[question]) {
      setTyping(true);
      setTimeout(() => {
        setMessages(m => [...m, {
          role: "bot",
          text: `Here are questions about **${question.replace(/^.{2}\s/, "")}** — tap one:`,
          chips: TOPICS[question],
        }]);
        setTyping(false);
      }, 300);
      return;
    }

    setTyping(true);
    setTimeout(() => {
      const entry = lookup(question);
      if (entry) {
        setMessages(m => [...m, { role: "bot", text: entry.answer, chips: entry.chips || [] }]);
      } else {
        setMessages(m => [...m, {
          role: "bot",
          text: "I don't have a specific answer for that yet. Try selecting one of the topics below to explore what I know.",
          chips: Object.keys(TOPICS),
        }]);
      }
      setTyping(false);
    }, 400);
  }

  function handleChipClick(text) {
    if (typing) return;
    setMessages(m => [...m, { role: "user", text }]);
    respond(text);
  }

  function clearChat() { setMessages([WELCOME]); }
  function toggleOpen() { setOpen(o => !o); setHasNew(false); }

  return (
    <>
      {open && (
        <div style={{
          position: "fixed", bottom: 96, right: 24, zIndex: 1000,
          width: 370, height: 520,
          background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          boxShadow: `0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px ${RED}18`,
          display: "flex", flexDirection: "column", overflow: "hidden",
          animation: "nbSlide 0.22s ease",
        }}>

          {/* Header */}
          <div style={{
            padding: "14px 18px",
            background: `linear-gradient(135deg,${RED}18,${PUR}12)`,
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${RED},${PUR})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: `0 0 16px ${RED}44` }}>🧠</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: "#f0ece3", fontSize: 14 }}>NeuroBot</div>
              <div style={{ fontSize: 11, color: GRN, display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: GRN }} />
                Online · Always available
              </div>
            </div>
            <button onClick={clearChat}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(240,236,227,0.4)", cursor: "pointer", fontSize: 11, fontWeight: 600, padding: "4px 10px", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 4 }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#f0ece3"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(240,236,227,0.4)"; }}>
              🗑️ Clear
            </button>
            <button onClick={toggleOpen} style={{ background: "none", border: "none", color: "rgba(240,236,227,0.3)", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: "2px 4px" }}>×</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 14px", display: "flex", flexDirection: "column", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>
            {messages.map((m, i) => <Bubble key={i} msg={m} onChipClick={typing ? null : handleChipClick} />)}
            {typing && <TypingDots />}
            <div ref={bottomRef} />
          </div>

          {/* Disclaimer */}
          <div style={{ padding: "8px 14px", background: `${AMB}08`, borderTop: `1px solid ${AMB}15`, fontSize: 10, color: "rgba(240,236,227,0.25)", lineHeight: 1.5, flexShrink: 0 }}>
            ⚠️ Educational only — not a medical diagnosis. Consult a neurologist for medical decisions.
          </div>
        </div>
      )}

      {/* FAB */}
      <button onClick={toggleOpen} style={{
        position: "fixed", bottom: 28, right: 24, zIndex: 1001,
        width: 56, height: 56, borderRadius: "50%",
        background: open ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg,${RED},${PUR})`,
        border: open ? "1px solid rgba(255,255,255,0.15)" : "none",
        cursor: "pointer",
        boxShadow: open ? "none" : `0 8px 32px ${RED}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, transition: "all 0.25s", color: "#fff",
      }}>
        {open ? "×" : "🧠"}
        {hasNew && !open && <div style={{ position: "absolute", top: 4, right: 4, width: 10, height: 10, borderRadius: "50%", background: GRN, border: "2px solid #0a0a0a" }} />}
      </button>

      <style>{`
        @keyframes nbSlide { from{opacity:0;transform:translateY(14px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>
    </>
  );
}