import { useState } from "react";
import { injectStyles } from "./utils/theme";
import { Shell } from "./components/RiskDashboard";
import { AssessmentProvider } from "./context/AssessmentContext";
import { getUser, isLoggedIn, logout } from "./services/api";

import LandingPage     from "./pages/LandingPage";
import AboutPage       from "./pages/AboutPage";
import LoginPage       from "./pages/Login";
import ProfileSetup    from "./pages/ProfileSetup";
import UserDashboard   from "./pages/UserDashboard";
import AssessmentHub   from "./pages/AssessmentHub";
import ResultsPage     from "./pages/ResultsPage";
import ProgressPage    from "./pages/ProgressPage";
import DoctorDashboard from "./pages/DoctorDashboard";
import MessagesPage    from "./pages/MessagesPage";
import DoctorHome      from "./pages/DoctorHome";
import PatientDetail   from "./pages/PatientDetail";
import ContentManager  from "./pages/ContentManager";
import DoctorSelection from "./pages/DoctorSelection";

import SpeechTest   from "./components/SpeechTest";
import MemoryTest   from "./components/MemoryTest";
import ReactionTest from "./components/ReactionTest";
import StroopTest   from "./components/StroopTest";
import TapTest      from "./components/TapTest";

injectStyles();

function getInitialState() {
  const user = getUser();
  if (user && isLoggedIn()) {
    const role = user.role === "doctor" ? "doctor" : "user";
    const view = role === "doctor" ? "doctor-dashboard" : "dashboard";
    const page = role === "doctor" ? "doctor-dashboard" : "dashboard";
    return { view, role, page, user };
  }
  return { view: "landing", role: "user", page: "dashboard", user: null };
}

export default function App() {
  const init = getInitialState();

  const [view,           setViewState]      = useState(init.view);
  const [role,           setRole]           = useState(init.role);
  const [page,           setPage]           = useState(init.page);
  const [patient,        setPatient]        = useState(null);
  const [currentUser,    setCurrentUser]    = useState(init.user);
  // Profile setup — shown once after first registration for patients
  const [showProfile,    setShowProfile]    = useState(false);
  const [pendingUser,    setPendingUser]     = useState(null);
  const [pendingRole,    setPendingRole]     = useState(null);

  async function handleLogout() {
    await logout();
    setCurrentUser(null);
    setRole("user");
    setPage("dashboard");
    setViewState("landing");
    setShowProfile(false);
  }

  function setView(v) {
    if (v === "logout") { handleLogout(); return; }
    if (v === "dashboard")        { setPage("dashboard");        }
    if (v === "doctor-dashboard") { setPage("doctor-dashboard"); }
    setViewState(v);
  }

  // Called by LoginPage after successful login or registration
  function handleAuthSuccess(user, resolvedRole, isNewUser = false) {
    setCurrentUser(user);
    const r = resolvedRole === "doctor" ? "doctor" : "user";
    setRole(r);
    // Show profile setup only for new patient registrations
    if (isNewUser && r === "user") {
      setPendingUser(user);
      setPendingRole(r);
      setShowProfile(true);
    } else {
      setViewState(r === "doctor" ? "doctor-dashboard" : "dashboard");
      setPage(r === "doctor" ? "doctor-dashboard" : "dashboard");
    }
  }

  function handleProfileComplete() {
    setShowProfile(false);
    const r = pendingRole || "user";
    setRole(r);
    setViewState("dashboard");
    setPage("dashboard");
  }

  // ── Profile Setup screen (after new patient registration) ────────────────
  if (showProfile) {
    return (
      <ProfileSetup
        user={pendingUser || currentUser}
        onComplete={handleProfileComplete}
      />
    );
  }

  // ── Pre-auth screens ──────────────────────────────────────────────────────
  if (view === "landing") return <LandingPage setView={setView} currentUser={currentUser} />;
  if (view === "about")   return <AboutPage   setView={setView} />;
  if (view === "login")   return (
    <LoginPage
      setView={setView}
      setRole={r => setRole(r === "doctor" ? "doctor" : "user")}
      setCurrentUser={setCurrentUser}
      onAuthSuccess={handleAuthSuccess}
    />
  );

  // ── Render active page ────────────────────────────────────────────────────
  // IMPORTANT: Use a function — NOT an object literal — so only the active
  // page is mounted. An object literal instantiates ALL pages on every render,
  // which unmounts/remounts tests and wipes their local state before
  // AssessmentContext can receive the data (Speech=0, Reaction=0 bug).
  function renderPage(p) {
    if (role === "doctor") {
      switch (p) {
        case "doctor-dashboard": return <DoctorHome      setPage={setPage} setSelectedPatient={setPatient} />;
        case "patients":         return <DoctorDashboard setPage={setPage} setSelectedPatient={setPatient} />;
        case "patient-detail":   return <PatientDetail   setPage={setPage} patient={patient} />;
        case "messages":         return <MessagesPage />;
        case "content":          return <ContentManager />;
        default:                 return <DoctorHome      setPage={setPage} setSelectedPatient={setPatient} />;
      }
    }
    switch (p) {
      case "dashboard":   return <UserDashboard   setPage={setPage} />;
      case "assessments": return <AssessmentHub   setPage={setPage} />;
      case "speech":      return <SpeechTest      setPage={setPage} />;
      case "memory":      return <MemoryTest      setPage={setPage} />;
      case "reaction":    return <ReactionTest    setPage={setPage} />;
      case "stroop":      return <StroopTest      setPage={setPage} />;
      case "tap":         return <TapTest         setPage={setPage} />;
      case "results":     return <ResultsPage     setPage={setPage} />;
      case "progress":    return <ProgressPage    setPage={setPage} />;
      case "messages":    return <MessagesPage />;
      case "doctors":     return <DoctorSelection setPage={setPage} />;
      default:            return <UserDashboard   setPage={setPage} />;
    }
  }

  return (
    <AssessmentProvider>
      <Shell role={role} page={page} setPage={setPage} setView={setView}
        currentUser={currentUser} onLogout={handleLogout}>
        {renderPage(page)}
      </Shell>
    </AssessmentProvider>
  );
}
