export default function QuestionCard({
  qitem,
  onAnswer,
  answered, // { chosen, correct } or undefined
  reveal,
  isBookmarked,
  onToggleBookmark,
}) {
  const isAnswered = Boolean(answered && answered.chosen != null);
  return (
    <div className="card" aria-live="polite">
      <div className="q-top">
        <div className="q-count">Question</div>
        <button
          className={`q-bookmark-btn${isBookmarked ? " active" : ""}`}
          onClick={onToggleBookmark}
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this question"}
          title={isBookmarked ? "Remove bookmark" : "Bookmark this question"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>

      <div className="question" dangerouslySetInnerHTML={{ __html: qitem.question }} />

      <div className="options">
        {qitem.options.map((opt, i) => {
          const isChosen = answered && answered.chosen === opt;
          const isCorrect = qitem.correctAnswer === opt;
          let cls = "option";
          if (reveal) {
            if (isCorrect) cls += " correct";
            else if (isChosen && !isCorrect) cls += " wrong";
            else cls += " disabled";
          } else if (isAnswered) {
            // when revisiting an answered question, highlight chosen and make others non-interactive
            if (isChosen) cls += " chosen";
            else cls += " disabled";
          }

          return (
            <div
              key={i}
              className={cls}
              role="button"
              tabIndex={0}
              onClick={() => {
                // only accept answers when not revealed and not already answered
                if (!reveal && !isAnswered) onAnswer(opt);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (!reveal && !isAnswered) onAnswer(opt);
                }
              }}
              aria-pressed={isChosen ? "true" : "false"}
              aria-disabled={isAnswered || reveal ? "true" : "false"}
            >
              <div className="dot">{String.fromCharCode(65 + i)}</div>
              <div className="text" dangerouslySetInnerHTML={{ __html: opt }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
