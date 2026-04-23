import React from "react";
import Progress from "./Progress";

// Moon icon SVG
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}
// Sun icon SVG
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

export default function Header({
  total, correctCount, doneCount, index, answers, order,
  onRestart, onChangeMode, assignmentMode, assignmentQueue, currentAQIdx, onManage,
  dark, toggleDark, streak, autoAdvance, setAutoAdvance,
}) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <div className="logo">
            <img src="/logo.svg" alt="NPTEL Prep logo" />
          </div>
          <div className="title">
            <h1>NPTEL Prep</h1>
            {assignmentMode && assignmentQueue && assignmentQueue.length > 0 ? (
              <p>Assignment {assignmentQueue[currentAQIdx]} of {assignmentQueue.length} · Q {index + 1}/{total}</p>
            ) : (
              <p>One question at a time · Keyboard: ← → · 1-5</p>
            )}
          </div>
        </div>
        <div className="header-right">
          <div className="score-progress">
            <div className="score-block">
              <div className="small-muted">Score</div>
              <div className="big">{correctCount} / {total}</div>
            </div>
            <Progress total={total} answers={answers} order={order} index={index} />
          </div>
          <div className="header-btns">
            {streak >= 2 && (
              <span className="streak-badge">🔥 {streak}</span>
            )}
            <button
              className={`auto-advance-btn${autoAdvance ? " on" : ""}`}
              onClick={() => setAutoAdvance((v) => !v)}
              title={autoAdvance ? "Auto-advance ON — click to turn off" : "Auto-advance OFF — click to enable"}
            >
              <span className="aa-dot" />
              {autoAdvance ? "Auto ✓" : "Auto"}
            </button>
            {assignmentMode && (
              <button className="btn small manage-btn" onClick={onManage}>
                ⚙ Manage
              </button>
            )}
            <button className="btn small" onClick={onChangeMode}>
              Change Mode
            </button>
            <button className="btn restart-btn" onClick={onRestart}>
              Restart
            </button>
            <button
              className="theme-toggle-btn"
              onClick={toggleDark}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              title={dark ? "Light mode" : "Dark mode"}
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

