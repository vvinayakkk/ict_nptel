import { useEffect, useRef, useState } from "react";
import data from "./assets/data.json";
import QuestionCard from "./components/QuestionCard";
import Header from "./components/Header";
import useKeyboard from "./hooks/useKeyboard";
import StatsCard from "./components/StatsCard";

import { shuffleIndices, loadState, saveState } from "./utils";

const ANSWER_GOOD_AUDIO = Object.values(import.meta.glob("./audio/good/*", { eager: true, import: "default" }));
const ANSWER_BAD_AUDIO = Object.values(import.meta.glob("./audio/bad/*", { eager: true, import: "default" }));
const FINAL_GOOD_AUDIO = Object.values(import.meta.glob("./final/good/*", { eager: true, import: "default" }));
const FINAL_BAD_AUDIO = Object.values(import.meta.glob("./final/bad/*", { eager: true, import: "default" }));

function pickRandomAudio(pool) {
  if (!Array.isArray(pool) || pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function stopAudio(playerRef) {
  if (!playerRef?.current) return;
  try {
    playerRef.current.pause();
    playerRef.current.currentTime = 0;
  } catch (err) {
    // ignore audio stop errors
  }
  playerRef.current = null;
}

function playRandomAudio(pool, playerRef) {
  const src = pickRandomAudio(pool);
  if (!src) return;
  stopAudio(playerRef);
  try {
    const audio = new Audio(src);
    playerRef.current = audio;
    void audio.play().catch(() => {});
  } catch (err) {
    // ignore audio play errors
  }
}

// ── Dark mode hook ────────────────────────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("nptel_theme") === "dark"; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    try { localStorage.setItem("nptel_theme", dark ? "dark" : "light"); } catch {}
  }, [dark]);
  return [dark, () => setDark((d) => !d)];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getAllAssignments() {
  return [...new Set(data.map((q) => q.assignment || 1))].sort((a, b) => a - b);
}

function getIndicesByAssignment(chosen) {
  const map = {};
  data.forEach((q, i) => {
    const a = q.assignment ?? 1;
    if (chosen && !chosen.includes(a)) return;
    if (!map[a]) map[a] = [];
    map[a].push(i);
  });
  return map;
}

