/**
 * AssessmentContext v5
 * Holds raw data from all 5 test modules + API response.
 * ALL test data is mirrored to sessionStorage so it survives any
 * component remount, context re-creation, or React reconciliation quirk.
 * Persists final results to Firebase Firestore for cross-device access.
 */
import { createContext, useContext, useState, useCallback } from "react";
import { db } from "../firebase";
import {
  collection, addDoc, query, where, orderBy, getDocs, serverTimestamp,
} from "firebase/firestore";

const Ctx = createContext(null);

// ── sessionStorage helpers ────────────────────────────────────────────────────
const SS_KEYS = {
  speech:   "na_speechData",
  memory:   "na_memoryData",
  reaction: "na_reactionData",
  stroop:   "na_stroopData",
  tap:      "na_tapData",
};

function ssRead(key) {
  try {
    const v = sessionStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}

function ssWrite(key, value) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage full — ignore */ }
}

function ssClear() {
  Object.values(SS_KEYS).forEach(k => sessionStorage.removeItem(k));
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AssessmentProvider({ children }) {
  // Hydrate from sessionStorage on first mount — survives any remount
  const [speechData,   setSpeechDataState]   = useState(() => ssRead(SS_KEYS.speech));
  const [memoryData,   setMemoryDataState]   = useState(() => ssRead(SS_KEYS.memory));
  const [reactionData, setReactionDataState] = useState(() => ssRead(SS_KEYS.reaction));
  const [stroopData,   setStroopDataState]   = useState(() => ssRead(SS_KEYS.stroop));
  const [tapData,      setTapDataState]      = useState(() => ssRead(SS_KEYS.tap));
  const [profile,      setProfile]           = useState(null);
  const [apiResult,    setApiResultRaw]      = useState(null);
  const [loading,      setLoading]           = useState(false);
  const [error,        setError]             = useState(null);
  const [savedResults, setSavedResults]      = useState([]);

  // Wrapped setters — always keep sessionStorage in sync
  const setSpeechData   = useCallback(v => { ssWrite(SS_KEYS.speech,   v); setSpeechDataState(v);   }, []);
  const setMemoryData   = useCallback(v => { ssWrite(SS_KEYS.memory,   v); setMemoryDataState(v);   }, []);
  const setReactionData = useCallback(v => { ssWrite(SS_KEYS.reaction, v); setReactionDataState(v); }, []);
  const setStroopData   = useCallback(v => { ssWrite(SS_KEYS.stroop,   v); setStroopDataState(v);   }, []);
  const setTapData      = useCallback(v => { ssWrite(SS_KEYS.tap,      v); setTapDataState(v);      }, []);

  const completedCount = [speechData, memoryData, reactionData, stroopData, tapData].filter(Boolean).length;

  // Save result to Firestore and update local cache
  const setApiResult = useCallback(async (result) => {
    setApiResultRaw(result);
    try {
      const user = JSON.parse(sessionStorage.getItem("neuroaid_user") || "{}");
      if (user?.id) {
        const doc = {
          userId: user.id,
          timestamp: serverTimestamp(),
          ...result,
        };
        await addDoc(collection(db, "results"), doc);
        setSavedResults(prev => [...prev, { ...result, timestamp: new Date().toISOString() }]);
      }
    } catch (e) {
      console.warn("Firestore save skipped:", e.message);
    }
  }, []);

  // Load historical results from Firestore for the current user
  const loadHistory = useCallback(async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem("neuroaid_user") || "{}");
      if (!user?.id) return [];
      const q = query(
        collection(db, "results"),
        where("userId", "==", user.id),
        orderBy("timestamp", "asc"),
      );
      const snap = await getDocs(q);
      const results = snap.docs.map(d => ({
        ...d.data(),
        id: d.id,
        timestamp: d.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
      }));
      setSavedResults(results);
      return results;
    } catch (e) {
      console.warn("Firestore load failed:", e.message);
      return [];
    }
  }, []);

  function reset() {
    setSpeechData(null); setMemoryData(null); setReactionData(null);
    setStroopData(null); setTapData(null);
    setApiResultRaw(null); setError(null);
    ssClear();
  }

  return (
    <Ctx.Provider value={{
      speechData,   setSpeechData,
      memoryData,   setMemoryData,
      reactionData, setReactionData,
      stroopData,   setStroopData,
      tapData,      setTapData,
      profile,      setProfile,
      apiResult,    setApiResult,
      loading,      setLoading,
      error,        setError,
      completedCount,
      reset,
      savedResults, setSavedResults,
      loadHistory,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAssessment = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAssessment must be inside AssessmentProvider");
  return ctx;
};