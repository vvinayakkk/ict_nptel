import React from "react";

export default function StatsCard({
  total = 0,
  done = 0,
  correct = 0,
  progressPct = 0,
  accuracyPct = 0,
  onRestart = () => {},
  onReview = () => {},
  bookmarkCount = 0,
  onReviewBookmarked = () => {},
}) {
  return (
    <div className="card stats-card" role="status" aria-live="polite">
      <div className="stats-header">
        <h2>Session complete</h2>
        <p className="small-muted">Good work — review your session or restart for a new shuffled run.</p>
      </div>

      <div className="stats-grid" aria-hidden>
        <div className="stat">
          <div className="stat-value">{done}</div>
          <div className="stat-label">Answered</div>
        </div>
        <div className="stat">
          <div className="stat-value">{correct}</div>
          <div className="stat-label">Correct</div>
        </div>
        <div className="stat">
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat pct">
          <div className="stat-value">{accuracyPct}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
      </div>

      <div className="stats-bar" aria-hidden>
        <div className="progress-bar small" style={{ height: 10, marginTop: 8 }}>
          <i style={{ width: `${progressPct}%`, borderRadius: 999 }} />
        </div>
        <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
          Progress: {progressPct}% ({done}/{total})
        </div>
      </div>

      <div className="stats-actions" style={{ marginTop: 16 }}>
        <div>
          {bookmarkCount > 0 && (
            <button className="btn small" onClick={onReviewBookmarked} title="Review only your bookmarked questions">
              ★ Review Bookmarked ({bookmarkCount})
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn small" onClick={onReview}>
            Review
          </button>
          <button className="btn primary big-cta" onClick={onRestart}>
            Restart
          </button>
        </div>
      </div>
    </div>
  );
}