// ── Mode selection screen ─────────────────────────────────────────────────────
function ModeSelect({ onSelect, initialSelected }) {
  const allAssignments = getAllAssignments();
  const def = initialSelected && initialSelected.length ? initialSelected : allAssignments;
  const [selected, setSelected] = useState(def);
  const [qMode, setQMode] = useState("assignment");

  function toggle(a) {
    setSelected((p) => p.includes(a) ? p.filter((x) => x !== a) : [...p, a].sort((x, y) => x - y));
  }

  const modes = [
    { key: "assignment", icon: "📋", label: "Assignment Wise", desc: "Questions in order, assignment by assignment" },
    { key: "random", icon: "🔀", label: "Fully Random", desc: "Shuffled across all selected assignments" },
    { key: "random-within", icon: "🎲", label: "Random Within Assignment", desc: "Shuffle questions inside each selected assignment" },
  ];

  return (
    <div className="mode-screen">
      <div className="mcv2-card">
        <div className="mcv2-top">
          <div>
            <h2 className="mcv2-title">Choose Practice Mode</h2>
            <p className="mcv2-sub">Select assignments and question mode.</p>
          </div>
          <button className="mcv2-icon-btn" aria-label="view list" tabIndex={-1}>
            <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
              <rect y="0" width="16" height="2" rx="1" fill="currentColor"/>
              <rect y="6" width="16" height="2" rx="1" fill="currentColor"/>
              <rect y="12" width="16" height="2" rx="1" fill="currentColor"/>
            </svg>
          </button>
        </div>

        <div className="mcv2-section">
          <div className="mcv2-assign-header">
            <div>
              <span className="mcv2-section-label">Select Assignments</span>
              <div className="mcv2-assign-count">Assignments Selected: {selected.length}</div>
            </div>
            <div className="mcv2-assign-actions">
              <button className="mcv2-sm-btn" onClick={() => setSelected([...allAssignments])}>Select All</button>
              <button className="mcv2-sm-btn" onClick={() => setSelected([])}>Clear</button>
            </div>
          </div>

          <div className="mcv2-assign-grid">
            {allAssignments.map((a) => {
              const sel = selected.includes(a);
              return (
                <div
                  key={a}
                  className={`mcv2-assign-item${sel ? " sel" : ""}`}
                  onClick={() => toggle(a)}
                  role="checkbox"
                  aria-checked={sel}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(a); } }}
                >
                  <div className={`mcv2-cb${sel ? " sel" : ""}`}>
                    {sel && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.8 6.5L9 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="mcv2-assign-label">Assignment {a}</span>
                  {sel && (
                    <svg className="mcv2-assign-tick" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8L6.5 11.5L13 4.5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
          <button className="mcv2-clear-btn" onClick={() => setSelected([])}>Clear Selection</button>
        </div>

        <div className="mcv2-section">
          <div className="mcv2-section-label">Select Question Mode</div>
          <div className="mcv2-mode-list">
            {modes.map((m) => (
              <div
                key={m.key}
                className={`mcv2-mode-item${qMode === m.key ? " sel" : ""}`}
                onClick={() => setQMode(m.key)}
                role="radio"
                aria-checked={qMode === m.key}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setQMode(m.key); } }}
              >
                <div className={`mcv2-radio${qMode === m.key ? " sel" : ""}`} />
                <span className="mcv2-mode-icon">{m.icon}</span>
                <div className="mcv2-mode-text">
                  <div className="mcv2-mode-label">{m.label}</div>
                  <div className="mcv2-mode-desc">{m.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          className="mcv2-start-btn"
          onClick={() => selected.length && onSelect(qMode, selected)}
          disabled={!selected.length}
        >
          Start Practice
        </button>
      </div>
    </div>
  );
}

// ── Manage Assignments Panel ──────────────────────────────────────────────────
function ManagePanel({ assignmentQueue, currentAQIdx, selectedAssignments, onRestartWith, onClose }) {
  const allAssignments = getAllAssignments();
  const [sel, setSel] = useState([...selectedAssignments]);

  function toggle(a) {
    setSel((p) => p.includes(a) ? p.filter((x) => x !== a) : [...p, a].sort((x, y) => x - y));
  }

  return (
    <div className="manage-overlay" onClick={onClose}>
      <div className="manage-panel" onClick={(e) => e.stopPropagation()}>
        <div className="manage-top">
          <span className="manage-title">Manage Assignments</span>
          <button className="mcv2-icon-btn" onClick={onClose} aria-label="close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="manage-queue">
          <div className="manage-section-label">Current Session</div>
          {assignmentQueue.map((a, i) => {
            const status = i < currentAQIdx ? "done" : i === currentAQIdx ? "current" : "upcoming";
            return (
              <div key={a} className={`manage-queue-item mqi-${status}`}>
                <span className="mqi-icon">{status === "done" ? "✓" : status === "current" ? "▶" : "○"}</span>
                <span>Assignment {a}</span>
                <span className="mqi-tag">{status === "done" ? "Done" : status === "current" ? "In progress" : "Upcoming"}</span>
              </div>
            );
          })}
        </div>

        <div className="manage-divider" />

        <div className="manage-section-label" style={{ marginBottom: 10 }}>Restart with:</div>
        <div className="mcv2-assign-grid">
          {allAssignments.map((a) => {
            const isSel = sel.includes(a);
            return (
              <div
                key={a}
                className={`mcv2-assign-item${isSel ? " sel" : ""}`}
                onClick={() => toggle(a)}
                role="checkbox"
                aria-checked={isSel}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(a); } }}
              >
                <div className={`mcv2-cb${isSel ? " sel" : ""}`}>
                  {isSel && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.8 6.5L9 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="mcv2-assign-label">Assignment {a}</span>
                {isSel && (
                  <svg className="mcv2-assign-tick" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8L6.5 11.5L13 4.5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button className="btn small" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button
            className="mcv2-start-btn"
            style={{ flex: 2, marginTop: 0, fontSize: 14, padding: "10px 16px" }}
            onClick={() => sel.length && onRestartWith(sel)}
            disabled={!sel.length}
          >
            Restart with Selection
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Assignment Transition Card ─────────────────────────────────────────────────
function AssignmentTransitionCard({ assignmentNum, answers, total, nextAssignmentNum, onNext, onFinish }) {
  const done = Object.keys(answers).length;
  const correct = Object.values(answers).filter((a) => a.correct).length;
  const accuracy = done === 0 ? 0 : Math.round((correct / done) * 100);

  return (
    <div className="card atc-card">
      <div className="atc-badge-row">
        <span className="atc-badge">✓ Completed</span>
      </div>
      <h2 className="atc-title">Assignment {assignmentNum} Done!</h2>
      <p className="atc-sub">{correct} / {total} correct · {accuracy}% accuracy</p>

      <div className="atc-stats-grid">
        <div className="stat">
          <div className="stat-value">{done}</div>
          <div className="stat-label">Answered</div>
        </div>
        <div className="stat">
          <div className="stat-value">{correct}</div>
          <div className="stat-label">Correct</div>
        </div>
        <div className="stat pct">
          <div className="stat-value">{accuracy}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
      </div>

      <div className="atc-actions">
        <button className="btn small" onClick={onFinish}>Finish Session</button>
        <button className="btn primary big-cta" onClick={onNext}>
          Next: Assignment {nextAssignmentNum} →
        </button>
      </div>
    </div>
  );
}

// ── Timer display ─────────────────────────────────────────────────────────────
function Timer({ seconds }) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return (
    <span className="timer">
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

export default function App() {
  const [mode, setMode] = useState(null);
  const [order, setOrder] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});       // current assignment only
  const [allAnswers, setAllAnswers] = useState({}); // cumulative across all assignments
  const [reveal, setReveal] = useState(false);
  const [finished, setFinished] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef(null);
  const autoAdvanceTimer = useRef(null);
  const [dark, toggleDark] = useDarkMode();
  const [bookmarks, setBookmarks] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("nptel_bookmarks") || "[]")); } catch { return new Set(); }
  });
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0); // eslint-disable-line no-unused-vars
  const [autoAdvance, setAutoAdvance] = useState(() => {
    try { return localStorage.getItem("nptel_auto_advance") === "1"; } catch { return false; }
  });
  const [selectedAssignments, setSelectedAssignments] = useState(getAllAssignments);
  const [assignmentQueue, setAssignmentQueue] = useState([]);
  const [currentAQIdx, setCurrentAQIdx] = useState(0);
  const [showManage, setShowManage] = useState(false);
  const soundPlayerRef = useRef(null);
  const finalSoundPlayedRef = useRef(false);

  // Canvas background mouse + pan/scale (used for grid + gold effect)
  const canvasBgRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  const total = order.length;

  function buildOrderForMode(m, chosen) {
    const indicesMap = getIndicesByAssignment(chosen);
    const assignNums = Object.keys(indicesMap).map(Number).sort((x, y) => x - y);
    if (m === "random") {
      const all = assignNums.flatMap((a) => indicesMap[a]);
      return shuffleIndices(all.length).map((k) => all[k]);
    }
    if (m === "random-within") {
      const result = [];
      assignNums.forEach((a) => {
        const arr = [...indicesMap[a]];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        result.push(...arr);
      });
      return result;
    }
    return assignNums.flatMap((a) => indicesMap[a]);
  }

  function startMode(m, assignments = null) {
    const chosen = assignments && assignments.length ? assignments : selectedAssignments;
    setSelectedAssignments(chosen);
    clearInterval(timerRef.current);
    stopAudio(soundPlayerRef);
    finalSoundPlayedRef.current = false;

    let o, queue = [], aqIdx = 0;
    if (m === "assignment") {
      const indicesMap = getIndicesByAssignment(chosen);
      queue = Object.keys(indicesMap).map(Number).sort((x, y) => x - y);
      o = indicesMap[queue[0]] || [];
    } else {
      o = buildOrderForMode(m, chosen);
    }

    setMode(m);
    setOrder(o);
    setIndex(0);
    setAnswers({});
    setAllAnswers({});
    setReveal(false);
    setFinished(false);
    setTimerSeconds(0);
    setAssignmentQueue(queue);
    setCurrentAQIdx(aqIdx);
    setShowManage(false);
    saveState({ mode: m, order: o, index: 0, answers: {}, allAnswers: {}, selectedAssignments: chosen, assignmentQueue: queue, currentAQIdx: aqIdx });
  }

  function goToNextAssignment() {
    const nextIdx = currentAQIdx + 1;
    const merged = { ...allAnswers, ...answers };
    clearInterval(timerRef.current);

    if (nextIdx >= assignmentQueue.length) {
      // All assignments done — show final stats
      setAllAnswers(merged);
      setFinished(true);
      return;
    }

    const indicesMap = getIndicesByAssignment(selectedAssignments);
    const nextAssignment = assignmentQueue[nextIdx];
    const nextOrder = indicesMap[nextAssignment] || [];

    setAllAnswers(merged);
    setCurrentAQIdx(nextIdx);
    setOrder(nextOrder);
    setIndex(0);
    setAnswers({});
    setReveal(false);
    setFinished(false);
    setTimerSeconds(0);
  }

  useEffect(() => {
    const s = loadState();
    const allAssignments = getAllAssignments();
    if (s && s.mode && s.order && Array.isArray(s.order) && s.order.length > 0) {
      // validate saved selected assignments against current data
      if (s.selectedAssignments && Array.isArray(s.selectedAssignments)) {
        const valid = s.selectedAssignments.filter((a) => allAssignments.includes(a));
        setSelectedAssignments(valid.length ? valid : allAssignments);
      } else {
        setSelectedAssignments(allAssignments);
      }

      // if assignment mode, rebuild assignmentQueue from current data to include any new assignments
      if (s.mode === "assignment") {
        const indicesMap = getIndicesByAssignment(s.selectedAssignments && s.selectedAssignments.length ? s.selectedAssignments : allAssignments);
        const queue = Object.keys(indicesMap).map(Number).sort((x, y) => x - y);
        setAssignmentQueue(queue);
        if (typeof s.currentAQIdx === "number") setCurrentAQIdx(Math.min(s.currentAQIdx, Math.max(0, queue.length - 1)));
      } else {
        if (s.assignmentQueue && Array.isArray(s.assignmentQueue)) setAssignmentQueue(s.assignmentQueue);
        if (typeof s.currentAQIdx === "number") setCurrentAQIdx(s.currentAQIdx);
      }

      if (s.allAnswers && typeof s.allAnswers === "object") setAllAnswers(s.allAnswers);
      setMode(s.mode);
      setOrder(s.order);
      setIndex(Math.min(s.index || 0, s.order.length - 1));
      setAnswers(s.answers || {});
    } else {
      // fallback: ensure selected assignments reflect current data
      setSelectedAssignments(allAssignments);
    }
    setHydrated(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hydrated || !mode) return;
    saveState({ mode, order, index, answers, allAnswers, selectedAssignments, assignmentQueue, currentAQIdx });
  }, [mode, order, index, answers, allAnswers, selectedAssignments, assignmentQueue, currentAQIdx, hydrated]);

  useEffect(() => {
    try { localStorage.setItem("nptel_auto_advance", autoAdvance ? "1" : "0"); } catch {}
  }, [autoAdvance]);

  useEffect(() => {
    return () => stopAudio(soundPlayerRef);
  }, []);

  function toggleBookmark(dataIdx) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(dataIdx)) next.delete(dataIdx);
      else next.add(dataIdx);
      try { localStorage.setItem("nptel_bookmarks", JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  useEffect(() => {
    const qIndexForReveal = order[index];
    if (qIndexForReveal == null) return;
    const a = answers[qIndexForReveal];
    setReveal(Boolean(a && a.chosen != null));
  }, [index, order, answers]);

  // Timer: count up per question, resets on question change
  useEffect(() => {
    if (!mode || finished) return;
    setTimerSeconds(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimerSeconds((t) => t + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [index, mode, finished]);

  const qIndex = order[index];
  const current = data[qIndex];

  function handleAnswer(chosen) {
    if (!current || (answers[qIndex] && answers[qIndex].chosen != null)) return;
    const isCorrect = String(chosen) === String(current.correctAnswer);
    setAnswers((prev) => ({ ...prev, [qIndex]: { chosen, correct: isCorrect } }));
    setReveal(true);
    if (isCorrect) {
      playRandomAudio(ANSWER_GOOD_AUDIO, soundPlayerRef);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak((m) => Math.max(m, newStreak));
      if (autoAdvance) {
        clearTimeout(autoAdvanceTimer.current);
        autoAdvanceTimer.current = setTimeout(() => next(), 1400);
      }
    } else {
      playRandomAudio(ANSWER_BAD_AUDIO, soundPlayerRef);
      setStreak(0);
    }
  }

  function next() {
    clearTimeout(autoAdvanceTimer.current);
    if (index < total - 1) {
      setIndex((i) => i + 1);
    } else {
      setFinished(true);
    }
  }

  function prev() {
    clearTimeout(autoAdvanceTimer.current);
    if (index > 0) {
      setIndex((i) => i - 1);
      setFinished(false);
    }
  }

  function restart() {
    clearTimeout(autoAdvanceTimer.current);
    clearInterval(timerRef.current);
    stopAudio(soundPlayerRef);
    finalSoundPlayedRef.current = false;
    setMode(null);
    setOrder([]);
    setIndex(0);
    setAnswers({});
    setAllAnswers({});
    setReveal(false);
    setFinished(false);
    setTimerSeconds(0);
    setAssignmentQueue([]);
    setCurrentAQIdx(0);
    setShowManage(false);
    setStreak(0);
    setMaxStreak(0);
    saveState({});
  }

  function reviewBookmarked() {
    const bookmarkedOrder = [...bookmarks].sort((a, b) => a - b);
    if (!bookmarkedOrder.length) return;
    clearTimeout(autoAdvanceTimer.current);
    clearInterval(timerRef.current);
    stopAudio(soundPlayerRef);
    finalSoundPlayedRef.current = false;
    setOrder(bookmarkedOrder);
    setAnswers({});
    setAllAnswers({});
    setFinished(false);
    setReveal(false);
    setIndex(0);
    setTimerSeconds(0);
    setAssignmentQueue([]);
    setCurrentAQIdx(0);
    setStreak(0);
    setMode("random");
  }

  function answerByIndex(optIdx) {
    const alreadyAnswered = answers[qIndex] && answers[qIndex].chosen != null;
    if (current && Array.isArray(current.options) && current.options[optIdx] != null && !reveal && !alreadyAnswered) {
      handleAnswer(current.options[optIdx]);
    }
  }

  function focusOption(direction) {
    try {
      const opts = Array.from(document.querySelectorAll(".card .options .option"));
      if (!opts.length) return;
      const active = document.activeElement;
      let idx = opts.indexOf(active);
      if (idx === -1) { idx = direction > 0 ? 0 : opts.length - 1; opts[idx].focus(); return; }
      let nextIdx = idx + direction;
      if (nextIdx < 0) nextIdx = 0;
      if (nextIdx > opts.length - 1) nextIdx = opts.length - 1;
      opts[nextIdx].focus();
    } catch (err) { /* ignore */ }
  }

  useKeyboard({
    onPrev: prev,
    onNext: () => {
      if (reveal) next();
      else {
        if (!answers[qIndex]) setAnswers((p) => ({ ...p, [qIndex]: { chosen: null, correct: false } }));
        next();
      }
    },
    onAnswerByIndex: answerByIndex,
    onFocusMove: (dir) => focusOption(dir),
    onSelectFocused: () => {
      const active = document.activeElement;
      if (active && active.classList && active.classList.contains("option") && !reveal) active.click();
    },
    onRestart: restart,
  });

  const doneCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter((a) => a.correct).length;
  const progressPct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  const accuracyPct = doneCount === 0 ? 0 : Math.round((correctCount / doneCount) * 100);
  const assignmentLabel = current ? `Assignment ${current.assignment}` : "";

  const isAssignmentMode = mode === "assignment";
  // Show the assignment-done transition screen (more assignments remain)
  const isAssignmentTransition = finished && isAssignmentMode && currentAQIdx < assignmentQueue.length - 1;
  // Final stats: either not assignment mode, or all assignments done
  const isFinalFinish = finished && !isAssignmentTransition;

  // Stats for the final screen
  const finalAnswers = isAssignmentMode ? { ...allAnswers, ...answers } : answers;
  const finalTotal = isAssignmentMode
    ? Object.values(getIndicesByAssignment(selectedAssignments)).reduce((s, a) => s + a.length, 0)
    : total;
  const finalDone = Object.keys(finalAnswers).length;
  const finalCorrect = Object.values(finalAnswers).filter((a) => a.correct).length;

  useEffect(() => {
    if (!isFinalFinish) {
      finalSoundPlayedRef.current = false;
      return;
    }
    if (finalSoundPlayedRef.current) return;

    const perfectScore = finalTotal > 0 && finalCorrect === finalTotal;
    playRandomAudio(perfectScore ? FINAL_GOOD_AUDIO : FINAL_BAD_AUDIO, soundPlayerRef);
    finalSoundPlayedRef.current = true;
  }, [isFinalFinish, finalCorrect, finalTotal]);

  return (
    <>
      {/* BACKGROUND CANVAS (fixed behind app) */}
      <div
        ref={canvasBgRef}
        className="fixed inset-0 pointer-events-none"
        onPointerMove={(e) => {
          try {
            const rect = canvasBgRef.current.getBoundingClientRect();
            setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          } catch (err) { /* ignore */ }
        }}
        style={{ zIndex: 0 }}
      >
        {/* GRID */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: `${8 * scale}px ${8 * scale}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
            opacity: 0.7,
          }}
        />

        {/* GOLD EFFECT */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(255,215,0,0.9) 1px, transparent 1px)",
            backgroundSize: `${8 * scale}px ${8 * scale}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
            maskImage: `radial-gradient(circle 90px at ${mousePos.x}px ${mousePos.y}px, white, transparent)`,
            WebkitMaskImage: `radial-gradient(circle 90px at ${mousePos.x}px ${mousePos.y}px, white, transparent)`,
            opacity: 0.6,
          }}
        />
      </div>

      <div className="app" style={{ position: "relative", zIndex: 10 }}>
      {!mode ? (
        <ModeSelect onSelect={startMode} initialSelected={selectedAssignments} />
      ) : (
        <>
          <Header
            total={total}
            correctCount={correctCount}
            doneCount={doneCount}
            index={index}
            answers={answers}
            order={order}
            onRestart={restart}
            onChangeMode={restart}
            assignmentMode={isAssignmentMode}
            assignmentQueue={assignmentQueue}
            currentAQIdx={currentAQIdx}
            onManage={() => setShowManage((v) => !v)}
            dark={dark}
            toggleDark={toggleDark}
            streak={streak}
            autoAdvance={autoAdvance}
            setAutoAdvance={setAutoAdvance}
          />

          {showManage && isAssignmentMode && (
            <ManagePanel
              assignmentQueue={assignmentQueue}
              currentAQIdx={currentAQIdx}
              selectedAssignments={selectedAssignments}
              onRestartWith={(newSel) => startMode("assignment", newSel)}
              onClose={() => setShowManage(false)}
            />
          )}

          <div style={{ marginTop: 8 }}>
            {isAssignmentTransition ? (
              <AssignmentTransitionCard
                assignmentNum={assignmentQueue[currentAQIdx]}
                answers={answers}
                total={total}
                nextAssignmentNum={assignmentQueue[currentAQIdx + 1]}
                onNext={goToNextAssignment}
                onFinish={() => {
                  setAllAnswers({ ...allAnswers, ...answers });
                  setCurrentAQIdx(assignmentQueue.length); // past end → isFinalFinish = true
                }}
              />
            ) : isFinalFinish ? (
              <StatsCard
                total={finalTotal}
                done={finalDone}
                correct={finalCorrect}
                progressPct={finalTotal === 0 ? 0 : Math.round((finalDone / finalTotal) * 100)}
                accuracyPct={finalDone === 0 ? 0 : Math.round((finalCorrect / finalDone) * 100)}
                onRestart={restart}
                onReview={() => {
                  if (isAssignmentMode) {
                    const indicesMap = getIndicesByAssignment(selectedAssignments);
                    const allNums = Object.keys(indicesMap).map(Number).sort((x, y) => x - y);
                    const flatOrder = allNums.flatMap((a) => indicesMap[a]);
                    setOrder(flatOrder);
                    setAnswers(finalAnswers);
                    setAllAnswers({});
                    setAssignmentQueue([]);
                    setCurrentAQIdx(0);
                  }
                  setFinished(false);
                  setIndex(0);
                }}
                bookmarkCount={bookmarks.size}
                onReviewBookmarked={reviewBookmarked}
              />
            ) : current ? (
              <>
                {isAssignmentMode && assignmentQueue.length > 1 && (
                  <div className="apb-banner">
                    <span className="apb-label">
                      Assignment {assignmentQueue[currentAQIdx]} of {assignmentQueue.length}
                    </span>
                    <div className="apb-dots">
                      {assignmentQueue.map((_, i) => (
                        <div key={i} className={`apb-dot${i < currentAQIdx ? " done" : i === currentAQIdx ? " current" : ""}`} />
                      ))}
                    </div>
                  </div>
                )}

                <QuestionCard
                  qitem={current}
                  onAnswer={handleAnswer}
                  answered={answers[qIndex]}
                  reveal={reveal}
                  isBookmarked={bookmarks.has(qIndex)}
                  onToggleBookmark={() => toggleBookmark(qIndex)}
                />
                {reveal && autoAdvance && answers[qIndex]?.correct && (
                  <div className="aa-countdown"><span /></div>
                )}

                <div className="actions">
                  <div>
                    <button className="btn small" onClick={prev} disabled={index === 0}>Prev</button>
                    <button
                      className="btn small"
                      onClick={() => {
                        if (!answers[qIndex]) setAnswers((p) => ({ ...p, [qIndex]: { chosen: null, correct: false } }));
                        next();
                      }}
                      style={{ marginLeft: 8 }}
                    >
                      Skip / Next
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      className="btn primary"
                      onClick={() => {
                        if (reveal) next();
                        else {
                          if (!answers[qIndex]) setAnswers((p) => ({ ...p, [qIndex]: { chosen: null, correct: false } }));
                          next();
                        }
                      }}
                    >
                      {index === total - 1
                        ? (isAssignmentMode && currentAQIdx < assignmentQueue.length - 1 ? "Finish Assignment" : "Finish")
                        : "Next"}
                    </button>
                  </div>
                </div>

                <div className="summary">
                  <div>
                    Answered: {doneCount} · Correct: {correctCount}
                    <span className="assignment-badge">{assignmentLabel}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {streak >= 2 && <span className="streak-badge">🔥 {streak} streak</span>}
                    <Timer seconds={timerSeconds} />
                    <span style={{ color: "var(--muted)", fontSize: 13 }}>Q {index + 1} / {total}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="card">
                <div style={{ fontSize: 18, fontWeight: 700 }}>No questions found</div>
                <p style={{ color: "var(--muted)" }}>Make sure src/assets/data.json has some questions.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
    </>
  );
}
